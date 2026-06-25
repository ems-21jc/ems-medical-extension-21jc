# EMS Medical Extension • 21 Jump Click

Extension navigateur (Chrome & Firefox) qui automatise la redaction des dossiers medicaux pour les EMS du serveur **21 Jump Click**.

> Site cible : `https://intra.21jumpclick.fr/*`

---

## Fonctionnalites

- **Completion automatique** • Panneau de cases a cocher pour pre-remplir les champs du rapport medical (Blessures, Examens, Traitements, Remarques, Duree, Code Postal). Groupes : Notes Internes, Accident, Medicaments, Autre.
- **Bilan Anatomique** • Sidebar laterale pour construire un bilan lesionnel multi-zones (pathologies avec examens/soins predefinis depuis `pathologies.json`), injection groupee dans Examens et Traitements.
- **Dates** • Boutons pour inserer automatiquement VM, DDS et VC. Date d'admission pre-remplie a l'ouverture du formulaire.
- **Chips Infos ok / pas ok** • Boutons mutex dans le champ *En cas d'urgence* avec colorisation des chips MUI.
- **Bouton VC** • Sur la popup detail d'un rapport, convertit le rapport en visite de controle (examens en RAS, traitements en Retrait).
- **Groupe Sanguin** • Randomizer aleatoire parmi les 8 groupes.
- **Popup de configuration** • Hopital actif (BCES/LSES), code postal, liens dispatches.
- **Guide d'epinglage** • Page de bienvenue a la premiere installation (4 etapes).
- **Overdose** • Gestion des overdoses d'alcool et de drogue.
- **Variante Lite** • Build allege sans Completion, Bilan Anatomique ni bouton VC.

---

## Structure

```text
├── dist/                              # Builds + zips de distribution
│   ├── chrome/       firefox/         # Builds standards
│   └── chrome-lite/  firefox-lite/    # Builds Lite
├── scripts/zip.mjs                    # Generation des zips (archiver)
├── src/
│   ├── background.js                  # Service worker (install, pin status)
│   ├── bodyZoneCompletion.js          # Sidebar Bilan Anatomique
│   ├── content.css                    # Styles injectes
│   ├── dateFieldCompletion.js         # Dates + chips Infos + randomizer
│   ├── manifest.chrome.json           # Manifest Chrome (V3)
│   ├── manifest.firefox.json          # Manifest Firefox (V3 + gecko.id)
│   ├── medicalCheckupCompletion.js    # Bouton VC
│   ├── medicalFileCompletion.js       # Panneau de completion
│   ├── pathologies.json               # Base pathologies par zone
│   ├── popup.html / popup.js          # Popup de configuration
│   ├── welcome.html / welcome.js      # Page de bienvenue
│   └── icons/                         # Icones (16, 32, 48, 128 px)
├── .github/ISSUE_TEMPLATE/            # Templates d'issues
├── package.json
└── vite.config.js                     # Build Vite multi-cible
```

---

## Installation & Developpement

```bash
npm install
npm run dev:chrome          # Watch mode Chrome
npm run dev:firefox         # Watch mode Firefox
npm run dev:chrome-lite     # Watch mode Chrome Lite
npm run dev:firefox-lite    # Watch mode Firefox Lite
```

Charger dans le navigateur :
- **Chrome** : `chrome://extensions/` > Mode developpeur > Charger l'extension non empaquetee > `dist/chrome/`
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

Zips generes dans `dist/` sous la forme `ems-medical-extension-21jc-v<version>-<target>.zip`.

---

## Dependances

| Dependance | Usage |
|---|---|
| `vite` (dev) | Build et compilation JS |
| `webextension-polyfill` | API `browser` unifiee Chrome/Firefox |
| `archiver` (dev) | Generation des zips de distribution |
