# Changelog

Tous les changements notables de ce projet sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), et ce projet adhère au [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [0.12.3] - 2026-06-26

### Fixed
- La blessure "Détatouage" ne s'autocomplétait pas (clef `sel.Détatouage` au lieu de `sel.detatouage`)

## [0.12.2] - 2026-06-26

### Fixed
- Accents rétablis dans tous les labels et textes injectés par le panneau Completion

## [0.12.1] - 2026-06-26

### Fixed
- Les champs texte du panneau Completion ne fonctionnaient plus quand le panel était dans `document.body` (focus trap MUI) : panel replacé dans le dialog, z-index du dialog monté à 100001 pour passer au-dessus de la sidebar Bilan
- Le panneau Completion passait derrière la sidebar Bilan (conflit de stacking context)
- Fermeture intempestive du panneau au clic d'ouverture

## [0.12.0] - 2026-06-26

### Added
- Option Détatouage dans le groupe Notes Internes (Nombre, Zone, Facture $)
- Champ texte Taux mg/L pour Coma éthylique
- Fermeture de la sidebar Bilan avec la touche Escape

### Changed
- Refonte complète du design du panneau Completion (palette, espacements, scrollbar, transitions)
- Refonte complète du design de la sidebar Bilan Anatomique (palette, espacements, scrollbar)
- Le panneau Completion s'ouvre à droite du dialog au lieu de se superposer au contenu
- Boutons Valider / Annuler fixés en bas du panneau Completion avec zone de scroll
- Harmonisation des designs Completion et Bilan (mêmes couleurs, espacements, polices)
- Suppression de `pointer-events: none` sur les lignes désactivées du panneau Completion

### Fixed
- Accents rétablis dans les recherches de labels MUI (Durée d'invalidité, Date de visite de contrôle, Incapacités)
- Séparateur entre le dernier groupe et les actions (double trait) corrigé
- Animation d'ouverture du panneau (translateX au lieu de translateY)

## [0.11.0] - 2026-06-25

### Added
- Gestion des overdoses d'alcool et de drogue dans le panneau de complétion ([#9](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/9))

## [0.10.0] - 2026-06-09

### Added
- Variantes de build Lite (Chrome Lite et Firefox Lite) sans Complétion, Bilan Anatomique ni bouton VC ([#8](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/8))
- Suffixe " - Lite" dans le nom du manifest pour les builds Lite

### Changed
- Refonte complète de `pathologies.json` et adaptation du `bodyZoneCompletion`
- Modification du sélecteur de complétion

### Fixed
- Réparation du bouton Coma dans la complétion

## [0.9.1] - 2026-06-07

### Added
- Page de bienvenue à l'installation avec guide d'épinglage en 4 étapes
- Détection du statut d'épinglage de l'extension (`chrome.action.getUserSettings`)
- Bannière d'épinglage dans le popup avec option "ne plus afficher"
- Templates d'issues GitHub en français (bug report et suggestion) ([#5](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/5))
- Génération de zips de distribution avec `archiver`

### Changed
- Renommage du projet de `ems-medical-tools` en `ems-medical-extension`
- Suppression du raccourci clavier du guide d'épinglage (étape 4)
- Préparation du `package.json` pour publication publique

### Fixed
- Manifest Firefox : remplacement du `service_worker` par des `background.scripts` ([#6](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/6))
- Bouton VC pour OperaGX
- Gestion des accents pour "écho" dans les VC
- Label "chute" corrigé de "15m" à "+15m"

## [0.8.2] - 2026-06-06

### Added
- Option "Vélo" dans les accidents AVP du panneau de complétion
- Bouton randomizer de groupe sanguin (8 groupes) avec icône SVG et feedback visuel

### Changed
- Refonte du design des boutons de date avec icônes SVG
- Rafraîchissement de l'UI de la popup (icônes Tabler, thème vert, nom + version en pied de page)
- Mise à jour de `pathologies.json`

### Fixed
- Correction de la coche Inconscient dans la complétion
- Utilisation de l'heure locale au lieu de l'heure de Paris pour toutes les opérations de date ([#4](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/4))

## [0.8.0] - 2026-06-05

### Added
- Boutons de date VM, DDS et VC avec pré-remplissage automatique
- Auto-fill de la date d'admission à l'ouverture du formulaire Nouveau rapport médical
- Calcul de la date de contrôle basé sur la date d'admission + durée d'invalidité
- Gestion des chips "Infos ok" / "Infos pas ok" avec colorisation MUI et comportement mutex

### Changed
- Mise à jour de `pathologies.json` et `bodyZoneCompletion.js`
- Sélection multiple possible pour une même pathologie dans le Bilan Anatomique

### Fixed
- Amélioration du toggle des chips Infos avec matching basé sur le concept
- Utilisation du fuseau horaire local pour les champs de date

## [0.7.1] - 2026-06-05

### Added
- Documentation des fonctionnalités chips Infos et bouton VC dans le README

## [0.6.0] - 2026-06-04

### Added
- Bouton VC (Visite de Contrôle) sur la popup de détail d'un rapport médical
- Conversion automatique des examens en "RAS" et traitements en "Retrait" pour la VC
- Retrait des immobilisations (Corset, Bandage, Attelle, Minerve, Plâtre, Épaulière, Écharpe, Casque) + IPT dans les traitements VC
- Gestion du cas "Constantes: Faibles" remplacé par "Constantes: Normales" pour la VC
- Popup de configuration (sélection hôpital BCES/LSES, code postal, liens dispatches)
- Slider de douleur (0-10) dans le panneau de complétion

### Changed
- Amélioration de la fiabilité du système de build ([#3](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/3))
- Mise à jour de `pathologies.json`

## [0.4.0] - 2026-06-04

### Added
- Bilan Anatomique avec sidebar latérale (480 px)
- Stack de pathologies par zone avec injection groupée dans Examens et Traitements
- Algorithme de fusion des examens (regroupement par type avec " + ")
- Extraction automatique des médicaments (AD, AI, AB, AC, AF) et bobologie (Glace, Pommade, crèmes) en suffixe commun

### Changed
- Inversion des boutons et réalignement
- Fermeture automatique de la sidebar à la fermeture de la page
- Dans Traitement, le bilan est toujours placé avant les médicaments

## [0.3.0] - 2026-06-04

### Added
- Système de build multi-navigateur avec Vite (Chrome & Firefox) ([#1](https://github.com/ems-21jc/ems-medical-extension-21jc/pull/1))
- Détection automatique des points d'entrée JS dans `src/`
- Synchronisation des assets statiques (CSS, HTML, JSON, icônes)
- Copie automatique de `webextension-polyfill` depuis `node_modules`
- Icônes de l'extension (16, 32, 48, 128 px)
- Mode watch pour le développement

## [0.2.0] - 2026-06-03

### Added
- Complétion automatique de rapport médical avec panneau de cases à cocher
- Groupes : Notes Internes (VM avec sous-options SP/Validé, CU), Accident (AVP, Coup & Blessure, BPB, etc.)
- Désactivation dynamique des options incompatibles (Moto/Vélo/Piéton mutuellement exclusifs)
- Gestion des médicaments (désactivés automatiquement en cas de Noyade)
- Ajout d'accidents supplémentaires et complétion d'IPT

## [0.1.0] - 2026-06-03

### Added
- Initialisation du projet
- Structure de base de l'extension navigateur (Manifest V3)
