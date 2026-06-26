# EMS Medical Extension • 21 Jump Click

Extension navigateur (Chrome & Firefox) qui automatise la rédaction des dossiers médicaux pour les EMS du serveur **21 Jump Click**.

> Site cible : `https://intra.21jumpclick.fr/*`

---

## Fonctionnalités

- **Complétion automatique** • Panneau de cases à cocher pour pré-remplir les champs du rapport médical (Blessures, Examens, Traitements, Remarques, Durée, Code Postal). Groupes : Notes Internes, Accident, Médicaments, Autre.
- **Bilan Anatomique** • Sidebar latérale pour construire un bilan lésionnel multi-zones (pathologies avec examens/soins prédéfinis depuis `pathologies.json`), injection groupée dans Examens et Traitements.
- **Dates** • Boutons pour insérer automatiquement VM, DDS et VC. Date d'admission pré-remplie à l'ouverture du formulaire.
- **Chips Infos ok / pas ok** • Boutons mutex dans le champ *En cas d'urgence* avec colorisation des chips MUI.
- **Bouton VC** • Sur la popup détail d'un rapport, convertit le rapport en visite de contrôle (examens en RAS, traitements en Retrait).
- **Groupe Sanguin** • Randomizer aléatoire parmi les 8 groupes.
- **Popup de configuration** • Hôpital actif (BCES/LSES), code postal, liens dispatches.
- **Guide d'épinglage** • Page de bienvenue à la première installation (4 étapes).
- **Overdose** • Gestion des overdoses d'alcool et de drogue.
- **Détatouage** • Gestion du détatouage avec facture et VC automatique.
- **Variante Lite** • Build allégé sans Complétion, Bilan Anatomique ni bouton VC.

---

## Structure

```text
├── dist/                              # Builds + zips de distribution
│   ├── chrome/       firefox/         # Builds standards
│   └── chrome-lite/  firefox-lite/    # Builds Lite
├── scripts/zip.mjs                    # Génération des zips (archiver)
├── src/
│   ├── background.js                  # Service worker (install, pin status)
│   ├── bodyZoneCompletion.js          # Sidebar Bilan Anatomique
│   ├── content.css                    # Styles injectés
│   ├── dateFieldCompletion.js         # Dates + chips Infos + randomizer
│   ├── manifest.chrome.json           # Manifest Chrome (V3)
│   ├── manifest.firefox.json          # Manifest Firefox (V3 + gecko.id)
│   ├── medicalCheckupCompletion.js    # Bouton VC
│   ├── medicalFileCompletion.js       # Panneau de complétion
│   ├── pathologies.json               # Base pathologies par zone
│   ├── popup.html / popup.js          # Popup de configuration
│   ├── welcome.html / welcome.js      # Page de bienvenue
│   └── icons/                         # Icônes (16, 32, 48, 128 px)
├── .github/ISSUE_TEMPLATE/            # Templates d'issues
├── CHANGELOG.md                       # Historique des versions
├── package.json
└── vite.config.js                     # Build Vite multi-cible
```

---

## Installation & Développement

```bash
npm install
npm run dev:chrome          # Watch mode Chrome
npm run dev:firefox         # Watch mode Firefox
npm run dev:chrome-lite     # Watch mode Chrome Lite
npm run dev:firefox-lite    # Watch mode Firefox Lite
```

Charger dans le navigateur :
- **Chrome** : `chrome://extensions/` > Mode développeur > Charger l'extension non empaquetée > `dist/chrome/`
- **Firefox** : `about:debugging#/runtime/this-firefox` > Charger un module temporaire > `dist/firefox/manifest.json`

---

## Build

```bash
npm run build:chrome            # Build Chrome + zip
npm run build:firefox           # Build Firefox + zip
npm run build:chrome-lite       # Build Chrome Lite + zip
npm run build:firefox-lite      # Build Firefox Lite + zip
npm run build:all               # Chrome + Firefox
npm run build:all-lite          # Chrome Lite + Firefox Lite
npm run build:everything        # Les 4 variantes
```

Zips générés dans `dist/` sous la forme `ems-medical-extension-21jc-v<version>-<target>.zip`.

---

## Changelog

Voir [CHANGELOG.md](./CHANGELOG.md).

---

## Dépendances

| Dépendance | Usage |
|---|---|
| `vite` (dev) | Build et compilation JS |
| `webextension-polyfill` | API `browser` unifiée Chrome/Firefox |
| `archiver` (dev) | Génération des zips de distribution |
