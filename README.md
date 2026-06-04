# EMS Medical Tools - 21 Jump Click

Extension pour navigateurs (Chrome et Firefox) conçue pour automatiser et faciliter la rédaction des dossiers et rapports médicaux pour les joueurs EMS sur l'intranet du serveur **21 JumpClick**.

> **Site ciblé :** `https://intra.21jumpclick.fr/*`

---

## 🚀 Fonctionnalités

### 🩺 Complétion automatique de rapport (`medicalFileCompletion.js`)
Injecte un bouton **"Complétion"** dans le formulaire *Nouveau rapport médical*. Un panneau de cases à cocher et de contrôles permet de pré-remplir automatiquement les champs du rapport en fonction des éléments sélectionnés.

Les groupes disponibles sont :

- **Notes Internes** - VM (avec sous-options SP / Validé), CU
- **Accident** - AVP (Moto + Casque, Pare-Brise, Piéton), Coups & Blessures (Arme Blanche, Contondante), BPB (GPB, Cat3), Déshydratation, Hypoglycémie, Noyade (Dépôt), Chute (15m), Explosion, Brûlure, Attaque Animal
- **Médicaments** - Antidouleur, Anti-Inflammatoire, Antibiotique, Anti-Coagulant *(certains désactivés automatiquement selon le type d'accident)*
- **Autre** - Coma, Douleur *(slider 0–10)*, Inconscient, Canne, Fauteuil

Les options incompatibles se désactivent dynamiquement (ex. : Moto et Piéton s'excluent mutuellement ; Douleur se désactive si Inconscient est coché).

### 🗂️ Bilan Anatomique interactif (`bodyZoneCompletion.js`)
Injecte un bouton **"Bilan"** dans le formulaire. Il ouvre une sidebar latérale permettant de construire un bilan lésionnel multi-zones avant de tout injecter en une seule action dans les champs **Examens** et **Traitements** du rapport.

Les zones anatomiques disponibles sont : Tête, Épaules, Bras Gauche / Droit, Main Gauche / Droite, Torse, Bassin, Jambe Gauche / Droite, Pied Gauche / Droit.

Chaque zone propose une liste de pathologies avec examens et soins pré-remplis. Les pathologies peuvent être accumulées dans un **stack** avant injection groupée, et retirées individuellement si besoin.

### 📅 Remplissage rapide des dates (`dateFieldCompletion.js`)
Injecte un bouton 🔃 à côté de trois champs de date :

- **Date de visite médicale** - insère la date actuelle (`JJ/MM/AAAA`)
- **Date du don de sang** - insère la date et l'heure actuelles (`JJ/MM/AAAA HH:MM`), puis déclenche automatiquement le bouton *Enregistrer*
- **Date de visite de contrôle** - calcule et insère la date actuelle + la durée d'invalidité renseignée dans le champ *Durée d'invalidité* (`HH:MM:SS`)

Toutes les dates sont calculées sur le **fuseau horaire Europe/Paris**.

### ⚙️ Popup de configuration (`popup.html` / `popup.js`)
Interface accessible depuis l'icône de l'extension dans la barre d'outils :

- Sélection de l'**hôpital actif** (BCES ou LSES)
- Définition d'un **code ZIP par défaut**
- Raccourcis vers les **dispatches BCES et LSES** (liens adaptés selon l'hôpital sélectionné)

### 🌐 Compatibilité Cross-Browser
Support natif Chrome (Manifest V3) et Firefox (Manifest V3 + `browser_specific_settings`) via l'intégration de `webextension-polyfill`.

---

## 🛠️ Installation et Configuration Initiale

Installe les dépendances Node.js du projet avant toute chose :

```bash
npm install
```

### Structure des dossiers

```text
Extension_EMS_21jc/
├── dist/                           # Dossiers compilés finaux (générés automatiquement)
│   ├── chrome/                     # Build prêt à être chargé dans Google Chrome / Chromium
│   └── firefox/                    # Build prêt à être chargé dans Mozilla Firefox
├── src/                            # Fichiers sources de développement
│   ├── icons/                      # Identité visuelle de l'extension
│   │   ├── icon16.png              # Icône système (16x16)
│   │   ├── icon32.png              # Icône de la liste d'extensions (32x32)
│   │   ├── icon48.png              # Icône de barre d'outils (48x48)
│   │   └── icon128.png             # Icône détaillée du store (128x128)
│   ├── bodyZoneCompletion.js       # Sidebar du Bilan Anatomique (zones, pathologies, stack, injection)
│   ├── content.css                 # Styles CSS injectés (boutons, panneau de complétion, sidebar)
│   ├── dateFieldCompletion.js      # Insertion et calcul automatique des dates
│   ├── manifest.chrome.json        # Configuration de l'extension pour Google Chrome (Manifest V3)
│   ├── manifest.firefox.json       # Configuration de l'extension pour Mozilla Firefox (Manifest V3)
│   ├── medicalFileCompletion.js    # Panneau de complétion du rapport médical (cases, slider, incapacités)
│   ├── pathologies.json            # Base de données des pathologies par zone anatomique
│   ├── popup.html                  # Interface graphique du menu d'options
│   └── popup.js                    # Logique de la popup (hôpital, ZIP, liens dispatches)
├── .gitignore
├── package-lock.json
├── package.json                    # Scripts npm et dépendances
└── vite.config.js                  # Configuration de build Vite (compilation + copie des manifests)
```

---

## 💻 Commandes de développement et build

### Google Chrome

```bash
# Développement continu (mode watch)
npm run dev:chrome

# Build de production
npm run build:chrome
```

**Installation dans Chrome :**
1. Ouvre `chrome://extensions/`
2. Active le **Mode développeur** (en haut à droite)
3. Clique sur **Charger l'extension non empaquetée**
4. Sélectionne le dossier **`dist/chrome`**

---

### Mozilla Firefox

```bash
# Développement continu (mode watch)
npm run dev:firefox

# Build de production
npm run build:firefox
```

**Installation dans Firefox :**
1. Ouvre `about:debugging#/runtime/this-firefox`
2. Clique sur **Charger un module d'extension temporaire...**
3. Sélectionne le fichier `manifest.json` dans le dossier **`dist/firefox`**

---

### Build simultané (toutes plateformes)

```bash
npm run build:all
```

Exécute `build:chrome` puis `build:firefox` séquentiellement. Les deux builds coexistent dans `dist/` sans se supprimer mutuellement (`emptyOutDir: false`).

---


## ⚙️ Configuration du Build (Vite)

Ce projet utilise `vite.config.js` pour automatiser le processus de build et assurer la compatibilité multi-navigateurs. Le système gère les tâches suivantes :

* **Entrées Dynamiques** : Tous les fichiers `.js` situés à la racine du dossier `src/` sont automatiquement détectés et compilés comme points d'entrée indépendants. Aucune déclaration manuelle n'est nécessaire.
* **Gestion Multi-Cible** : Le build génère des dossiers distincts selon la cible (`dist/chrome/` ou `dist/firefox/`). Le fichier `manifest.json` final est généré en fusionnant la version du `package.json` avec le manifeste spécifique (`manifest.chrome.json` ou `manifest.firefox.json`).
* **Synchronisation des Ressources** : Les assets nécessaires au fonctionnement de l'extension sont copiés automatiquement dans le dossier de sortie :
* Fichiers CSS (`content.css`) et HTML (`popup.html`).
* Données JSON additionnelles (ex: `pathologies.json`).
* Icônes du dossier `src/icons/`.
* Le polyfill `browser-polyfill.js` pour la compatibilité WebExtensions.


* **Optimisation du Développement** :
* La configuration `emptyOutDir: false` permet de maintenir les fichiers dans `dist/` lors du mode `watch`, évitant ainsi les rechargements intempestifs de l'extension dans votre navigateur.
* Le système surveille les modifications de fichiers (`watchFile`) pour déclencher une reconstruction immédiate lors de vos changements.

---

## 📦 Dépendances

- **`vite`** *(devDependency)* - outil de build, gère la compilation JS et la copie des ressources statiques par cible.
- **`webextension-polyfill`** *(dependency)* - polyfill officiel Mozilla permettant d'utiliser l'API `browser` de façon unifiée sur Chromium et Gecko. Copié tel quel dans `dist/` sous le nom `browser-polyfill.js`.