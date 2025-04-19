# Architecture Modulaire de Spynorama

Ce document décrit l'architecture modulaire de l'application Spynorama, qui permet de créer et visualiser des scènes panoramiques 360° avec hotspots interactifs.

## Structure des Dossiers

```
js/
├── core/           # Modules de base
│   ├── viewer.js   # Gestion du viewer Marzipano
│   ├── storage.js  # Gestion du stockage (localStorage, import/export)
│   └── export.js   # Fonctionnalités d'export de site web
├── ui/             # Modules d'interface utilisateur
│   ├── hotspots.js # Gestion des hotspots dans l'interface
│   ├── scenes.js   # Gestion des scènes dans l'interface
│   └── modals.js   # Gestion des modales
├── utils/          # Modules utilitaires
│   ├── image.js    # Utilitaires pour le traitement des images
│   ├── video.js    # Utilitaires pour le traitement des vidéos
│   └── i18n.js     # Utilitaires pour l'internationalisation
├── translations/   # Fichiers de traduction
│   ├── fr.js       # Traductions françaises
│   ├── en.js       # Traductions anglaises
│   ├── it.js       # Traductions italiennes
│   └── index.js    # Export des traductions
├── app.js          # Point d'entrée principal de l'application
└── README.md       # Ce fichier
```

## Modules Core

### viewer.js

Encapsule toutes les interactions avec la bibliothèque Marzipano pour la visualisation 360°.

- `MarzipanoViewer` : Classe principale pour initialiser et gérer le viewer Marzipano
  - `initialize()` : Initialise le viewer
  - `loadScene()` : Charge une scène dans le viewer
  - `addHotspotsToScene()` : Ajoute des hotspots à une scène
  - `getCurrentViewParameters()` : Récupère les paramètres de vue actuels

### storage.js

Gère le stockage, le chargement et l'export des projets.

- `StorageManager` : Classe principale pour la gestion du stockage
  - `saveToLocalStorage()` : Sauvegarde le projet dans le localStorage
  - `loadFromLocalStorage()` : Charge le projet depuis le localStorage
  - `scheduleAutoSave()` : Planifie une sauvegarde automatique
  - `exportProject()` : Exporte le projet au format JSON
  - `importProject()` : Importe un projet depuis un fichier JSON
  - `createNewProject()` : Crée un nouveau projet vide

### export.js

Gère l'export du projet en site web autonome.

- `ExportManager` : Classe principale pour l'export
  - `exportWebsite()` : Exporte le projet en site web
  - `processImages()` : Traite les images des scènes selon les options d'export
  - `resizeImage()` : Redimensionne une image pour réduire sa taille
  - `generateIndexHtml()` : Génère le contenu du fichier index.html
  - `generateStyleCss()` : Génère le contenu du fichier style.css
  - `generateViewerJs()` : Génère le contenu du fichier viewer.js

## Modules UI

### hotspots.js

Gère l'interface utilisateur pour les hotspots.

- `HotspotsUI` : Classe principale pour la gestion des hotspots dans l'interface
  - `setEditMode()` : Définit le mode d'édition actuel
  - `handleViewerClick()` : Gère le clic sur le viewer pour ajouter des hotspots
  - `createHotspot()` : Crée un nouveau hotspot
  - `editHotspot()` : Ouvre la modal d'édition pour un hotspot
  - `toggleVideoFields()` : Affiche ou masque les champs spécifiques au type de vidéo
  - `saveHotspot()` : Enregistre les modifications d'un hotspot
  - `deleteHotspot()` : Supprime le hotspot actif
  - `updateHotspotsList()` : Met à jour la liste des hotspots dans l'interface

### scenes.js

Gère l'interface utilisateur pour les scènes.

- `ScenesUI` : Classe principale pour la gestion des scènes dans l'interface
  - `handleSceneFileSelect()` : Gère la sélection de fichiers pour les scènes
  - `createScene()` : Crée une nouvelle scène à partir d'une image
  - `showAddUrlModal()` : Affiche la modal pour ajouter une scène via URL
  - `addSceneFromUrl()` : Ajoute une scène à partir d'une URL
  - `updateCurrentSceneTitle()` : Met à jour le titre de la scène courante
  - `setInitialView()` : Définit la vue actuelle comme vue initiale
  - `updateScenesList()` : Met à jour la liste des scènes dans l'interface
  - `deleteScene()` : Supprime une scène
  - `updateSceneSettings()` : Met à jour les paramètres de la scène dans l'interface

### modals.js

Gère les modales de l'interface utilisateur.

- `ModalsUI` : Classe principale pour la gestion des modales
  - `closeModals()` : Ferme toutes les modales
  - `showExportOptions()` : Affiche la modale des options d'export
  - `exportWebsite()` : Exporte le site web
  - `showHelp()` : Affiche l'aide de l'application
  - `showPhotoModal()` : Affiche une modale avec une image
  - `showVideoModal()` : Affiche une modale avec une vidéo

## Modules Utils

### image.js

Utilitaires pour le traitement des images.

- `ImageUtils` : Classe d'utilitaires pour les images
  - `resizeImage()` : Redimensionne une image pour réduire sa taille
  - `urlToDataUrl()` : Convertit une URL externe en Data URL
  - `createThumbnail()` : Crée une miniature à partir d'une image
  - `isValidUrl()` : Vérifie si une URL est valide
  - `isImageUrl()` : Vérifie si une URL est une image

### video.js

Utilitaires pour le traitement des vidéos.

- `VideoUtils` : Classe d'utilitaires pour les vidéos
  - `extractYoutubeId()` : Extrait l'ID d'une vidéo YouTube à partir de son URL
  - `extractVimeoId()` : Extrait l'ID d'une vidéo Vimeo à partir de son URL
  - `extractPodeducId()` : Extrait l'ID d'une vidéo Podeduc à partir de son URL
  - `extractUrlFromIframe()` : Extrait l'URL d'une vidéo à partir d'un code iframe
  - `createYoutubeIframe()` : Crée un code iframe pour une vidéo YouTube
  - `createVimeoIframe()` : Crée un code iframe pour une vidéo Vimeo
  - `createPodeducIframe()` : Crée un code iframe pour une vidéo Podeduc
  - `isValidVideoUrl()` : Vérifie si une URL est une vidéo valide
  - `getVideoType()` : Détermine le type de vidéo à partir de son URL
  - `sanitizeIframe()` : Sanitize le code iframe pour éviter les injections XSS

### i18n.js

Utilitaires pour l'internationalisation de l'application.

- `I18nUtils` : Classe d'utilitaires pour l'internationalisation
  - `addTranslations()` : Ajoute des traductions pour une locale spécifique
  - `setLocale()` : Définit la locale courante et déclenche un événement pour mettre à jour l'interface
  - `getLocale()` : Récupère la locale courante
  - `getAvailableLocales()` : Récupère les locales disponibles
  - `translate()` : Traduit une clé dans la locale courante avec support pour les paramètres
  - `loadLocale()` : Charge la locale depuis le localStorage ou la détecte automatiquement
  - `translatePage()` : Traduit tous les éléments de la page avec les attributs data-i18n et data-i18n-placeholder
  - `init()` : Initialise l'internationalisation (méthode statique)
- `t()` : Fonction raccourcie pour la traduction

## Modules de Traduction

### translations/fr.js, translations/en.js et translations/it.js

Fichiers contenant les traductions pour chaque langue supportée. Chaque fichier exporte un objet avec des clés organisées hiérarchiquement pour faciliter la maintenance et l'extension des traductions.

### translations/index.js

Exporte toutes les traductions disponibles pour faciliter leur importation dans l'application.

## Point d'Entrée Principal

### app.js

Point d'entrée principal de l'application.

- Initialise tous les modules
- Configure les écouteurs d'événements
- Gère l'état global de l'application
- Coordonne les interactions entre les différents modules
