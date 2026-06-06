# EMS Medical Extension - 21 Jump Click

Extension pour navigateurs (Chrome et Firefox) conçue pour automatiser et faciliter la rédaction des dossiers et rapports médicaux pour les joueurs EMS sur l'intranet du serveur **21 Jump Click**.

> **Site ciblé :** `https://intra.21jumpclick.fr/*`

---

## 🚀 Fonctionnalités

### 🩺 Complétion automatique de rapport (`medicalFileCompletion.js`)
Injecte un bouton **"Complétion"** dans le formulaire *Nouveau rapport médical*. Un panneau de cases à cocher et de contrôles permet de pré-remplir automatiquement les champs du rapport en fonction des éléments sélectionnés.

Les groupes disponibles sont :

- **Notes Internes** - VM (avec sous-options SP / Validé), CU
- **Accident** - AVP (Moto + Casque, Vélo, Pare-Brise, Piéton), Coup & Blessure (Arme Blanche, Contondante), BPB (GPB, Cat3), Déshydratation, Hypoglycémie, Noyade (Dépôt), Chute (15m), Explosion, Brûlure, Attaque Animal
- **Médicaments** - Antidouleur, Anti-Inflammatoire, Antibiotique, Anti-Coagulant *(certains désactivés automatiquement selon le type d'accident)*
- **Autre** - Coma, Douleur *(slider 0–10)*, Inconscient, Canne, Fauteuil

Les options incompatibles se désactivent dynamiquement (ex. : Moto, Vélo et Piéton s'excluent mutuellement ; Douleur se désactive si Inconscient est coché). Les médicaments antidouleur/anti-inflammatoire/antibiotique sont aussi automatiquement désactivés en cas de Noyade.

### 🗂️ Bilan Anatomique interactif (`bodyZoneCompletion.js`)
Injecte un bouton **"Bilan"** dans le formulaire. Il ouvre une sidebar latérale permettant de construire un bilan lésionnel multi-zones avant de tout injecter en une seule action dans les champs **Examens** et **Traitements** du rapport.

Les zones anatomiques disponibles (issues de `pathologies.json`) sont : **Global**, Tête, Épaules, Bras Gauche / Droit, Main Gauche / Droite, Torse, **Dos**, Bassin, Jambe Gauche / Droite, Pied Gauche / Droit.

Chaque zone propose une liste de pathologies avec examens et soins pré-remplis. Les pathologies peuvent être accumulées dans un **stack** avant injection groupée, et retirées individuellement si besoin. L'algorithme de fusion détecte les segments du même type d'examen (Radio, Echo, Auscultation, IRM, Constantes, etc.) et les regroupe avec " + " ; les médicaments (AD, AI, AB, AC, AF), la bobologie (Glace, Pommade, crèmes) et le Repos sont automatiquement extraits des soins et rassemblés en suffixe commun.

### 📅 Remplissage rapide des dates (`dateFieldCompletion.js`)
Injecte des boutons de pré-remplissage à côté de trois champs de date :

- **Date visite médicale (VM)** - bouton pleine largeur "VM Maintenant" (SVG medical bleu `#29b6f6`) : insère la date actuelle (`JJ/MM/AAAA`).
- **Date du don de sang (DDS)** - bouton pleine largeur "DDS Maintenant" (SVG blood drop rouge `#ef5350`) : insère la date et l'heure actuelles (`JJ/MM/AAAA HH:MM`), puis déclenche automatiquement le bouton *Enregistrer* après ~200 ms.
- **Date de visite de contrôle (VC)** - petit bouton icône 36×36 placé à droite du champ : calcule et insère la **date d'admission** + la **durée d'invalidité** renseignée dans le champ *Durée d'invalidité* (`HH:MM:SS`). Le placeholder `DD/MM/YYYY hh:mm` est masqué pour ce champ. Affiche un retour visuel rouge en cas d'erreur (durée ou date d'admission manquante/invalide).

Le champ **Date d'admission** est automatiquement pré-rempli avec la date et l'heure actuelles à l'ouverture de la popup *Nouveau rapport médical* (seulement s'il est vide, sans écraser une saisie existante).

Toutes les dates sont calculées sur le **fuseau horaire local** du poste via `Intl.DateTimeFormat("fr-FR", { hourCycle: "h23" })`.

### 🏷️ Gestion des chips "Infos ok" / "Infos pas ok"
Dans le champ **En cas d'urgence**, deux boutons `+ Infos ok` et `+ Infos pas ok` sont injectés pour ajouter ou retirer ces statuts via l'Autocomplete MUI. Le bouton opposé est automatiquement retiré (mutex). Les chips MUI correspondants sont colorés (vert pour "Infos ok", rouge pour "Infos pas ok"). Le texte brut en dehors des chips (autres contacts d'urgence) est également coloré en vert/rouge autour des mentions "Infos ok" / "Infos pas ok".

### 🩺 Bouton VC - Visite de Contrôle (`medicalCheckupCompletion.js`)
Injecte un bouton **"VC"** dans la popup de **vue détail d'un rapport médical** (popup qui s'ouvre au clic sur un rapport dans la liste). Le bouton est **grisé et désactivé** tant que la date de visite de contrôle n'est pas échue (comparaison avec l'heure locale). Au clic, le bouton :

1. Lit les champs *Examens*, *Remarque(s)* et *Traitements* du rapport d'origine.
2. Ferme la popup de détail (Escape).
3. Ouvre un nouveau formulaire *Nouveau rapport médical* avec :
   - **Blessures** : `VC`
   - **Remarque(s)** : `FDS` (+ "Canne récupéré" / "Fauteuil récupéré" si mentionnés)
   - **Examens** : examens existants convertis en "RAS" (Radio → `Radio: RAS`, etc.) et "Constantes: Faibles" → `Constantes: Normales`
   - **Traitements** : `Retrait <éléments>` (Corset, Bandage, Attelle, Minerve, Plâtre, Épaulière, Écharpe, Casque) + `Retrait IPT`
   - **Code Postal** : valeur définie dans la popup (hôpital actif)
   - **Type** : `Note interne`

Le bouton n'est injecté que si le rapport d'origine a une **Durée d'invalidité** renseignée et non nulle.

### 🎲 Randomizer Groupe Sanguin (`dateFieldCompletion.js`)
Dans la popup d'**examen médical** d'un joueur, un petit bouton 🎲 (SVG shuffle, 36×36) est injecté à droite du champ **Groupe Sanguin**. Au clic, il remplit aléatoirement le champ avec un des 8 groupes possibles : `AB+`, `AB-`, `A+`, `A-`, `B+`, `B-`, `O+`, `O-` (le `+`/`-` est stocké sans espace). Feedback visuel vert pendant ~1,2 s.

### ⚙️ Popup de configuration (`popup.html` / `popup.js`)
Interface accessible depuis l'icône de l'extension dans la barre d'outils (styles + icônes via CDN `@tabler/icons-webfont`) :

- Sélection de l'**hôpital actif** (BCES ou LSES)
- Définition d'un **code ZIP par défaut** (utilisé par la Complétion et le bouton VC) : valeurs par défaut pré-réglées **BCES → 1057**, **LSES → 8040** ; le ZIP suit automatiquement le changement d'hôpital sauf si l'utilisateur l'a personnalisé
- Raccourcis vers les **dispatches BCES, LSES et l'Intranet 21** (les liens BCES/LSES s'adaptent selon l'hôpital sélectionné ; le lien Intra-21 reste constant)
- Le titre de la popup et son footer sont automatiquement remplis avec le nom et la version du `manifest.json` (en exécution)

### 🌐 Compatibilité Cross-Browser
Support natif Chrome (Manifest V3) et Firefox (Manifest V3 + `browser_specific_settings` avec un `gecko.id` dédié) via l'intégration de `webextension-polyfill` (toujours chargé en premier dans le `content_scripts`).

### 🔔 Service Worker & Première installation (`background.js` / `welcome.html` / `welcome.js`)
Un **service worker** (Chrome) / **event page** (Firefox) gère le cycle de vie de l'extension :

- **`background.js`** : à la première installation, ouvre automatiquement la page de bienvenue ; expose une API `checkPinStatus` pour vérifier si l'extension est épinglée à la barre d'outils (via `chrome.action.getUserSettings` sur Chrome 102+) et mémorise le choix de l'utilisateur (`pinPromptDismissed`).
- **`welcome.html` / `welcome.js`** : page d'instructions (CDN @tabler/icons) qui s'ouvre dans un nouvel onglet à l'installation, avec un guide visuel en 4 étapes pour épingler l'extension + lien direct vers l'intranet 21.
- **Bannière d'épinglage dans le popup** : si l'extension n'est pas épinglée, une bannière orange s'affiche avec un bouton « Comment faire ? » (ouvre `welcome.html`) et un bouton « × » pour ne plus l'afficher.


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
├── scripts/                        # Scripts utilitaires de build
│   └── zip.mjs                     # Création du zip de distribution à partir de dist/<target>/
├── src/                            # Fichiers sources de développement
│   ├── icons/                      # Identité visuelle de l'extension
│   │   ├── icon16.png              # Icône système (16x16)
│   │   ├── icon32.png              # Icône de la liste d'extensions (32x32)
│   │   ├── icon48.png              # Icône de barre d'outils (48x48)
│   │   └── icon128.png             # Icône détaillée du store (128x128)
│   ├── background.js               # Service worker (installation, mise à jour, vérification épinglage)
│   ├── bodyZoneCompletion.js       # Sidebar du Bilan Anatomique (zones, pathologies, stack, injection, fusion)
│   ├── content.css                 # Styles CSS injectés (boutons, panneaux, sidebar, chips)
│   ├── dateFieldCompletion.js      # VM/DDS/VC + auto-fill admission + chips Infos ok/pas ok + randomizer groupe sanguin
│   ├── manifest.chrome.json        # Configuration de l'extension pour Google Chrome (Manifest V3)
│   ├── manifest.firefox.json       # Configuration de l'extension pour Mozilla Firefox (Manifest V3 + gecko.id)
│   ├── medicalCheckupCompletion.js # Bouton VC sur la vue détail d'un rapport médical
│   ├── medicalFileCompletion.js    # Panneau de complétion du rapport médical (cases, slider, incapacités)
│   ├── pathologies.json            # Base de données des pathologies par zone anatomique
│   ├── popup.html                  # Interface graphique du menu d'options
│   ├── popup.js                    # Logique de la popup (hôpital, ZIP, liens dispatches)
│   ├── welcome.html                # Page de bienvenue à l'installation (guide d'épinglage)
│   └── welcome.js                  # Script minimal de la page de bienvenue
├── .gitignore
├── package-lock.json
├── package.json                    # Scripts npm et dépendances
└── vite.config.js                  # Configuration de build Vite (compilation + copie des manifests + welcome.html)
```

---

## 💻 Commandes de développement et build

### Google Chrome

```bash
# Développement continu (mode watch)
npm run dev:chrome

# Build de production (compilation + zip de distribution)
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

# Build de production (compilation + zip de distribution)
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

### 📦 Création du zip de distribution (`scripts/zip.mjs`)

Les scripts `build:chrome` et `build:firefox` lancent automatiquement le script `scripts/zip.mjs` juste après la compilation Vite, ce qui produit un zip prêt à être téléversé sur le **Chrome Web Store** ou le **store des modules complémentaires Firefox** (AMO).

Le nom du zip généré suit la convention :

```text
dist/<name>-v<version>-<target>.zip
```

où :

- `<name>` est le champ `name` du `package.json` (ex. `ems-medical-extension-21jc`)
- `<version>` est le champ `version` du `package.json` (ex. `0.9.0`)
- `<target>` vaut `chrome` ou `firefox`

**Usage manuel** (si tu veux régénérer le zip sans recompiler, par exemple après avoir modifié des ressources copiées) :

```bash
node scripts/zip.mjs chrome     # produit dist/ems-medical-extension-21jc-v0.9.0-chrome.zip
node scripts/zip.mjs firefox    # produit dist/ems-medical-extension-21jc-v0.9.0-firefox.zip
```

Le script :

- Lit la version directement dans `package.json` (toujours synchronisée avec le `manifest.json` final).
- Compresse **tout le contenu** de `dist/<target>/` à la racine du zip (pas de dossier parent, format attendu par les stores).
- Utilise `archiver` (zlib niveau 9) pour une compression maximale.
- Affiche la taille finale en Ko dans la console.

---

## ⚙️ Configuration du Build (Vite)

Ce projet utilise `vite.config.js` pour automatiser le processus de build et assurer la compatibilité multi-navigateurs. Le système gère les tâches suivantes :

* **Entrées Dynamiques** : Tous les fichiers `.js` situés à la racine du dossier `src/` sont automatiquement détectés et compilés comme points d'entrée indépendants. Aucune déclaration manuelle n'est nécessaire.
* **Gestion Multi-Cible** : Le build génère des dossiers distincts selon la cible (`dist/chrome/` ou `dist/firefox/`). Le fichier `manifest.json` final est généré en fusionnant la version du `package.json` avec le manifeste spécifique (`manifest.chrome.json` ou `manifest.firefox.json`).
* **Synchronisation des Ressources** : Les assets nécessaires au fonctionnement de l'extension sont copiés automatiquement dans le dossier de sortie :
  * Fichiers CSS (`content.css`) et **tous les fichiers HTML** (`popup.html`, `welcome.html`, etc.).
  * Données JSON additionnelles (ex: `pathologies.json`, hors fichiers `manifest.*.json`).
  * Icônes du dossier `src/icons/`.
  * Le polyfill `webextension-polyfill` copié depuis `node_modules/webextension-polyfill/dist/browser-polyfill.js` sous le nom `browser-polyfill.js` dans le dossier de sortie.
* **Optimisation du Développement** :
  * La configuration `emptyOutDir: false` permet de maintenir les fichiers dans `dist/` lors du mode `watch`, évitant ainsi les rechargements intempestifs de l'extension dans votre navigateur.
  * Le système surveille les modifications de fichiers (`watchFile`) pour déclencher une reconstruction immédiate lors de vos changements (JS, JSON, HTML, CSS et PNG des icônes).
  * `minify: false` est conservé pour garder un code lisible dans la console du navigateur, utile pour le debug des content scripts.

---

## 📦 Dépendances

- **`vite`** *(devDependency)* - outil de build, gère la compilation JS et la copie des ressources statiques par cible.
- **`webextension-polyfill`** *(dependency)* - polyfill officiel Mozilla permettant d'utiliser l'API `browser` de façon unifiée sur Chromium et Gecko. Copié tel quel dans `dist/` sous le nom `browser-polyfill.js`.
- **`archiver`** *(devDependency)* - bibliothèque Node.js de streaming d'archive, utilisée par `scripts/zip.mjs` pour produire les zips de distribution au format attendu par les stores (Chrome Web Store / AMO).
