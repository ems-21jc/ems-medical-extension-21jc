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
      emptyOutDir: false, // Évite de freeze le chargement du navigateur en mode watch
      minify: false,
      rollupOptions: {
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
        
        // Ajout des fichiers statiques spécifiques à surveiller (Vite gère déjà le JS tout seul)
        buildStart() {
          const srcDir = resolve(__dirname, 'src');
          if (fs.existsSync(srcDir)) {
            // On ne watch manuellement que ce que Vite ignore (HTML, CSS, JSON)
            const files = fs.readdirSync(srcDir);
            files.forEach(file => {
              const ext = extname(file);
              if (file === 'popup.html' || file === 'content.css' || (ext === '.json' && file !== 'package.json')) {
                this.addWatchFile(resolve(srcDir, file));
              }
            });
          }
        },

        // Exécuté à la fin de l'écriture
        writeBundle() {
          const manifestSource = resolve(__dirname, `src/manifest.${target}.json`);
          const manifestTarget = resolve(__dirname, `dist/${target}/manifest.json`);
          const cssSource = resolve(__dirname, 'src/content.css');
          const cssTarget = resolve(__dirname, `dist/${target}/content.css`);
          const popupSource = resolve(__dirname, 'src/popup.html');
          const popupTarget = resolve(__dirname, `dist/${target}/popup.html`);
          const polyfillSource = resolve(__dirname, 'node_modules/webextension-polyfill/dist/browser-polyfill.js');
          const polyfillTarget = resolve(__dirname, `dist/${target}/browser-polyfill.js`);

          const srcDir = resolve(__dirname, 'src');
          const distDir = resolve(__dirname, `dist/${target}`);

          if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
          }

          // 1. Copie des fichiers .json (ex: pathologies.json) sans toucher à la source
          if (fs.existsSync(srcDir)) {
            const files = fs.readdirSync(srcDir);
            files.forEach(file => {
              if (extname(file) === '.json' && !file.startsWith('manifest.')) {
                fs.copyFileSync(resolve(srcDir, file), resolve(distDir, file));
              }
            });
          }

          // 2. Génération du manifest uniquement dans dist/ (Crucial pour casser la boucle infinie)
          if (fs.existsSync(manifestSource)) {
            const manifestData = JSON.parse(fs.readFileSync(manifestSource, 'utf-8'));
            manifestData.version = pkg.version;
            // 🛑 On NE réécrit PLUS dans manifestSource (src/), uniquement dans manifestTarget (dist/) !
            fs.writeFileSync(manifestTarget, JSON.stringify(manifestData, null, 2));
          }

          // 3. Copie du fichier CSS
          if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
          }

          // 4. Copie du fichier popup.html
          if (fs.existsSync(popupSource)) {
            fs.copyFileSync(popupSource, popupTarget);
          }

          // 5. Copie du polyfill
          if (fs.existsSync(polyfillSource)) {
            fs.copyFileSync(polyfillSource, polyfillTarget);
          }

          // 6. Copie des icônes
          const iconsSourceDir = resolve(__dirname, 'src/icons');
          const iconsTargetDir = resolve(distDir, 'icons');
          if (fs.existsSync(iconsSourceDir)) {
            if (!fs.existsSync(iconsTargetDir)) {
              fs.mkdirSync(iconsTargetDir, { recursive: true });
            }
            const files = fs.readdirSync(iconsSourceDir);
            for (const file of files) {
              fs.copyFileSync(resolve(iconsSourceDir, file), resolve(iconsTargetDir, file));
            }
          }

          // Un seul log propre et unique par build
          console.log(`\n⚡ [${target.toUpperCase()}] Build & Synchro OK (v${pkg.version})`);
        }
      }
    ]
  };
});