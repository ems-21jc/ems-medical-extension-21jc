import { defineConfig } from "vite";
import { resolve, basename, extname } from "path";
import fs from "fs";

/**
 * Génère automatiquement les points d'entrée pour tous les fichiers .js à la racine de src/
 */
function getDynamicInputs() {
  const srcDir = resolve(__dirname, "src");
  const inputs = {};

  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);

    files.forEach((file) => {
      const filePath = resolve(srcDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && extname(file) === ".js") {
        const name = basename(file, ".js");
        inputs[name] = filePath;
      }
    });
  }

  return inputs;
}

export default defineConfig(({ mode }) => {
  const target = mode === "firefox" ? "firefox" : "chrome";
  const dynamicInputs = getDynamicInputs();

  return {
    root: "src",

    build: {
      outDir: resolve(__dirname, `dist/${target}`),
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

              if (!stat.isFile()) {
                return;
              }

              // JS
              if (extname(file) === ".js") {
                this.addWatchFile(filePath);
              }

              // JSON
              if (extname(file) === ".json" && !file.startsWith("manifest.")) {
                this.addWatchFile(filePath);
              }

              // HTML
              if (extname(file) === ".html") {
                this.addWatchFile(filePath);
              }

              // CSS
              if (extname(file) === ".css") {
                this.addWatchFile(filePath);
              }
            });
          }

          // Icons
          const iconsDir = resolve(__dirname, "src/icons");

          if (fs.existsSync(iconsDir)) {
            const icons = fs.readdirSync(iconsDir);

            icons.forEach((file) => {
              this.addWatchFile(resolve(iconsDir, file));
            });
          }
        },

        writeBundle() {
          // Relecture dynamique du package.json à chaque build
          const pkg = JSON.parse(
            fs.readFileSync(resolve(__dirname, "package.json"), "utf-8"),
          );

          const manifestSource = resolve(
            __dirname,
            `src/manifest.${target}.json`,
          );

          const manifestTarget = resolve(
            __dirname,
            `dist/${target}/manifest.json`,
          );

          const cssSource = resolve(__dirname, "src/content.css");

          const cssTarget = resolve(__dirname, `dist/${target}/content.css`);

          const popupSource = resolve(__dirname, "src/popup.html");

          const popupTarget = resolve(__dirname, `dist/${target}/popup.html`);

          const polyfillSource = resolve(
            __dirname,
            "node_modules/webextension-polyfill/dist/browser-polyfill.js",
          );

          const polyfillTarget = resolve(
            __dirname,
            `dist/${target}/browser-polyfill.js`,
          );

          const srcDir = resolve(__dirname, "src");
          const distDir = resolve(__dirname, `dist/${target}`);

          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, {
              recursive: true,
            });
          }

          // Copie des JSON
          if (fs.existsSync(srcDir)) {
            const files = fs.readdirSync(srcDir);

            files.forEach((file) => {
              if (extname(file) === ".json" && !file.startsWith("manifest.")) {
                fs.copyFileSync(resolve(srcDir, file), resolve(distDir, file));
              }
            });
          }

          // Génération du manifest
          if (fs.existsSync(manifestSource)) {
            const manifestData = JSON.parse(
              fs.readFileSync(manifestSource, "utf-8"),
            );

            manifestData.version = pkg.version;

            fs.writeFileSync(
              manifestTarget,
              JSON.stringify(manifestData, null, 2),
            );
          }

          // CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          // Popup
          if (fs.existsSync(popupSource)) {
            fs.copyFileSync(popupSource, popupTarget);
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

            const files = fs.readdirSync(iconsSourceDir);

            for (const file of files) {
              fs.copyFileSync(
                resolve(iconsSourceDir, file),
                resolve(iconsTargetDir, file),
              );
            }
          }

          console.log(
            `\n⚡ [${target.toUpperCase()}] Build & Synchro OK (v${pkg.version})`,
          );
        },
      },
    ],
  };
});
