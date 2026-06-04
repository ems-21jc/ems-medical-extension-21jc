# EMS Medical Tools - 21 Jump Click

Extension pour navigateurs (Chrome et Firefox) conçue pour automatiser et faciliter la rédaction des dossiers et rapports médicaux pour les joueurs EMS sur l'intranet du serveur **21 JumpClick**.

## 🚀 Fonctionnalités
* **Complétion automatique** des structures de rapports médicaux (Notes internes, Accidents, etc.).
* **Remplissage rapide des dates** (Visites médicales, Dons de sang, Visites de contrôle avec calcul automatique de la durée d'invalidité).
* **Compatibilité Cross-Browser** native (Chrome et Firefox) grâce à l'intégration de `webextension-polyfill`.
* **Compilation optimisée** via Vite.

---

## 🛠️ Installation et Configuration Initiale

Avant de pouvoir utiliser les commandes de build, installe les dépendances Node.js du projet :

```bash
npm install

```

### Structure des dossiers requise :

```text
Extension_EMS_21jc/
├── dist/                           # Dossiers de builds finaux (générés automatiquement)
├── src/                            # Fichiers sources de travail
│   ├── icons/                      # 📁 Nouveau dossier pour l'identité visuelle
│   │   ├── icon16.png              # Placeholder / Icône finale 16x16
│   │   ├── icon32.png              # Placeholder / Icône finale 32x32
│   │   ├── icon48.png              # Placeholder / Icône finale 48x48
│   │   └── icon128.png             # Placeholder / Icône finale 128x128
|   ├── bodyZoneCompletion.js       # Panneau de sélection des pathologies
│   ├── content.css                 # Styles injectés sur l'intranet
│   ├── dateFieldCompletion.js      # Logique de complétion des dates
│   ├── medicalFileCompletion.js    # Logique de rédaction des rapports
│   ├── manifest.chrome.json        # Configuration spécifique à Google Chrome (avec clés icons et action)
│   ├── manifest.firefox.json       # Configuration spécifique à Mozilla Firefox (avec clés icons et action)
|   └── pathologies.json            # Liste des pathologies
├── vite.config.js                  # Configuration de compilation Vite (avec copie automatique du dossier icons)
└── package.json                    # Dépendances et scripts
```

---

## 💻 Commandes de Développement et Build

### 1. Google Chrome

* **Lancer le développement continu (mode "watch") :**
```bash
npm run dev:chrome
```


* **Générer le build de production optimisé :**
```bash
npm run build:chrome
```



👉 **Installation dans Chrome :** 1. Ouvre l'onglet `chrome://extensions/`.
2. Active le **Mode développeur** en haut à droite.
3. Clique sur **Charger l'extension non empaquetée**.
4. Sélectionne le dossier **`dist/chrome`** situé à la racine du projet.

---

### 2. Mozilla Firefox

* **Lancer le développement continu (mode "watch") :**
```bash
npm run dev:firefox
```


* **Générer le build de production optimisé :**
```bash
npm run build:firefox
```



👉 **Installation dans Firefox :**

1. Ouvre l'onglet `about:debugging#/runtime/this-firefox`.
2. Clique sur **Charger un module d'extension temporaire...**.
3. Sélectionne le fichier `manifest.json` qui se trouve dans le dossier **`dist/firefox`**.

---

### 3. Build simultané (Toutes plateformes)

Pour générer d'un seul coup les versions finales prêtes à être partagées à l'équipe EMS :

```bash
npm run build:all
```

Cette commande nettoie le dossier `dist/` et compile simultanément l'extension dans `dist/chrome` et `dist/firefox`.

---

## 📦 Dépendances principales

* **Vite** : Outil de build ultra-rapide utilisé pour compiler le JavaScript et copier les fichiers de configuration de manière isolée.
* **webextension-polyfill** : Polyfill officiel permettant d'utiliser l'API standard `browser` à la fois sur l'environnement Chromium (Chrome) et Gecko (Firefox).