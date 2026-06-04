import { defineConfig } from 'vite';
import { resolve, basename, extname } from 'path';
import fs from 'fs';

// Lecture dynamique de la version du package.json
const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

/**
 * Génère automatiquement les points d'entrée pour tous les fichiers .js à la racine de src/
 */
function getDynamicInputs() {
  const srcDir = resolve(__dirname, 'src');
  const inputs = {};

  if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    
    files.forEach(file => {
      const filePath = resolve(srcDir, file);
      const stat = fs.statSync(filePath);
      
      // On ne prend que les fichiers (pas les dossiers) qui finissent par .js
      if (stat.isFile() && extname(file) === '.js') {
        const name = basename(file, '.js');
        inputs[name] = filePath;
      }
    });
  }
  
  return inputs;
}

export default defineConfig(({ mode }) => {
  const target = mode === 'firefox' ? 'firefox' : 'chrome';
  const dynamicInputs = getDynamicInputs();

  return {
    root: 'src',
    build: {
      outDir: resolve(__dirname, `dist/${target}`),
      emptyOutDir: true,
      minify: false, // Plus propre pour lire le code injecté sur l'intra
      rollupOptions: {
        // 💡 AUTO : L'objet input se remplit tout seul avec tous tes scripts JS
        input: dynamicInputs,
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
        closeBundle() {
          const manifestSource = resolve(__dirname, `src/manifest.${target}.json`);
          const manifestTarget = resolve(__dirname, `dist/${target}/manifest.json`);
          const cssSource = resolve(__dirname, 'src/content.css');
          const cssTarget = resolve(__dirname, `dist/${target}/content.css`);
          
          // Gestion automatique de TOUS les fichiers .json présents à la racine de src/
          // (Gère automatiquement pathologies.json ou tout autre futur JSON)
          const srcDir = resolve(__dirname, 'src');
          if (fs.existsSync(srcDir)) {
            const files = fs.readdirSync(srcDir);
            files.forEach(file => {
              if (extname(file) === '.json' && !file.startsWith('manifest.')) {
                const jsonSource = resolve(srcDir, file);
                const jsonTarget = resolve(__dirname, `dist/${target}`, file);
                fs.copyFileSync(jsonSource, jsonTarget);
              }
            });
            console.log(`✅ Fichiers de données JSON synchronisés pour ${target.toUpperCase()}`);
          }

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
            if (!fs.existsSync(iconsTargetDir)) {
              fs.mkdirSync(iconsTargetDir, { recursive: true });
            }
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