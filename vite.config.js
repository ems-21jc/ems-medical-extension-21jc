import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Lecture dynamique de la version du package.json
const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(({ mode }) => {
  const target = mode === 'firefox' ? 'firefox' : 'chrome';

  return {
    root: 'src',
    build: {
      outDir: resolve(__dirname, `dist/${target}`),
      emptyOutDir: true,
      minify: false, // Plus propre pour lire le code injecté sur l'intra
      rollupOptions: {
        input: {
          dateFieldCompletion: resolve(__dirname, 'src/dateFieldCompletion.js'),
          medicalFileCompletion: resolve(__dirname, 'src/medicalFileCompletion.js'),
          bodyZoneCompletion:   resolve(__dirname, 'src/bodyZoneCompletion.js'),
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          chunkFileNames: '[name].js',
          format: 'es' // Format standard ES, compatible multi-inputs et idéal pour les Content Scripts isolés
        }
      }
    },
    plugins: [
      {
        name: 'manifest-and-assets-copier',
        closeBundle() {
          const manifestSource = resolve(__dirname, `src/manifest.${target}.json`);
          const manifestTarget = resolve(__dirname, `dist/${target}/manifest.json`);
          const cssSource = resolve(__dirname, 'src/content.css');
          const cssTarget = resolve(__dirname, `dist/${target}/content.css`);
          
          // Récupération automatique du polyfill depuis node_modules
          const polyfillSource = resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js');
          const polyfillTarget = resolve(__dirname, `dist/${target}/browser-polyfill.js`);

          // 1. Synchronisation et copie du manifest spécifique
          if (fs.existsSync(manifestSource)) {
            const manifestData = JSON.parse(fs.readFileSync(manifestSource, 'utf-8'));
            
            // Injection de la version du package.json
            manifestData.version = pkg.version;
            
            // Mise à jour du fichier SOURCE (dans src/)
            fs.writeFileSync(manifestSource, JSON.stringify(manifestData, null, 2));

            // Écriture du fichier final de PRODUCTION (dans dist/)
            fs.writeFileSync(manifestTarget, JSON.stringify(manifestData, null, 2));
          }

          // 2. Copie du fichier CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          // 3. Copie du fichier polyfill requis par l'ordre des manifests
          if (fs.existsSync(polyfillSource)) {
            fs.copyFileSync(polyfillSource, polyfillTarget);
          } else {
            console.error(`❌ Impossible de trouver le polyfill dans node_modules à l'emplacement : ${polyfillSource}`);
          }

          // 4. Copie du dossier des icônes
          const iconsSourceDir = resolve(__dirname, 'src/icons');
          const iconsTargetDir = resolve(__dirname, `dist/${target}/icons`);

          if (fs.existsSync(iconsSourceDir)) {
            // Création du dossier de destination s'il n'existe pas encore
            if (!fs.existsSync(iconsTargetDir)) {
              fs.mkdirSync(iconsTargetDir, { recursive: true });
            }

            // Lecture et copie de chaque icône présente
            const files = fs.readdirSync(iconsSourceDir);
            for (const file of files) {
              fs.copyFileSync(resolve(iconsSourceDir, file), resolve(iconsTargetDir, file));
            }
            console.log(`✅ Dossier icônes synchronisé pour ${target.toUpperCase()}`);
          }

          console.log(`\n🎉 Version synchronisée (${pkg.version}) et extension compilée avec succès pour ${target.toUpperCase()} !`);
        }
      }
    ]
  };
});