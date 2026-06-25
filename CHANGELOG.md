# Changelog

Tous les changements notables de ce projet sont documentes dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.11.0] — 2026-06-25

### Ajoute
- Gestion des overdoses d'alcool et de drogue dans le panneau de completion

## [0.10.0] — 2026-06-09

### Ajoute
- Variantes de build Lite (Chrome Lite et Firefox Lite) sans Completion, Bilan Anatomique ni bouton VC
- Suffixe " - Lite" dans le nom du manifest pour les builds Lite

### Corrige
- Reparation du bouton Coma dans la completion

### Modifie
- Refonte complete de `pathologies.json` et adaptation du `bodyZoneCompletion`
- Modification du selecteur de completion

## [0.9.1] — 2026-06-07

### Ajoute
- Page de bienvenue a l'installation (guide d'epinglage en 4 etapes)
- Detection du statut d'epinglage de l'extension (via `chrome.action.getUserSettings` sur Chrome 102+)
- Templates d'issues GitHub en francais (bug report et suggestion)
- Commande `archiver` pour la generation des zips de distribution

### Corrige
- Correction du manifest Firefox : remplacement du service worker par des background scripts
- Correction du bouton VC pour OperaGX
- Gestion des accents pour "echo" dans les VC
- Correction du label "chute" de "15m" a "+15m"

### Modifie
- Renommage du projet de `ems-medical-tools` en `ems-medical-extension`
- Suppression du raccourci clavier du guide d'epinglage (etape 4)
- Preparation du `package.json` pour publication publique

## [0.8.2] — 2026-06-06

### Ajoute
- Option "Velo" dans les accidents AVP
- Bouton de randomizer de groupe sanguin (8 groupes) restyle en CSS/SVG

### Corrige
- Correction de la coche Inconscient dans la completion
- Utilisation de l'heure locale au lieu de l'heure de Paris pour toutes les operations de date

### Modifie
- Mise a jour du design des boutons de date
- Rafraichissement de l'UI de la popup (icones, theme vert, nom + version)
- Mise a jour de `pathologies.json`

## [0.8.0] — 2026-06-05

### Ajoute
- Boutons de date VM, DDS et VC avec icones SVG
- Auto-fill de la date d'admission a l'ouverture du formulaire
- Calcul de la date de controle base sur la date d'admission + duree d'invalidite
- Gestion des chips "Infos ok" / "Infos pas ok" avec colorisation MUI et comportement mutex

### Corrige
- Amelioration du toggle des chips Infos avec matching base sur le concept
- Utilisation du fuseau horaire local pour les champs de date

### Modifie
- Mise a jour de `pathologies.json` et `bodyZoneCompletion.js`
- Selection multiple pour une meme pathologie dans le bilan

## [0.7.1] — 2026-06-05

### Ajoute
- Documentation des fonctionnalites chips et VC dans le README

## [0.6.0] — 2026-06-04

### Ajoute
- Bouton VC (Visite de Controle) sur la popup detail d'un rapport medical
- Conversion automatique des examens en "RAS" et traitements en "Retrait" pour la VC
- Retrait des bandages, attelles, minerve, platre, etc. dans les traitements VC
- Gestion du cas "Constantes: Faibles" -> "Constantes: Normales" pour la VC
- Popup de configuration (selection hopital, code postal, liens dispatches)
- Slider de douleur (0-10) dans le panneau de completion

### Modifie
- Amelioration de la fiabilite du systeme de build
- Mise a jour de `pathologies.json`

## [0.4.0] — 2026-06-04

### Ajoute
- Bilan Anatomique avec sidebar laterale
- Stack de pathologies avec injection groupee dans Examens et Traitements
- Algorithme de fusion des examens (regroupement par type avec " + ")
- Extraction automatique des medicaments et bobologie en suffixe commun

### Modifie
- Inversion des boutons et realignement
- Fermeture automatique de la sidebar a la fermeture de la page

## [0.3.0] — 2026-06-04

### Ajoute
- Systeme de build multi-navigateur avec Vite (Chrome & Firefox)
- Detection automatique des points d'entree JS
- Synchronisation des assets (CSS, HTML, JSON, icones, polyfill)
- Copie automatique de `webextension-polyfill` depuis `node_modules`
- Icones de l'extension (16, 32, 48, 128 px)

## [0.2.0] — 2026-06-03

### Ajoute
- Completion automatique de rapport medical
- Gestion des VM et CU
- Ajout d'accidents supplementaires et completion d'IPT
- Debut de l'autocompletion des dossiers medicaux

## [0.1.0] — 2026-06-03

### Ajoute
- Initialisation du projet
- Structure de base de l'extension navigateur
