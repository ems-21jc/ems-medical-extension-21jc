import { defineConfig } from "vite";
import { resolve, basename, extname } from "path";
import fs from "fs";

/**
 * Génère automatiquement les points d'entrée pour les fichiers .js à la racine de src/
 * Gère le filtrage pour la version Lite
 */
function getDynamicInputs(isLite) {
  const srcDir = resolve(__dirname, "src");
  const inputs = {};

  // Fichiers à exclure de la version Lite
  const liteExclusions = [
    "medicalFileCompletion",
    "bodyZoneCompletion",
    "medicalCheckupCompletion",
  ];

  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);

    files.forEach((file) => {
      const filePath = resolve(srcDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && extname(file) === ".js") {
        const name = basename(file, ".js");

        // Si on est en mode Lite et que le fichier fait partie des exclusions, on l'ignore
        if (isLite && liteExclusions.includes(name)) {
          return;
        }

        inputs[name] = filePath;
      }
    });
  }

  return inputs;
}

export default defineConfig(({ mode }) => {
  // Détection du navigateur et de la variante Lite
  // Modes attendus : "chrome", "firefox", "chrome-lite", "firefox-lite"
  const isLite = mode.endsWith("-lite");
  const target = mode.startsWith("firefox") ? "firefox" : "chrome";

  // Le dossier final contiendra "-lite" si nécessaire (ex: dist/chrome ou dist/chrome-lite)
  const outputFolderName = isLite ? `${target}-lite` : target;

  const dynamicInputs = getDynamicInputs(isLite);

  return {
    root: "src",

    build: {
      outDir: resolve(__dirname, `dist/${outputFolderName}`),
      emptyOutDir: false,
      minify: false,

      rollupOptions: {
        input: dynamicInputs,
        output: {
          entryFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
          chunkFileNames: "[name].js",
          format: "es",
        },
      },
    },

    plugins: [
      {
        name: "manifest-and-assets-copier",

        buildStart() {
          const srcDir = resolve(__dirname, "src");

          // package.json
          this.addWatchFile(resolve(__dirname, "package.json"));

          // manifests
          this.addWatchFile(resolve(__dirname, "src/manifest.chrome.json"));
          this.addWatchFile(resolve(__dirname, "src/manifest.firefox.json"));

          if (fs.existsSync(srcDir)) {
            const files = fs.readdirSync(srcDir);

            files.forEach((file) => {
              const filePath = resolve(srcDir, file);
              const stat = fs.statSync(filePath);

              if (!stat.isFile()) return;

              if ([".js", ".json", ".html", ".css"].includes(extname(file))) {
                if (file.startsWith("manifest.")) return;
                this.addWatchFile(filePath);
              }
            });
          }

          // Icons
          const iconsDir = resolve(__dirname, "src/icons");
          if (fs.existsSync(iconsDir)) {
            fs.readdirSync(iconsDir).forEach((file) => {
              this.addWatchFile(resolve(iconsDir, file));
            });
          }
        },

        writeBundle() {
          const pkg = JSON.parse(
            fs.readFileSync(resolve(__dirname, "package.json"), "utf-8"),
          );

          const manifestSource = resolve(
            __dirname,
            `src/manifest.${target}.json`,
          );
          const manifestTarget = resolve(
            __dirname,
            `dist/${outputFolderName}/manifest.json`,
          );
          const cssSource = resolve(__dirname, "src/content.css");
          const cssTarget = resolve(
            __dirname,
            `dist/${outputFolderName}/content.css`,
          );
          const polyfillSource = resolve(
            __dirname,
            "node_modules/webextension-polyfill/dist/browser-polyfill.js",
          );
          const polyfillTarget = resolve(
            __dirname,
            `dist/${outputFolderName}/browser-polyfill.js`,
          );

          const srcDir = resolve(__dirname, "src");
          const distDir = resolve(__dirname, `dist/${outputFolderName}`);

          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
          }

          // Copie des JSON (hors manifests de base)
          if (fs.existsSync(srcDir)) {
            fs.readdirSync(srcDir).forEach((file) => {
              if (extname(file) === ".json" && !file.startsWith("manifest.")) {
                fs.copyFileSync(resolve(srcDir, file), resolve(distDir, file));
              }
            });
          }

          // Copie de tous les fichiers HTML
          if (fs.existsSync(srcDir)) {
            fs.readdirSync(srcDir).forEach((file) => {
              if (extname(file) === ".html") {
                fs.copyFileSync(resolve(srcDir, file), resolve(distDir, file));
              }
            });
          }

          // Génération et ALTÉRATION du manifest
          if (fs.existsSync(manifestSource)) {
            const manifestData = JSON.parse(
              fs.readFileSync(manifestSource, "utf-8"),
            );

            // Injecte la version globale du package.json
            manifestData.version = pkg.version;

            // 🌟 LOGIQUE DYNAMIQUE LITE 🌟
            if (isLite) {
              // 1. On modifie le nom pour le store
              manifestData.name = `${manifestData.name}-lite`;

              // 2. On nettoie le tableau content_scripts pour ne garder que ce qui est compilé
              if (manifestData.content_scripts) {
                manifestData.content_scripts.forEach((script) => {
                  if (script.js) {
                    script.js = script.js.filter((jsFile) => {
                      // On garde le polyfill ou les scripts qui sont toujours dans dynamicInputs
                      return (
                        jsFile === "browser-polyfill.js" ||
                        !!dynamicInputs[basename(jsFile, ".js")]
                      );
                    });
                  }
                });
              }
            }

            fs.writeFileSync(
              manifestTarget,
              JSON.stringify(manifestData, null, 2),
            );
          }

          // CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          // Polyfill
          if (fs.existsSync(polyfillSource)) {
            fs.copyFileSync(polyfillSource, polyfillTarget);
          }

          // Icons
          const iconsSourceDir = resolve(__dirname, "src/icons");
          const iconsTargetDir = resolve(distDir, "icons");

          if (fs.existsSync(iconsSourceDir)) {
            if (!fs.existsSync(iconsTargetDir)) {
              fs.mkdirSync(iconsTargetDir, { recursive: true });
            }
            fs.readdirSync(iconsSourceDir).forEach((file) => {
              fs.copyFileSync(
                resolve(iconsSourceDir, file),
                resolve(iconsTargetDir, file),
              );
            });
          }

          console.log(
            `\n⚡ [${outputFolderName.toUpperCase()}] Build & Synchro OK (v${pkg.version})`,
          );
        },
      },
    ],
  };
});
