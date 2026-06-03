import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Lecture dynamique de la version du package.json
const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(({ mode }) => {
  const target = mode === 'firefox' ? 'firefox' : 'chrome';

  return {
    // 1. On retire root: 'src' pour laisser la racine du projet à la base de ton projet.
    // Cela évite les conflits de chemins doublés "src/src/..."
    build: {
      outDir: resolve(__dirname, `dist/${target}`),
      emptyOutDir: true,
      minify: false, // Pas de minification pour faciliter le debug (à activer en production si besoin)
      sourcemap: false, // Pas de sourcemaps pour éviter les problèmes de chemins et de confidentialité (à activer en développement si besoin)
      rollupOptions: {
        input: {
          // Les chemins absolus vers tes fichiers sources sont maintenant corrects et cohérents
          dateFieldCompletion: resolve(__dirname, 'src/dateFieldCompletion.js'),
          medicalFileCompletion: resolve(__dirname, 'src/medicalFileCompletion.js'),
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          chunkFileNames: '[name].js',
          format: 'es'
        }
      }
    },
    plugins: [
      {
        name: 'manifest-and-assets-copier',
        // writeBundle s'exécute à chaque écriture sur le disque (idéal pour le mode build ET le mode --watch)
        writeBundle() {
          const manifestSource = resolve(__dirname, `src/manifest.${target}.json`);
          const manifestTarget = resolve(__dirname, `dist/${target}/manifest.json`);
          const cssSource = resolve(__dirname, 'src/content.css');
          const cssTarget = resolve(__dirname, `dist/${target}/content.css`);
          
          const polyfillSource = resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js');
          const polyfillTarget = resolve(__dirname, `dist/${target}/browser-polyfill.js`);

          // 1. Synchronisation et copie du manifest spécifique
          if (fs.existsSync(manifestSource)) {
            const manifestData = JSON.parse(fs.readFileSync(manifestSource, 'utf-8'));
            manifestData.version = pkg.version;
            fs.writeFileSync(manifestSource, JSON.stringify(manifestData, null, 2));
            fs.writeFileSync(manifestTarget, JSON.stringify(manifestData, null, 2));
          }

          // 2. Copie du fichier CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          // 3. Copie du fichier polyfill
          if (fs.existsSync(polyfillSource)) {
            fs.copyFileSync(polyfillSource, polyfillTarget);
          } else {
            console.error(`❌ Impossible de trouver le polyfill dans node_modules : ${polyfillSource}`);
          }

          // 4. Copie du dossier des icônes
          const iconsSourceDir = resolve(__dirname, 'src/icons');
          const iconsTargetDir = resolve(__dirname, `dist/${target}/icons`);

          if (fs.existsSync(iconsSourceDir)) {
            if (!fs.existsSync(iconsTargetDir)) {
              fs.mkdirSync(iconsTargetDir, { recursive: true });
            }
            const files = fs.readdirSync(iconsSourceDir);
            for (const file of files) {
              fs.copyFileSync(resolve(iconsSourceDir, file), resolve(iconsTargetDir, file));
            }
            console.log(`✅ Dossier icônes synchronisé pour ${target.toUpperCase()}`);
          }

          console.log(`\n🎉 Version synchronisée (${pkg.version}) et extension compilée pour ${target.toUpperCase()} !`);
        }
      }
    ]
  };
});