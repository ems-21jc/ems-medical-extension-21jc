import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

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

          // Copie et renomme le bon manifest
          if (fs.existsSync(manifestSource)) {
            fs.copyFileSync(manifestSource, manifestTarget);
          }

          // Copie le CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          console.log(`\n🎉 Extension compilée avec succès pour ${target.toUpperCase()} !`);
        }
      }
    ]
  };
});