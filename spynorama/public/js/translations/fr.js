/**
 * Spynorama - Traductions françaises
 */

export default {
    // Titres et en-têtes
    "app": {
        "title": "Spynorama",
        "subtitle": "Créez des visites virtuelles interactives"
    },
    
    // Sections de la barre latérale
    "sidebar": {
        "scenes": "Scènes",
        "hotspots": "Hotspots",
        "settings": "Paramètres de la scène",
        "project": "Projet"
    },
    
    // Actions pour les scènes
    "scenes": {
        "add": "Ajouter une scène",
        "addUrl": "Ajouter via URL",
        "delete": "Supprimer",
        "deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette scène ?",
        "title": "Titre",
        "initialView": "Vue initiale",
        "setCurrentView": "Définir vue actuelle",
        "urlModalTitle": "Ajouter une scène via URL",
        "urlLabel": "URL de l'image panoramique",
        "nameLabel": "Nom de la scène",
        "urlPlaceholder": "https://exemple.com/image.jpg",
        "namePlaceholder": "Nom de la scène"
    },
    
    // Actions pour les hotspots
    "hotspots": {
        "info": "Info",
        "link": "Lien",
        "scene": "Navigation",
        "photo": "Photo",
        "video": "Vidéo",
        "audio": "Audio",
        "edit": "Éditer",
        "delete": "Supprimer",
        "save": "Enregistrer",
        "position": "Position",
        "title": "Titre",
        "content": "Contenu",
        "url": "URL",
        "target": "Ouvrir dans",
        "targetBlank": "Nouvel onglet",
        "targetSelf": "Même onglet",
        "sceneTarget": "Scène de destination",
        "photoUrl": "URL de l'image",
        "photoDescription": "Description",
        "videoUrl": "URL de la vidéo",
        "videoType": "Type de vidéo",
        "videoDescription": "Description",
        "podeducIframe": "Code iframe Podeduc",
        "podeducHelp": "Collez ici le code iframe fourni par Podeduc",
        "audioUrl": "URL du fichier audio",
        "audioFile": "Ou sélectionnez un fichier audio",
        "audioAutoplay": "Lecture automatique au chargement de la scène",
        "audioLoop": "Lecture en boucle",
        "audioDescription": "Description",
        "modalTitle": "Éditer le hotspot",
        "newHotspot": "Nouveau hotspot"
    },
    
    // Types de vidéos
    "videoTypes": {
        "youtube": "YouTube",
        "vimeo": "Vimeo",
        "podeduc": "Podeduc",
        "direct": "Lien direct"
    },
    
    // Actions pour le projet
    "project": {
        "new": "Nouveau",
        "open": "Ouvrir",
        "save": "Enregistrer",
        "export": "Exporter site web",
        "publishForge": "Publier sur la forge",
        "help": "Aide",
        "newConfirm": "Êtes-vous sûr de vouloir créer un nouveau projet ? Toutes les scènes actuelles seront perdues.",
        "backgroundMusic": "Musique de fond",
        "backgroundMusicAdd": "Ajouter une musique",
        "backgroundMusicPlay": "Lecture/Pause",
        "backgroundMusicTitle": "Configurer la musique de fond",
        "backgroundMusicUrl": "URL du fichier audio",
        "backgroundMusicFile": "Ou sélectionnez un fichier audio",
        "backgroundMusicVolume": "Volume",
        "backgroundMusicAutoplay": "Lecture automatique au chargement du projet",
        "backgroundMusicLoop": "Lecture en boucle",
        "backgroundMusicNoMusic": "Aucune musique",
        "backgroundMusicStatus": "Cliquez sur \"Ajouter\" pour sélectionner une musique",
        "backgroundMusicPlaying": "En lecture",
        "backgroundMusicPaused": "En pause",
        "backgroundMusicReady": "Prêt à jouer"
    },
    
    // Publication sur la forge
    "publish": {
        "title": "Publication sur la forge",
        "token": "Token d'accès à la forge",
        "tokenHelp": "Vous pouvez obtenir un token dans les paramètres de votre compte sur la forge.",
        "name": "Nom du spynorama",
        "etabliUrl": "URL de l'établi",
        "publishing": "Publication en cours...",
        "success": "Publication réussie !",
        "partialSuccess": "Publication terminée, mais l'URL n'est pas disponible immédiatement.",
        "error": "Erreur: {0}",
        "publishedUrl": "URL du site publié",
        "copy": "Copier",
        "copied": "URL copiée !",
        "cancel": "Annuler",
        "confirm": "Publier",
        "requiredFields": "Veuillez remplir tous les champs obligatoires."
    },
    
    // Options d'export
    "export": {
        "title": "Options d'export du site web",
        "siteTitle": "Titre du site",
        "showSceneBar": "Afficher la barre de scènes",
        "showTitle": "Afficher le titre",
        "urlImages": "Images via URL",
        "keepUrls": "Conserver les URLs externes",
        "imageQuality": "Qualité des images",
        "qualityNative": "Native - Qualité originale",
        "qualityOptimized": "Optimisée - 1 Mo max par image",
        "qualityReduced": "Réduite - 256 Ko max par image",
        "cancel": "Annuler",
        "confirm": "Exporter"
    },
    
    // Messages d'accueil
    "welcome": {
        "title": "Bienvenue dans Spynorama",
        "message": "Commencez par ajouter une scène en important une image panoramique.",
        "dragDrop": "Ou glissez-déposez une image panoramique ici",
        "formats": "Formats supportés: JPG, JPEG, PNG",
        "dropMessage": "Déposez votre image panoramique ici"
    },
    
    // Barre d'outils
    "toolbar": {
        "toggleSidebar": "Afficher/masquer la barre latérale",
        "fullscreen": "Plein écran",
        "viewInfo": "Yaw: {{yaw}}, Pitch: {{pitch}}, FOV: {{fov}}"
    },
    
    // Messages d'erreur
    "errors": {
        "sceneLoad": "Erreur lors du chargement de la scène: {{name}}",
        "invalidUrl": "Veuillez entrer une URL valide.",
        "noScenes": "Aucune scène à exporter.",
        "importError": "Erreur lors de l'importation du projet: {{message}}",
        "exportError": "Une erreur est survenue lors de l'export. Voir la console pour plus de détails."
    },
    
    // Boutons génériques
    "buttons": {
        "add": "Ajouter",
        "cancel": "Annuler",
        "confirm": "Confirmer",
        "save": "Enregistrer",
        "delete": "Supprimer",
        "close": "Fermer"
    },
    
    // Aide
    "help": {
        "title": "Aide - Spynorama",
        "welcome": "Bienvenue dans Spynorama",
        "description": "Cette application vous permet de créer des visites virtuelles interactives à partir d'images panoramiques 360°.",
        "gettingStarted": "Commencer",
        "addScene": "Ajouter une scène",
        "navigate": "Naviguer",
        "addHotspots": "Ajouter des hotspots",
        "manageProject": "Gérer le projet",
        "tips": "Conseils",
        "close": "Fermer"
    },
    
    // Langue
    "language": {
        "select": "Sélectionner la langue",
        "fr": "Français",
        "en": "Anglais",
        "es": "Espagnol",
        "de": "Allemand"
    }
};
