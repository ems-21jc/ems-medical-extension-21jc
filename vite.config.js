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
        },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          chunkFileNames: '[name].js'
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

          if (fs.existsSync(manifestSource)) {
            const manifestData = JSON.parse(fs.readFileSync(manifestSource, 'utf-8'));
            
            // Injection de la version du package.json
            manifestData.version = pkg.version;
            
            // 1. Métamorphose/Mise à jour du fichier SOURCE (dans src/) pour garder la bonne version
            fs.writeFileSync(manifestSource, JSON.stringify(manifestData, null, 2));

            // 2. Écriture du fichier final de PRODUCTION (dans dist/)
            fs.writeFileSync(manifestTarget, JSON.stringify(manifestData, null, 2));
          }

          // Copie le CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          console.log(`\n🎉 Version synchronisée (${pkg.version}) et extension compilée pour ${target.toUpperCase()} !`);
        }
      }
    ]
  };
});