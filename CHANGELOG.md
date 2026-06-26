# Changelog

Tous les changements notables de ce projet sont documentes dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), et ce projet adhere au [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [0.12.0] - 2026-06-26

### Added
- Option Detatouage dans le groupe Notes Internes (Nombre, Zone, Facture $)
- Champ texte Taux mg/L pour Coma ethylique
- Fermeture de la sidebar Bilan avec la touche Escape

### Changed
- Refonte complete du design du panneau Completion (palette, espacements, scrollbar, transitions)
- Refonte complete du design de la sidebar Bilan Anatomique (palette, espacements, scrollbar)
- Le panneau Completion s'ouvre a droite du dialog au lieu de se superposer au contenu
- Boutons Valider / Annuler fixes en bas du panneau Completion avec zone de scroll
- Harmonisation des designs Completion et Bilan (memes couleurs, espacements, polices)
- Suppression de `pointer-events: none` sur les lignes desactivees du panneau Completion

### Fixed
- Accents retablis dans les recherches de labels MUI (Duree d'invalidite, Date de visite de controle, Incapacites)
- Separateur entre le dernier groupe et les actions (double trait) corrige
- Animation d'ouverture du panneau (translateX au lieu de translateY)

## [0.11.0] - 2026-06-25

### Added
- Gestion des overdoses d'alcool et de drogue dans le panneau de completion ([#9](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/9))

## [0.10.0] - 2026-06-09

### Added
- Variantes de build Lite (Chrome Lite et Firefox Lite) sans Completion, Bilan Anatomique ni bouton VC ([#8](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/8))
- Suffixe " - Lite" dans le nom du manifest pour les builds Lite

### Fixed
- Reparation du bouton Coma dans la completion

### Changed
- Refonte complete de `pathologies.json` et adaptation du `bodyZoneCompletion`
- Modification du selecteur de completion

## [0.9.1] - 2026-06-07

### Added
- Page de bienvenue a l'installation avec guide d'epinglage en 4 etapes
- Detection du statut d'epinglage de l'extension (`chrome.action.getUserSettings`)
- Banniere d'epinglage dans le popup avec option "ne plus afficher"
- Templates d'issues GitHub en francais (bug report et suggestion) ([#5](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/5))
- Generation de zips de distribution avec `archiver`

### Fixed
- Manifest Firefox : remplacement du `service_worker` par des `background.scripts` ([#6](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/6))
- Bouton VC pour OperaGX
- Gestion des accents pour "echo" dans les VC
- Label "chute" corrige de "15m" a "+15m"

### Changed
- Renommage du projet de `ems-medical-tools` en `ems-medical-extension`
- Suppression du raccourci clavier du guide d'epinglage (etape 4)
- Preparation du `package.json` pour publication publique

## [0.8.2] - 2026-06-06

### Added
- Option "Velo" dans les accidents AVP du panneau de completion
- Bouton randomizer de groupe sanguin (8 groupes) avec icone SVG et feedback visuel

### Fixed
- Correction de la coche Inconscient dans la completion
- Utilisation de l'heure locale au lieu de l'heure de Paris pour toutes les operations de date ([#4](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/4))

### Changed
- Refonte du design des boutons de date avec icones SVG
- Rafraichissement de l'UI de la popup (icones Tabler, theme vert, nom + version en pied de page)
- Mise a jour de `pathologies.json`

## [0.8.0] - 2026-06-05

### Added
- Boutons de date VM, DDS et VC avec pre-remplissage automatique
- Auto-fill de la date d'admission a l'ouverture du formulaire Nouveau rapport medical
- Calcul de la date de controle base sur la date d'admission + duree d'invalidite
- Gestion des chips "Infos ok" / "Infos pas ok" avec colorisation MUI et comportement mutex

### Fixed
- Amelioration du toggle des chips Infos avec matching base sur le concept
- Utilisation du fuseau horaire local pour les champs de date

### Changed
- Mise a jour de `pathologies.json` et `bodyZoneCompletion.js`
- Selection multiple possible pour une meme pathologie dans le Bilan Anatomique

## [0.7.1] - 2026-06-05

### Added
- Documentation des fonctionnalites chips Infos et bouton VC dans le README

## [0.6.0] - 2026-06-04

### Added
- Bouton VC (Visite de Controle) sur la popup de detail d'un rapport medical
- Conversion automatique des examens en "RAS" et traitements en "Retrait" pour la VC
- Retrait des immobilisations (Corset, Bandage, Attelle, Minerve, Platre, Epauliere, Echarpe, Casque) + IPT dans les traitements VC
- Gestion du cas "Constantes: Faibles" remplace par "Constantes: Normales" pour la VC
- Popup de configuration (selection hopital BCES/LSES, code postal, liens dispatches)
- Slider de douleur (0-10) dans le panneau de completion

### Changed
- Amelioration de la fiabilite du systeme de build ([#3](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/3))
- Mise a jour de `pathologies.json`

## [0.4.0] - 2026-06-04

### Added
- Bilan Anatomique avec sidebar laterale (480 px)
- Stack de pathologies par zone avec injection groupee dans Examens et Traitements
- Algorithme de fusion des examens (regroupement par type avec " + ")
- Extraction automatique des medicaments (AD, AI, AB, AC, AF) et bobologie (Glace, Pommade, cremes) en suffixe commun

### Changed
- Inversion des boutons et realignement
- Fermeture automatique de la sidebar a la fermeture de la page
- Dans Traitement, le bilan est toujours place avant les medicaments

## [0.3.0] - 2026-06-04

### Added
- Systeme de build multi-navigateur avec Vite (Chrome & Firefox) ([#1](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/1))
- Detection automatique des points d'entree JS dans `src/`
- Synchronisation des assets statiques (CSS, HTML, JSON, icones)
- Copie automatique de `webextension-polyfill` depuis `node_modules`
- Icones de l'extension (16, 32, 48, 128 px)
- Mode watch pour le developpement

## [0.2.0] - 2026-06-03

### Added
- Completion automatique de rapport medical avec panneau de cases a cocher
- Groupes : Notes Internes (VM avec sous-options SP/Valide, CU), Accident (AVP, Coup & Blessure, BPB, etc.)
- Desactivation dynamique des options incompatibles (Moto/Velo/Pieton mutuellement exclusifs)
- Gestion des medicaments (desactives automatiquement en cas de Noyade)
- Ajout d'accidents supplementaires et completion d'IPT

## [0.1.0] - 2026-06-03

### Added
- Initialisation du projet
- Structure de base de l'extension navigateur (Manifest V3)
