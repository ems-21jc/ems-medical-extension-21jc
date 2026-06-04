import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Lecture dynamique de la version du package.json
const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(({ mode }) => {
  const target = mode === 'firefox' ? 'firefox' : 'chrome';
  
  // Détection du mode développement (--watch)
  const isDevelopment = process.argv.includes('--watch');

  return {
    // On nettoie l'objet esbuild racine pour ne laisser que ce que le build global doit savoir, et on injecte les options spécifiques dans optimizeDeps
    esbuild: {
      keepNames: true
    },
    build: {
      outDir: resolve(__dirname, `dist/${target}`),
      emptyOutDir: true,
      // En mode dev, false. En production, on utilise 'esbuild'
      minify: isDevelopment ? false : 'esbuild', 
      sourcemap: false,
      rollupOptions: {
        input: {
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
    // On s'assure que les options d'esbuild sont appliquées à la fois pour le build et pour l'optimisation des dépendances
    optimizeDeps: {
      esbuildOptions: {
        keepNames: true,
        minifyIdentifiers: false,
        minifySyntax: true,
        minifyWhitespace: true
      }
    },
    plugins: [
      {
        name: 'manifest-and-assets-copier',
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