/**
 * Spynorama
 * Application permettant de créer et visualiser des scènes panoramiques 360° avec hotspots interactifs
 */

// Constantes et variables globales
const STORAGE_KEY = 'spynorama-project';
const DEFAULT_VIEW = { yaw: 0, pitch: 0, fov: Math.PI/2 };

// État de l'application
const appState = {
    scenes: [],            // Liste des scènes
    currentSceneIndex: -1, // Index de la scène active
    viewer: null,          // Instance du viewer Marzipano
    editMode: null,        // Mode d'édition actuel (null, 'info', 'link', 'scene')
    activeHotspot: null,   // Hotspot en cours d'édition
    dragCounter: 0,        // Compteur pour le drag & drop
    autoSaveTimer: null    // Timer pour l'autosave
};

// Gestionnaire de musique de fond
let backgroundAudioManager = null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initMarzipanoViewer();
    setupEventListeners();
    
    // Initialiser le gestionnaire de musique de fond
    import('./js/utils/audio.js').then(({ BackgroundAudioManager }) => {
        backgroundAudioManager = new BackgroundAudioManager();
        setupBackgroundMusicControls();
    }).catch(error => {
        console.error('Erreur lors du chargement du module audio:', error);
    });
    
    // Vérifier s'il y a un paramètre d'image dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const imageUrl = urlParams.get('image');
    
    if (imageUrl) {
        // Mode visualisation directe d'une image
        console.log("Mode visualisation directe: " + imageUrl);
        createDirectViewMode(imageUrl);
    } else {
        // Mode normal de l'application
        loadFromLocalStorage();
        updateUI();
    }
});

/**
 * Crée un mode de visualisation directe pour une image spécifiée par URL
 * @param {string} imageUrl - URL de l'image à afficher
 */
function createDirectViewMode(imageUrl) {
    // Masquer les éléments de l'interface d'édition
    document.querySelector('.sidebar').style.display = 'none';
    document.getElementById('toggle-sidebar-btn').style.display = 'none';
    document.getElementById('welcome-message').classList.add('hidden');
    
    // Ajuster le style du conteneur principal
    document.querySelector('.main-content').style.width = '100%';
    
    // Créer une scène temporaire
    const sceneName = "Vue directe";
    createScene(sceneName, imageUrl, true);
    
    // Ajouter un bouton de retour à l'éditeur
    const toolbar = document.querySelector('.toolbar');
    const backButton = document.createElement('button');
    backButton.className = 'btn-icon';
    backButton.innerHTML = '<i class="fas fa-edit"></i>';
    backButton.title = "Ouvrir dans l'éditeur";
    backButton.addEventListener('click', () => {
        // Rediriger vers l'éditeur sans paramètres
        window.location.href = window.location.pathname;
    });
    toolbar.appendChild(backButton);
    
    // Ajouter un bouton de partage
    const shareButton = document.createElement('button');
    shareButton.className = 'btn-icon';
    shareButton.innerHTML = '<i class="fas fa-share-alt"></i>';
    shareButton.title = "Partager cette vue";
    shareButton.addEventListener('click', () => {
        // Copier l'URL actuelle dans le presse-papier
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert("Lien copié dans le presse-papier !");
            })
            .catch(err => {
                console.error('Erreur lors de la copie du lien: ', err);
                prompt("Copiez ce lien pour partager cette vue:", window.location.href);
            });
    });
    toolbar.appendChild(shareButton);
}

/**
 * Initialise le viewer Marzipano
 */
function initMarzipanoViewer() {
    // Récupération de l'élément conteneur
    const panoElement = document.getElementById('pano-container');
    
    // Création du viewer avec les options par défaut
    const viewerOpts = {
        controls: {
            mouseViewMode: 'drag' // Mode de contrôle à la souris
        }
    };
    
    // Initialisation du viewer
    appState.viewer = new Marzipano.Viewer(panoElement, viewerOpts);
    
    // Mise à jour des informations de vue lors du déplacement
    appState.viewer.addEventListener('viewChange', () => {
        if (appState.currentSceneIndex >= 0) {
            updateViewInfo();
        }
    });
}

/**
 * Affiche ou masque les champs spécifiques au type de vidéo sélectionné
 */
function toggleVideoFields() {
    const videoType = document.getElementById('hotspot-video-type').value;
    const podeducIframeField = document.getElementById('podeduc-iframe-field');
    const videoUrlField = document.getElementById('hotspot-video-url').parentNode;
    
    if (videoType === 'podeduc') {
        podeducIframeField.style.display = 'block';
        videoUrlField.style.display = 'none';
    } else {
        podeducIframeField.style.display = 'none';
        videoUrlField.style.display = 'block';
    }
}

/**
 * Configure tous les écouteurs d'événements
 */
function setupEventListeners() {
    // Boutons d'ajout de scène
    document.getElementById('add-scene-btn').addEventListener('click', () => {
        document.getElementById('scene-file-input').click();
    });
    
    document.getElementById('welcome-add-scene-btn').addEventListener('click', () => {
        document.getElementById('scene-file-input').click();
    });
    
    // Boutons d'ajout de scène via URL
    document.getElementById('add-scene-url-btn').addEventListener('click', showAddUrlModal);
    document.getElementById('welcome-add-scene-url-btn').addEventListener('click', showAddUrlModal);
    document.getElementById('add-url-btn').addEventListener('click', addSceneFromUrl);
    document.getElementById('cancel-url-btn').addEventListener('click', closeModals);
    
    // Import d'images pour les scènes
    document.getElementById('scene-file-input').addEventListener('change', handleSceneFileSelect);
    
    // Boutons d'ajout de hotspots
    document.getElementById('add-info-hotspot-btn').addEventListener('click', () => setEditMode('info'));
    document.getElementById('add-link-hotspot-btn').addEventListener('click', () => setEditMode('link'));
    document.getElementById('add-scene-hotspot-btn').addEventListener('click', () => setEditMode('scene'));
    document.getElementById('add-photo-hotspot-btn').addEventListener('click', () => setEditMode('photo'));
    document.getElementById('add-video-hotspot-btn').addEventListener('click', () => setEditMode('video'));
    document.getElementById('add-audio-hotspot-btn').addEventListener('click', () => setEditMode('audio'));
    
    // Paramètres de la scène
    document.getElementById('scene-title').addEventListener('change', updateCurrentSceneTitle);
    document.getElementById('set-initial-view-btn').addEventListener('click', setInitialView);
    
    // Gestion du projet
    document.getElementById('new-project-btn').addEventListener('click', createNewProject);
    document.getElementById('open-project-btn').addEventListener('click', () => {
        document.getElementById('load-project-input').click();
    });
    document.getElementById('save-project-btn').addEventListener('click', exportProject);
    document.getElementById('export-website-btn').addEventListener('click', showExportOptions);
    document.getElementById('help-btn').addEventListener('click', showHelp);
    document.getElementById('load-project-input').addEventListener('change', importProject);
    
    // Barre d'outils
    document.getElementById('toggle-sidebar-btn').addEventListener('click', toggleSidebar);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Modal des hotspots
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    document.getElementById('save-hotspot-btn').addEventListener('click', saveHotspot);
    document.getElementById('delete-hotspot-btn').addEventListener('click', deleteHotspot);
    
    // Drag & drop
    setupDragAndDrop();
    
    // Clic sur le viewer pour ajouter des hotspots
    document.getElementById('pano-container').addEventListener('click', handleViewerClick);
}

/**
 * Configure les événements pour le drag & drop
 */
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const appContainer = document.querySelector('.app-container');
    
    // Prévenir le comportement par défaut pour permettre le drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        appContainer.addEventListener(eventName, preventDefaults, false);
    });
    
    // Afficher la zone de drop quand on entre dans la zone
    ['dragenter', 'dragover'].forEach(eventName => {
        appContainer.addEventListener(eventName, () => {
            appState.dragCounter++;
            if (appState.dragCounter === 1) {
                dropZone.classList.remove('hidden');
            }
        }, false);
    });
    
    // Cacher la zone de drop quand on quitte la zone
    ['dragleave', 'drop'].forEach(eventName => {
        appContainer.addEventListener(eventName, () => {
            appState.dragCounter--;
            if (appState.dragCounter === 0) {
                dropZone.classList.add('hidden');
            }
        }, false);
    });
    
    // Gérer le drop d'images
    appContainer.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
}

/**
 * Gère les fichiers déposés ou sélectionnés
 * @param {FileList} files - Liste des fichiers
 */
function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Vérifier si c'est une image
        if (file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                createScene(file.name, e.target.result);
            };
            
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Gère la sélection de fichiers pour les scènes
 * @param {Event} e - Événement de changement
 */
function handleSceneFileSelect(e) {
    handleFiles(e.target.files);
    // Réinitialiser l'input pour permettre de sélectionner le même fichier plusieurs fois
    e.target.value = '';
}

/**
 * Crée une nouvelle scène à partir d'une image
 * @param {string} name - Nom de la scène
 * @param {string} imageUrl - URL de l'image (data URL ou URL externe)
 * @param {boolean} isExternalUrl - Indique si l'image provient d'une URL externe
 */
function createScene(name, imageUrl, isExternalUrl = false) {
    // Créer un ID unique pour la scène
    const sceneId = 'scene_' + Date.now();
    
    // Extraire le nom de fichier sans extension ou utiliser un nom par défaut pour les URLs
    const fileName = isExternalUrl ? name : name.split('.')[0];
    
    console.log(`Création de la scène: ${fileName}`);
    
    // Précharger l'image pour s'assurer qu'elle est valide
    const img = new Image();
    img.crossOrigin = "anonymous"; // Permettre le chargement d'images cross-origin
    img.onload = function() {
        console.log(`Image chargée avec succès: ${fileName} (${img.width}x${img.height})`);
        
        // Créer l'objet scène
        const scene = {
            id: sceneId,
            name: fileName,
            imageUrl: imageUrl,
            isExternalUrl: isExternalUrl, // Marquer si c'est une URL externe
            initialViewParameters: { ...DEFAULT_VIEW },
            hotspots: []
        };
        
        // Ajouter la scène à la liste
        appState.scenes.push(scene);
        
        // Sélectionner la nouvelle scène
        appState.currentSceneIndex = appState.scenes.length - 1;
        
        // Mettre à jour l'interface
        updateUI();
        
        // Charger la scène dans le viewer
        loadCurrentScene();
        
        // Sauvegarder automatiquement
        scheduleAutoSave();
    };
    
    img.onerror = function() {
        console.error(`Erreur lors du chargement de l'image: ${fileName}`);
        alert(`Erreur lors du chargement de l'image: ${fileName}. Veuillez vérifier que le fichier est une image panoramique valide.`);
    };
    
    img.src = imageUrl;
}

/**
 * Charge la scène courante dans le viewer
 */
function loadCurrentScene() {
    if (appState.currentSceneIndex < 0 || appState.currentSceneIndex >= appState.scenes.length) {
        // Aucune scène à charger
        document.getElementById('welcome-message').classList.remove('hidden');
        return;
    }
    
    // Cacher le message d'accueil
    document.getElementById('welcome-message').classList.add('hidden');
    
    const scene = appState.scenes[appState.currentSceneIndex];
    
    console.log('Chargement de la scène:', scene.name);
    
    try {
        // Nettoyer le viewer avant de charger une nouvelle scène
        appState.viewer.destroyAllScenes();
        
        // Créer une source d'image pour Marzipano
        // Utiliser la méthode correcte pour la version locale de Marzipano
        const source = new Marzipano.ImageUrlSource(function(tile) {
            return { url: scene.imageUrl };
        });
        
        // Créer une géométrie équirectangulaire avec des paramètres plus simples
        const geometry = new Marzipano.EquirectGeometry([{ width: 2000 }]);
        
        // Créer un limiteur de vue avec des paramètres standards
        const limiter = Marzipano.RectilinearView.limit.traditional(2000, 100*Math.PI/180);
        
        // Créer une vue rectilinéaire avec les paramètres initiaux de la scène
        const viewParams = scene.initialViewParameters || DEFAULT_VIEW;
        const view = new Marzipano.RectilinearView(viewParams, limiter);
        
        // Créer la scène Marzipano avec des options de base
        const marzipanoScene = appState.viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
        });
        
        // Afficher la scène
        marzipanoScene.switchTo();
        
        // Ajouter les hotspots
        scene.hotspots.forEach(hotspot => {
            addHotspotToScene(marzipanoScene, hotspot);
        });
        
        // Mettre à jour les informations de vue
        updateViewInfo();
        
        console.log('Scène chargée avec succès:', scene.name);
    } catch (error) {
        console.error('Erreur lors du chargement de la scène:', error);
        alert(`Erreur lors du chargement de la scène ${scene.name}: ${error.message}`);
    }
}

/**
 * Ajoute un hotspot à la scène Marzipano
 * @param {Marzipano.Scene} marzipanoScene - Scène Marzipano
 * @param {Object} hotspot - Données du hotspot
 */
function addHotspotToScene(marzipanoScene, hotspot) {
    // Créer l'élément DOM pour le hotspot
    const element = document.createElement('div');
    element.classList.add('hotspot');
    
    // Ajouter une classe spécifique au type de hotspot
    element.classList.add(`hotspot-${hotspot.type}`);
    
    // Ajouter une icône en fonction du type
    let icon = '';
    switch (hotspot.type) {
        case 'info':
            icon = '<i class="fas fa-info-circle"></i>';
            break;
        case 'link':
            icon = '<i class="fas fa-link"></i>';
            break;
        case 'scene':
            icon = '<i class="fas fa-exchange-alt"></i>';
            break;
        case 'photo':
            icon = '<i class="fas fa-image"></i>';
            break;
        case 'video':
            icon = '<i class="fas fa-video"></i>';
            break;
        case 'audio':
            icon = '<i class="fas fa-music"></i>';
            break;
    }
    element.innerHTML = icon;
    
    // Ajouter un attribut data-id pour identifier le hotspot
    element.setAttribute('data-id', hotspot.id);
    
    // Ajouter le hotspot à la scène
    marzipanoScene.hotspotContainer().createHotspot(element, { yaw: hotspot.position.yaw, pitch: hotspot.position.pitch });
    
    // Ajouter un gestionnaire d'événements pour l'édition du hotspot
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        editHotspot(hotspot.id);
    });
    
    // Ajouter un gestionnaire d'événements pour l'affichage du tooltip
    if (hotspot.type === 'info') {
        element.addEventListener('mouseenter', () => {
            showInfoTooltip(element, hotspot);
        });
        
        element.addEventListener('mouseleave', () => {
            hideInfoTooltip();
        });
    }
    
    // Ajouter un gestionnaire d'événements pour la navigation entre scènes
    if (hotspot.type === 'scene') {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToScene(hotspot.target);
        });
    }
    
    // Ajouter un gestionnaire d'événements pour les liens externes
    if (hotspot.type === 'link') {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(hotspot.url, hotspot.target || '_blank');
        });
    }
    
    // Ajouter un gestionnaire d'événements pour les photos
    if (hotspot.type === 'photo') {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            showPhotoModal(hotspot);
        });
    }
    
    // Ajouter un gestionnaire d'événements pour les vidéos
    if (hotspot.type === 'video') {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            showVideoModal(hotspot);
        });
    }
    
    // Ajouter un gestionnaire d'événements pour les audios
    if (hotspot.type === 'audio') {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            showAudioModal(hotspot);
        });
        
        // Lecture automatique si configurée
        if (hotspot.autoplay) {
            // Attendre que la scène soit chargée
            setTimeout(() => {
                showAudioModal(hotspot);
            }, 1000);
        }
    }
}

/**
 * Affiche une modal avec une image
 * @param {Object} hotspot - Données du hotspot photo
 */
function showPhotoModal(hotspot) {
    // Créer une modal pour afficher l'image
    const photoModal = document.createElement('div');
    photoModal.classList.add('modal', 'active');
    photoModal.id = 'photo-modal';
    
    photoModal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; max-height: 90%;">
            <div class="modal-header">
                <h2>${hotspot.title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body" style="text-align: center; padding: 0;">
                <img src="${hotspot.photoUrl}" alt="${hotspot.title}" style="max-width: 100%; max-height: 70vh;">
                ${hotspot.photoDescription ? `<p style="padding: 1rem;">${hotspot.photoDescription}</p>` : ''}
            </div>
        </div>
    `;
    
    // Ajouter la modal au document
    document.body.appendChild(photoModal);
    
    // Ajouter un gestionnaire d'événements pour fermer la modal
    photoModal.querySelector('.close-modal').addEventListener('click', () => {
        photoModal.remove();
    });
    
    // Fermer la modal en cliquant en dehors
    photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) {
            photoModal.remove();
        }
    });
}

/**
 * Affiche une modal avec une vidéo
 * @param {Object} hotspot - Données du hotspot vidéo
 */
function showVideoModal(hotspot) {
    // Créer une modal pour afficher la vidéo
    const videoModal = document.createElement('div');
    videoModal.classList.add('modal', 'active');
    videoModal.id = 'video-modal';
    
    // Préparer l'iframe en fonction du type de vidéo
    let videoEmbed = '';
    
    switch (hotspot.videoType) {
        case 'youtube':
            // Extraire l'ID de la vidéo YouTube
            const youtubeId = extractYoutubeId(hotspot.videoUrl);
            if (youtubeId) {
                videoEmbed = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`;
            } else {
                videoEmbed = `<p>URL YouTube invalide</p>`;
            }
            break;
        case 'vimeo':
            // Extraire l'ID de la vidéo Vimeo
            const vimeoId = extractVimeoId(hotspot.videoUrl);
            if (vimeoId) {
                videoEmbed = `<iframe width="100%" height="400" src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allowfullscreen></iframe>`;
            } else {
                videoEmbed = `<p>URL Vimeo invalide</p>`;
            }
            break;
        case 'podeduc':
            // Utiliser directement le code iframe fourni
            if (hotspot.podeducIframe) {
                // Modifier l'iframe pour s'adapter à la modal
                let iframe = hotspot.podeducIframe;
                // Remplacer width et height par des valeurs adaptées à la modal
                iframe = iframe.replace(/width="[^"]*"/, 'width="100%"');
                iframe = iframe.replace(/height="[^"]*"/, 'height="400"');
                videoEmbed = iframe;
            } else {
                // Fallback au comportement précédent si podeducIframe n'est pas défini
                const podeducId = extractPodeducId(hotspot.videoUrl);
                if (podeducId) {
                    videoEmbed = `<iframe src="https://podeduc.apps.education.fr/video/${podeducId}/?is_iframe=true" width="100%" height="400" style="padding: 0; margin: 0; border:0" allowfullscreen></iframe>`;
                } else {
                    videoEmbed = `<p>URL Podeduc invalide</p>`;
                }
            }
            break;
        case 'direct':
            videoEmbed = `<video width="100%" height="400" controls>
                <source src="${hotspot.videoUrl}" type="video/mp4">
                Votre navigateur ne supporte pas la lecture de vidéos.
            </video>`;
            break;
    }
    
    videoModal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>${hotspot.title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 0;">
                ${videoEmbed}
                ${hotspot.videoDescription ? `<p style="padding: 1rem;">${hotspot.videoDescription}</p>` : ''}
            </div>
        </div>
    `;
    
    // Ajouter la modal au document
    document.body.appendChild(videoModal);
    
    // Ajouter un gestionnaire d'événements pour fermer la modal
    videoModal.querySelector('.close-modal').addEventListener('click', () => {
        videoModal.remove();
    });
    
    // Fermer la modal en cliquant en dehors
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            videoModal.remove();
        }
    });
}

/**
 * Affiche une modal avec un lecteur audio
 * @param {Object} hotspot - Données du hotspot audio
 */
function showAudioModal(hotspot) {
    // Créer une modal pour afficher le lecteur audio
    const audioModal = document.createElement('div');
    audioModal.classList.add('modal', 'active');
    audioModal.id = 'audio-modal';
    
    // Déterminer la source audio
    let audioSrc = '';
    if (hotspot.audioDataUrl) {
        // Utiliser les données audio chargées
        audioSrc = hotspot.audioDataUrl;
    } else if (hotspot.audioUrl) {
        // Utiliser l'URL audio
        audioSrc = hotspot.audioUrl;
    }
    
    // Créer l'élément audio
    const audio = new Audio(audioSrc);
    audio.controls = true;
    audio.autoplay = hotspot.autoplay || false;
    audio.loop = hotspot.loop || false;
    
    // Importer les utilitaires audio
    import('./js/utils/audio.js').then(({ AudioUtils }) => {
        // Créer le contenu de la modal
        audioModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>${hotspot.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="audio-player-container"></div>
                    ${hotspot.audioDescription ? `<p style="padding: 1rem;">${hotspot.audioDescription}</p>` : ''}
                </div>
            </div>
        `;
        
        // Ajouter la modal au document
        document.body.appendChild(audioModal);
        
        // Ajouter le contrôle audio personnalisé
        const audioPlayerContainer = document.getElementById('audio-player-container');
        const audioControl = AudioUtils.createAudioControl(audio);
        audioPlayerContainer.appendChild(audioControl);
        
        // Ajouter un gestionnaire d'événements pour fermer la modal
        audioModal.querySelector('.close-modal').addEventListener('click', () => {
            audio.pause();
            audioModal.remove();
        });
        
        // Fermer la modal en cliquant en dehors
        audioModal.addEventListener('click', (e) => {
            if (e.target === audioModal) {
                audio.pause();
                audioModal.remove();
            }
        });
    }).catch(error => {
        console.error('Erreur lors du chargement des utilitaires audio:', error);
        
        // Fallback simple si le module audio n'est pas chargé
        audioModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>${hotspot.title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <audio controls src="${audioSrc}" ${hotspot.autoplay ? 'autoplay' : ''} ${hotspot.loop ? 'loop' : ''}></audio>
                    ${hotspot.audioDescription ? `<p style="padding: 1rem;">${hotspot.audioDescription}</p>` : ''}
                </div>
            </div>
        `;
        
        // Ajouter la modal au document
        document.body.appendChild(audioModal);
        
        // Ajouter un gestionnaire d'événements pour fermer la modal
        audioModal.querySelector('.close-modal').addEventListener('click', () => {
            audioModal.remove();
        });
        
        // Fermer la modal en cliquant en dehors
        audioModal.addEventListener('click', (e) => {
            if (e.target === audioModal) {
                audioModal.remove();
            }
        });
    });
}

/**
 * Extrait l'ID d'une vidéo YouTube à partir de son URL
 * @param {string} url - URL de la vidéo YouTube
 * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
 */
function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extrait l'ID d'une vidéo Vimeo à partir de son URL
 * @param {string} url - URL de la vidéo Vimeo
 * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
 */
function extractVimeoId(url) {
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? match[3] : null;
}

/**
 * Extrait l'ID d'une vidéo Podeduc à partir de son URL
 * @param {string} url - URL de la vidéo Podeduc
 * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
 */
function extractPodeducId(url) {
    // Format: https://podeduc.apps.education.fr/video/86450-presentation-du-village-decouche-par-des-collegiens-de-4e/
    const regExp = /podeduc\.apps\.education\.fr\/video\/(\d+)(?:-[^\/]*)?(?:\/|\?|$)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

/**
 * Affiche un tooltip d'information pour un hotspot
 * @param {HTMLElement} element - Élément du hotspot
 * @param {Object} hotspot - Données du hotspot
 */
function showInfoTooltip(element, hotspot) {
    // Supprimer tout tooltip existant
    hideInfoTooltip();
    
    // Créer le tooltip
    const tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.id = 'hotspot-tooltip';
    
    // Ajouter le contenu
    let content = '';
    if (hotspot.title) {
        content += `<h3>${hotspot.title}</h3>`;
    }
    if (hotspot.content) {
        content += `<p>${hotspot.content}</p>`;
    }
    tooltip.innerHTML = content;
    
    // Ajouter le tooltip au hotspot
    element.appendChild(tooltip);
}

/**
 * Cache le tooltip d'information
 */
function hideInfoTooltip() {
    const tooltip = document.getElementById('hotspot-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

/**
 * Navigue vers une scène spécifique
 * @param {string} sceneId - ID de la scène cible
 */
function navigateToScene(sceneId) {
    const targetIndex = appState.scenes.findIndex(scene => scene.id === sceneId);
    if (targetIndex >= 0) {
        appState.currentSceneIndex = targetIndex;
        loadCurrentScene();
        updateUI();
    }
}

/**
 * Gère le clic sur le viewer pour ajouter des hotspots
 * @param {Event} e - Événement de clic
 */
function handleViewerClick(e) {
    // Ne rien faire si on n'est pas en mode édition ou si aucune scène n'est chargée
    if (!appState.editMode || appState.currentSceneIndex < 0) {
        return;
    }
    
    console.log("Clic détecté en mode édition:", appState.editMode);
    
    // Récupérer la position du clic dans le viewer
    const panoContainer = document.getElementById('pano-container');
    const rect = panoContainer.getBoundingClientRect();
    const viewerX = e.clientX - rect.left;
    const viewerY = e.clientY - rect.top;
    
    console.log("Coordonnées du clic:", viewerX, viewerY);
    
    // Convertir les coordonnées en yaw/pitch
    const view = appState.viewer.view();
    
    // Calculer les coordonnées normalisées (de 0 à 1)
    const normalizedX = viewerX / rect.width;
    const normalizedY = viewerY / rect.height;
    
    // Convertir en yaw/pitch
    // Le yaw va de -PI à PI (de gauche à droite)
    // Le pitch va de -PI/2 à PI/2 (de haut en bas)
    const yaw = view.parameters().yaw + (normalizedX - 0.5) * view.parameters().fov;
    const pitch = view.parameters().pitch + (normalizedY - 0.5) * view.parameters().fov * (rect.height / rect.width);
    
    console.log("Coordonnées yaw/pitch calculées:", yaw, pitch);
    
    // Créer un nouveau hotspot
    createHotspot(appState.editMode, yaw, pitch);
    
    // Désactiver le mode édition après avoir ajouté un hotspot
    setEditMode(null);
}

/**
 * Crée un nouveau hotspot
 * @param {string} type - Type de hotspot ('info', 'link', 'scene', 'photo', 'video', 'audio')
 * @param {number} yaw - Position horizontale
 * @param {number} pitch - Position verticale
 */
function createHotspot(type, yaw, pitch) {
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    // Créer un ID unique pour le hotspot
    const hotspotId = 'hotspot_' + Date.now();
    
    // Créer l'objet hotspot de base
    const hotspot = {
        id: hotspotId,
        type: type,
        position: { yaw, pitch },
        title: `Nouveau hotspot ${type}`
    };
    
    // Ajouter des propriétés spécifiques au type
    switch (type) {
        case 'info':
            hotspot.content = '';
            break;
        case 'link':
            hotspot.url = 'https://';
            hotspot.target = '_blank';
            break;
        case 'scene':
            // Si d'autres scènes existent, définir la première comme cible par défaut
            if (appState.scenes.length > 1) {
                const targetScenes = appState.scenes.filter((_, index) => index !== appState.currentSceneIndex);
                if (targetScenes.length > 0) {
                    hotspot.target = targetScenes[0].id;
                }
            }
            break;
        case 'photo':
            hotspot.photoUrl = '';
            hotspot.photoDescription = '';
            break;
        case 'video':
            hotspot.videoUrl = '';
            hotspot.videoType = 'youtube';
            hotspot.videoDescription = '';
            break;
        case 'audio':
            hotspot.audioUrl = '';
            hotspot.audioDataUrl = null;
            hotspot.autoplay = false;
            hotspot.loop = false;
            hotspot.audioDescription = '';
            break;
    }
    
    // Ajouter le hotspot à la scène courante
    appState.scenes[appState.currentSceneIndex].hotspots.push(hotspot);
    
    // Recharger la scène pour afficher le nouveau hotspot
    loadCurrentScene();
    
    // Mettre à jour l'interface
    updateHotspotsList();
    
    // Ouvrir la modal d'édition pour le nouveau hotspot
    editHotspot(hotspotId);
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Définit le mode d'édition actuel
 * @param {string|null} mode - Mode d'édition ('info', 'link', 'scene' ou null)
 */
function setEditMode(mode) {
    appState.editMode = mode;
    
    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.hotspot-actions .btn').forEach(btn => {
        btn.classList.remove('primary');
    });
    
    if (mode) {
        document.getElementById(`add-${mode}-hotspot-btn`).classList.add('primary');
        document.getElementById('pano-container').style.cursor = 'crosshair';
    } else {
        document.getElementById('pano-container').style.cursor = 'grab';
    }
}

/**
 * Ouvre la modal d'édition pour un hotspot
 * @param {string} hotspotId - ID du hotspot à éditer
 */
function editHotspot(hotspotId) {
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    // Trouver le hotspot dans la scène courante
    const hotspot = appState.scenes[appState.currentSceneIndex].hotspots.find(h => h.id === hotspotId);
    if (!hotspot) {
        return;
    }
    
    // Stocker le hotspot actif
    appState.activeHotspot = hotspot;
    
    // Mettre à jour le titre de la modal
    document.getElementById('hotspot-modal-title').textContent = `Éditer le hotspot ${hotspot.type}`;
    
    // Remplir les champs communs
    document.getElementById('hotspot-title').value = hotspot.title || '';
    document.getElementById('hotspot-yaw').textContent = hotspot.position.yaw.toFixed(2);
    document.getElementById('hotspot-pitch').textContent = hotspot.position.pitch.toFixed(2);
    
    // Cacher tous les champs spécifiques
    document.getElementById('info-hotspot-fields').style.display = 'none';
    document.getElementById('link-hotspot-fields').style.display = 'none';
    document.getElementById('scene-hotspot-fields').style.display = 'none';
    document.getElementById('photo-hotspot-fields').style.display = 'none';
    document.getElementById('video-hotspot-fields').style.display = 'none';
    document.getElementById('audio-hotspot-fields').style.display = 'none';
    
    // Afficher les champs spécifiques au type
    switch (hotspot.type) {
        case 'info':
            document.getElementById('info-hotspot-fields').style.display = 'block';
            document.getElementById('hotspot-content').value = hotspot.content || '';
            break;
        case 'link':
            document.getElementById('link-hotspot-fields').style.display = 'block';
            document.getElementById('hotspot-url').value = hotspot.url || 'https://';
            document.getElementById('hotspot-target').value = hotspot.target || '_blank';
            break;
        case 'scene':
            document.getElementById('scene-hotspot-fields').style.display = 'block';
            
            // Remplir la liste des scènes cibles
            const selectElement = document.getElementById('hotspot-scene-target');
            selectElement.innerHTML = '';
            
            appState.scenes.forEach((scene, index) => {
                // Ne pas inclure la scène courante comme cible
                if (index !== appState.currentSceneIndex) {
                    const option = document.createElement('option');
                    option.value = scene.id;
                    option.textContent = scene.name;
                    selectElement.appendChild(option);
                }
            });
            
            // Sélectionner la scène cible actuelle
            if (hotspot.target) {
                selectElement.value = hotspot.target;
            }
            break;
        case 'photo':
            document.getElementById('photo-hotspot-fields').style.display = 'block';
            document.getElementById('hotspot-photo-url').value = hotspot.photoUrl || '';
            document.getElementById('hotspot-photo-description').value = hotspot.photoDescription || '';
            break;
        case 'video':
            document.getElementById('video-hotspot-fields').style.display = 'block';
            document.getElementById('hotspot-video-url').value = hotspot.videoUrl || '';
            document.getElementById('hotspot-video-type').value = hotspot.videoType || 'youtube';
            document.getElementById('hotspot-video-description').value = hotspot.videoDescription || '';
            
            // Afficher/masquer le champ iframe pour Podeduc
            if (hotspot.videoType === 'podeduc') {
                document.getElementById('podeduc-iframe-field').style.display = 'block';
                document.getElementById('hotspot-video-url').parentNode.style.display = 'none';
                document.getElementById('hotspot-podeduc-iframe').value = hotspot.podeducIframe || '';
            } else {
                document.getElementById('podeduc-iframe-field').style.display = 'none';
                document.getElementById('hotspot-video-url').parentNode.style.display = 'block';
            }
            break;
        case 'audio':
            document.getElementById('audio-hotspot-fields').style.display = 'block';
            document.getElementById('hotspot-audio-url').value = hotspot.audioUrl || '';
            document.getElementById('hotspot-audio-autoplay').checked = hotspot.autoplay || false;
            document.getElementById('hotspot-audio-loop').checked = hotspot.loop || false;
            document.getElementById('hotspot-audio-description').value = hotspot.audioDescription || '';
            
            // Afficher le nom du fichier audio s'il a été chargé
            if (hotspot.audioDataUrl) {
                const fileNameDisplay = document.createElement('div');
                fileNameDisplay.className = 'file-name-display';
                fileNameDisplay.textContent = 'Fichier audio chargé';
                
                // Remplacer l'affichage précédent s'il existe
                const previousDisplay = document.querySelector('.file-name-display');
                if (previousDisplay) {
                    previousDisplay.remove();
                }
                
                // Ajouter le nouvel affichage après l'input
                const audioFileInput = document.getElementById('hotspot-audio-file');
                audioFileInput.parentNode.appendChild(fileNameDisplay);
            }
            break;
    }
    
    // Afficher la modal
    document.getElementById('hotspot-modal').classList.add('active');
}

/**
 * Ferme toutes les modals
 */
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Réinitialiser le hotspot actif
    appState.activeHotspot = null;
}

/**
 * Enregistre les modifications d'un hotspot
 */
function saveHotspot() {
    // Vérifier qu'un hotspot est actif
    if (!appState.activeHotspot) {
        return;
    }
    
    // Récupérer les valeurs communes
    appState.activeHotspot.title = document.getElementById('hotspot-title').value;
    
    // Récupérer les valeurs spécifiques au type
    switch (appState.activeHotspot.type) {
        case 'info':
            appState.activeHotspot.content = document.getElementById('hotspot-content').value;
            break;
        case 'link':
            appState.activeHotspot.url = document.getElementById('hotspot-url').value;
            appState.activeHotspot.target = document.getElementById('hotspot-target').value;
            break;
        case 'scene':
            appState.activeHotspot.target = document.getElementById('hotspot-scene-target').value;
            break;
        case 'photo':
            appState.activeHotspot.photoUrl = document.getElementById('hotspot-photo-url').value;
            appState.activeHotspot.photoDescription = document.getElementById('hotspot-photo-description').value;
            break;
        case 'video':
            appState.activeHotspot.videoType = document.getElementById('hotspot-video-type').value;
            appState.activeHotspot.videoDescription = document.getElementById('hotspot-video-description').value;
            
            // Pour les vidéos Podeduc, sauvegarder le code iframe
            if (appState.activeHotspot.videoType === 'podeduc') {
                appState.activeHotspot.podeducIframe = document.getElementById('hotspot-podeduc-iframe').value;
            } else {
                appState.activeHotspot.videoUrl = document.getElementById('hotspot-video-url').value;
            }
            break;
        case 'audio':
            appState.activeHotspot.audioUrl = document.getElementById('hotspot-audio-url').value;
            appState.activeHotspot.autoplay = document.getElementById('hotspot-audio-autoplay').checked;
            appState.activeHotspot.loop = document.getElementById('hotspot-audio-loop').checked;
            appState.activeHotspot.audioDescription = document.getElementById('hotspot-audio-description').value;
            break;
    }
    
    // Recharger la scène pour mettre à jour le hotspot
    loadCurrentScene();
    
    // Mettre à jour l'interface
    updateHotspotsList();
    
    // Fermer la modal
    closeModals();
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Supprime le hotspot actif
 */
function deleteHotspot() {
    // Vérifier qu'un hotspot est actif
    if (!appState.activeHotspot || appState.currentSceneIndex < 0) {
        return;
    }
    
    // Trouver l'index du hotspot dans la scène courante
    const hotspotIndex = appState.scenes[appState.currentSceneIndex].hotspots.findIndex(h => h.id === appState.activeHotspot.id);
    if (hotspotIndex >= 0) {
        // Supprimer le hotspot
        appState.scenes[appState.currentSceneIndex].hotspots.splice(hotspotIndex, 1);
        
        // Recharger la scène
        loadCurrentScene();
        
        // Mettre à jour l'interface
        updateHotspotsList();
        
        // Fermer la modal
        closeModals();
        
        // Sauvegarder automatiquement
        scheduleAutoSave();
    }
}

/**
 * Met à jour le titre de la scène courante
 */
function updateCurrentSceneTitle() {
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    // Mettre à jour le titre
    appState.scenes[appState.currentSceneIndex].name = document.getElementById('scene-title').value;
    
    // Mettre à jour l'interface
    updateScenesList();
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Définit la vue actuelle comme vue initiale pour la scène courante
 */
function setInitialView() {
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    // Récupérer la vue actuelle
    const view = appState.viewer.view();
    const params = view.parameters();
    
    // Mettre à jour les paramètres de vue initiale
    appState.scenes[appState.currentSceneIndex].initialViewParameters = {
        yaw: params.yaw,
        pitch: params.pitch,
        fov: params.fov
    };
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Met à jour les informations de vue dans la barre d'outils
 */
function updateViewInfo() {
    // Récupérer la vue actuelle
    const view = appState.viewer.view();
    const params = view.parameters();
    
    // Mettre à jour le texte
    document.getElementById('view-info-text').textContent = `Yaw: ${params.yaw.toFixed(2)}, Pitch: ${params.pitch.toFixed(2)}, FOV: ${params.fov.toFixed(2)}`;
}

/**
 * Bascule l'affichage de la barre latérale
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (!overlay) {
        // Create overlay if it doesn't exist
        const newOverlay = document.createElement('div');
        newOverlay.className = 'sidebar-overlay';
        newOverlay.addEventListener('click', toggleSidebar);
        document.body.appendChild(newOverlay);
    }
    
    sidebar.classList.toggle('active');
    
    // Close menu when clicking on overlay
    if (sidebar.classList.contains('active')) {
        document.addEventListener('click', handleOutsideClick, true);
    } else {
        document.removeEventListener('click', handleOutsideClick, true);
    }
}

function handleOutsideClick(e) {
    const sidebar = document.querySelector('.sidebar');
    const isClickInside = sidebar.contains(e.target) || 
                         e.target.classList.contains('toggle-sidebar-btn');
    
    if (!isClickInside) {
        toggleSidebar();
    }
}

/**
 * Bascule le mode plein écran
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/**
 * Met à jour l'interface utilisateur
 */
function updateUI() {
    updateScenesList();
    updateHotspotsList();
    updateSceneSettings();
}

/**
 * Met à jour la liste des scènes
 */
function updateScenesList() {
    console.log('Updating scenes list...');
    const scenesList = document.getElementById('scenes-list');
    scenesList.innerHTML = '';
    
    appState.scenes.forEach((scene, index) => {
        console.log(`Adding scene: ${scene.name} (index: ${index})`);
        const listItem = document.createElement('div');
        listItem.classList.add('list-item');
        if (index === appState.currentSceneIndex) {
            listItem.classList.add('active');
        }
        
        listItem.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-title">${scene.name}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Ajouter un gestionnaire d'événements pour la sélection de la scène
        listItem.addEventListener('click', () => {
            console.log(`Scene clicked: ${scene.name} (index: ${index})`);
            appState.currentSceneIndex = index;
            loadCurrentScene();
            updateUI();
        });
        
        // Ajouter un gestionnaire d'événements pour la suppression de la scène
        listItem.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteScene(index);
        });
        
        scenesList.appendChild(listItem);
    });
}

/**
 * Met à jour la liste des hotspots
 */
function updateHotspotsList() {
    const hotspotsList = document.getElementById('hotspots-list');
    hotspotsList.innerHTML = '';
    
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    const scene = appState.scenes[appState.currentSceneIndex];
    
    scene.hotspots.forEach(hotspot => {
        const listItem = document.createElement('div');
        listItem.classList.add('list-item');
        
        // Déterminer l'icône en fonction du type
        let icon = '';
        switch (hotspot.type) {
            case 'info':
                icon = '<i class="fas fa-info-circle"></i>';
                break;
            case 'link':
                icon = '<i class="fas fa-link"></i>';
                break;
            case 'scene':
                icon = '<i class="fas fa-exchange-alt"></i>';
                break;
            case 'photo':
                icon = '<i class="fas fa-image"></i>';
                break;
            case 'video':
                icon = '<i class="fas fa-video"></i>';
                break;
            case 'audio':
                icon = '<i class="fas fa-music"></i>';
                break;
        }
        
        listItem.innerHTML = `
            <div class="list-item-content">
                <div class="list-item-title">${icon} ${hotspot.title}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-edit" title="Éditer"><i class="fas fa-edit"></i></button>
            </div>
        `;
        
        // Ajouter un gestionnaire d'événements pour l'édition du hotspot
        listItem.querySelector('.btn-edit').addEventListener('click', () => {
            editHotspot(hotspot.id);
        });
        
        hotspotsList.appendChild(listItem);
    });
}

/**
 * Met à jour les paramètres de la scène
 */
function updateSceneSettings() {
    const titleInput = document.getElementById('scene-title');
    const setViewBtn = document.getElementById('set-initial-view-btn');
    
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        titleInput.value = '';
        titleInput.disabled = true;
        setViewBtn.disabled = true;
    } else {
        const scene = appState.scenes[appState.currentSceneIndex];
        titleInput.value = scene.name;
        titleInput.disabled = false;
        setViewBtn.disabled = false;
    }
}

/**
 * Supprime une scène
 * @param {number} index - Index de la scène à supprimer
 */
function deleteScene(index) {
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette scène ?')) {
        return;
    }
    
    // Supprimer la scène
    appState.scenes.splice(index, 1);
    
    // Mettre à jour l'index de la scène courante
    if (appState.scenes.length === 0) {
        appState.currentSceneIndex = -1;
    } else if (appState.currentSceneIndex >= appState.scenes.length) {
        appState.currentSceneIndex = appState.scenes.length - 1;
    }
    
    // Recharger la scène courante
    loadCurrentScene();
    
    // Mettre à jour l'interface
    updateUI();
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Exporte le projet au format JSON
 */
function exportProject() {
    // Vérifier qu'il y a des scènes à exporter
    if (appState.scenes.length === 0) {
        alert('Aucune scène à exporter.');
        return;
    }
    
    // Créer l'objet projet
    const project = {
        version: '1.0',
        scenes: appState.scenes,
        currentSceneIndex: appState.currentSceneIndex
    };
    
    // Convertir en JSON
    const jsonString = JSON.stringify(project, null, 2);
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spynorama-project.json';
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Importe un projet depuis un fichier JSON
 * @param {Event} e - Événement de changement
 */
function importProject(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Parser le JSON
            const project = JSON.parse(e.target.result);
            
            // Vérifier la structure du projet
            if (!project.scenes || !Array.isArray(project.scenes)) {
                throw new Error('Format de projet invalide.');
            }
            
            // Charger le projet
            appState.scenes = project.scenes;
            appState.currentSceneIndex = project.currentSceneIndex || 0;
            
            // Si l'index de scène est invalide, le réinitialiser
            if (appState.currentSceneIndex < 0 || appState.currentSceneIndex >= appState.scenes.length) {
                appState.currentSceneIndex = appState.scenes.length > 0 ? 0 : -1;
            }
            
            // Mettre à jour l'interface
            updateUI();
            
            // Charger la scène courante
            loadCurrentScene();
            
            // Sauvegarder automatiquement
            scheduleAutoSave();
            
        } catch (error) {
            alert('Erreur lors de l\'importation du projet : ' + error.message);
        }
    };
    
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier plusieurs fois
    e.target.value = '';
}

/**
 * Charge le projet depuis le localStorage
 */
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const project = JSON.parse(savedData);
            
            // Vérifier la structure du projet
            if (!project.scenes || !Array.isArray(project.scenes)) {
                throw new Error('Format de projet invalide.');
            }
            
            // Charger le projet
            appState.scenes = project.scenes;
            appState.currentSceneIndex = project.currentSceneIndex || 0;
            
            // Si l'index de scène est invalide, le réinitialiser
            if (appState.currentSceneIndex < 0 || appState.currentSceneIndex >= appState.scenes.length) {
                appState.currentSceneIndex = appState.scenes.length > 0 ? 0 : -1;
            }
            
            console.log('Projet chargé depuis le localStorage.');
        }
    } catch (error) {
        console.error('Erreur lors du chargement depuis le localStorage :', error);
    }
}

/**
 * Sauvegarde le projet dans le localStorage
 */
function saveToLocalStorage() {
    try {
        // Créer l'objet projet
        const project = {
            version: '1.0',
            scenes: appState.scenes,
            currentSceneIndex: appState.currentSceneIndex
        };
        
        // Convertir en JSON et sauvegarder
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        
        console.log('Projet sauvegardé dans le localStorage.');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde dans le localStorage :', error);
    }
}

/**
 * Planifie une sauvegarde automatique
 */
function scheduleAutoSave() {
    // Annuler tout timer existant
    if (appState.autoSaveTimer) {
        clearTimeout(appState.autoSaveTimer);
    }
    
    // Planifier une nouvelle sauvegarde
    appState.autoSaveTimer = setTimeout(() => {
        saveToLocalStorage();
    }, 2000); // Délai de 2 secondes
}

/**
 * Crée un nouveau projet vide
 */
function createNewProject() {
    // Demander confirmation si un projet existe déjà
    if (appState.scenes.length > 0) {
        if (!confirm('Êtes-vous sûr de vouloir créer un nouveau projet ? Toutes les scènes actuelles seront perdues.')) {
            return;
        }
    }
    
    // Réinitialiser l'état de l'application
    appState.scenes = [];
    appState.currentSceneIndex = -1;
    
    // Nettoyer le viewer
    appState.viewer.destroyAllScenes();
    
    // Mettre à jour l'interface
    updateUI();
    
    // Afficher le message d'accueil
    document.getElementById('welcome-message').classList.remove('hidden');
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
    
    console.log('Nouveau projet créé.');
}

/**
 * Affiche l'aide de l'application
 */
function showHelp() {
    // Créer une modal d'aide
    const helpModal = document.createElement('div');
    helpModal.classList.add('modal', 'active');
    helpModal.id = 'help-modal';
    
    helpModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Aide - Spynorama</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <h3>Bienvenue dans Spynorama</h3>
                <p>Cette application vous permet de créer des visites virtuelles interactives à partir d'images panoramiques 360°.</p>
                
                <h4>Commencer</h4>
                <ul>
                    <li><strong>Ajouter une scène</strong> : Cliquez sur "Ajouter une scène" et sélectionnez une image panoramique.</li>
                    <li><strong>Naviguer</strong> : Utilisez la souris pour vous déplacer dans la vue 360°.</li>
                </ul>
                
                <h4>Ajouter des hotspots</h4>
                <ul>
                    <li><strong>Info</strong> : Ajoute un point d'information qui affiche un texte au survol.</li>
                    <li><strong>Lien</strong> : Ajoute un lien vers une page web externe.</li>
                    <li><strong>Navigation</strong> : Permet de naviguer entre différentes scènes.</li>
                </ul>
                
                <h4>Gérer le projet</h4>
                <ul>
                    <li><strong>Nouveau</strong> : Crée un nouveau projet vide.</li>
                    <li><strong>Ouvrir</strong> : Charge un projet existant depuis un fichier JSON.</li>
                    <li><strong>Enregistrer</strong> : Sauvegarde le projet actuel dans un fichier JSON.</li>
                    <li><strong>Exporter site web</strong> : Génère un site web autonome avec la visite virtuelle.</li>
                </ul>
                
                <h4>Conseils</h4>
                <ul>
                    <li>Utilisez des images équirectangulaires 360° pour de meilleurs résultats.</li>
                    <li>Définissez la vue initiale de chaque scène pour orienter correctement le visiteur.</li>
                    <li>Votre projet est automatiquement sauvegardé dans le navigateur.</li>
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn primary close-help">Fermer</button>
            </div>
        </div>
    `;
    
    // Ajouter la modal au document
    document.body.appendChild(helpModal);
    
    // Ajouter les gestionnaires d'événements pour fermer la modal
    helpModal.querySelector('.close-modal').addEventListener('click', () => {
        helpModal.remove();
    });
    
    helpModal.querySelector('.close-help').addEventListener('click', () => {
        helpModal.remove();
    });
    
    // Fermer la modal en cliquant en dehors
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.remove();
        }
    });
}

/**
 * Affiche la modal pour ajouter une scène via URL
 */
function showAddUrlModal() {
    // Réinitialiser les champs
    document.getElementById('scene-url').value = '';
    document.getElementById('scene-url-name').value = '';
    
    // Afficher la modal
    document.getElementById('add-url-modal').classList.add('active');
}

/**
 * Ajoute une scène à partir d'une URL
 */
function addSceneFromUrl() {
    const url = document.getElementById('scene-url').value.trim();
    const name = document.getElementById('scene-url-name').value.trim() || 'Scène URL';
    
    if (!url) {
        alert('Veuillez entrer une URL valide.');
        return;
    }
    
    // Créer la scène avec l'URL externe
    createScene(name, url, true);
    
    // Fermer la modal
    closeModals();
}

/**
 * Affiche la modal des options d'export
 */
function showExportOptions() {
    // Vérifier qu'il y a des scènes à exporter
    if (appState.scenes.length === 0) {
        alert('Aucune scène à exporter. Veuillez ajouter au moins une scène.');
        return;
    }
    
    // Afficher la modal
    const modal = document.getElementById('export-options-modal');
    modal.classList.add('active');
    
    // Vérifier s'il y a des images URL dans le projet
    const hasUrlImages = appState.scenes.some(scene => scene.isExternalUrl);
    
    // Afficher ou masquer l'option pour les images URL
    const urlImagesGroup = document.getElementById('export-url-images-group');
    if (urlImagesGroup) {
        urlImagesGroup.style.display = hasUrlImages ? 'block' : 'none';
    }
    
    // Configurer les écouteurs d'événements pour la modal
    
    // Les options d'autorotation ont été supprimées
    
    // Bouton d'annulation
    document.getElementById('cancel-export-btn').addEventListener('click', closeModals);
    
    // Bouton de confirmation
    document.getElementById('confirm-export-btn').addEventListener('click', exportWebsite);
}

/**
 * Met à jour l'affichage de la vitesse de rotation
 */
function updateAutoRotateSpeedValue() {
    const speedSlider = document.getElementById('export-autorotate-speed');
    const speedValue = document.getElementById('autorotate-speed-value');
    speedValue.textContent = `${speedSlider.value}°/s`;
}

/**
 * Affiche/masque le groupe de vitesse de rotation en fonction de l'état de la case à cocher
 */
function toggleAutoRotateSpeedGroup() {
    const autorotateCheckbox = document.getElementById('export-autorotate');
    const speedGroup = document.getElementById('autorotate-speed-group');
    
    if (autorotateCheckbox.checked) {
        speedGroup.style.display = 'block';
    } else {
        speedGroup.style.display = 'none';
    }
}

/**
 * Génère et télécharge le site web
 */
function exportWebsite() {
    // Récupérer les options d'export
    const title = document.getElementById('export-title').value;
    const autorotate = false; // Option supprimée de l'interface
    const autorotateSpeed = 0; // Option supprimée de l'interface
    const showSceneBar = document.getElementById('export-scenebar').checked;
    const showTitle = document.getElementById('export-show-title').checked;
    const imageQuality = document.getElementById('export-image-quality').value;
    
    
    // Créer le contenu des fichiers
    
    // 1. index.html
    const indexHtml = generateIndexHtml(title, showTitle);
    
    // 2. style.css
    const styleCss = generateStyleCss();
    
    // 3. viewer.js
    const viewerJs = generateViewerJs(autorotate, autorotateSpeed, showSceneBar);
    
    // 4. data.js
    const dataJs = generateDataJs();
    
    // Créer un fichier ZIP
    const zip = new JSZip();

    // Créer les dossiers nécessaires
    zip.folder('css');
    zip.folder('js');
    zip.folder('images');

    // Ajouter les fichiers au ZIP (sauf data.js qui sera généré après traitement des images)
    zip.file('index.html', indexHtml);
    zip.file('css/style.css', styleCss);
    zip.file('css/icons.css', getIconsCss());
    zip.file('js/viewer.js', viewerJs);
    zip.file('js/marzipano.min.js', getMarzipanoJs());

    // Récupérer l'option pour les images URL
    const urlImagesOption = 'keep'; // Seule option disponible maintenant

    // Traiter les images selon la qualité sélectionnée
    const imagePromises = appState.scenes.map((scene, index) => {
        return new Promise((resolve) => {
            // Si c'est une URL externe, toujours conserver l'URL
            if (scene.isExternalUrl) {
                // Conserver l'URL externe
                resolve({index, imageUrl: scene.imageUrl, isExternalUrl: true});
                return;
            }
            
            if (imageQuality === 'native') {
                // Utiliser l'image originale
                resolve({index, imageUrl: scene.imageUrl, isExternalUrl: false});
            } else {
                // Redimensionner l'image selon la qualité
                const maxSize = imageQuality === 'optimized' ? 1024 * 1024 : 256 * 1024;
                resizeImage(scene.imageUrl, maxSize).then(resizedImageUrl => {
                    resolve({index, imageUrl: resizedImageUrl, isExternalUrl: false});
                });
            }
        });
    });

    // Attendre que toutes les images soient traitées
    Promise.all(imagePromises).then(processedScenes => {
        // Créer une copie des scènes avec les URLs traitées
        const exportScenes = appState.scenes.map((scene, i) => {
            const processedScene = processedScenes.find(s => s.index === i);
            
        // Si c'est une URL externe
        if (processedScene.isExternalUrl) {
                return {
                    ...scene,
                    imageUrl: processedScene.imageUrl
                };
            } else {
                // Pour les images locales ou les URLs à télécharger, conserver le base64
                // comme dans l'implémentation originale
                return {
                    ...scene,
                    imageUrl: processedScene.imageUrl
                };
            }
        });

        // Générer data.js avec les scènes traitées
        const dataJsContent = `const scenes = ${JSON.stringify(exportScenes, null, 2)};\n`
                           + `const currentSceneIndex = ${appState.currentSceneIndex};`;
        zip.file('js/data.js', dataJsContent);

        // Générer le ZIP final
        zip.generateAsync({type: 'blob'})
            .then(function(content) {
                // Télécharger le fichier ZIP
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'spynorama-website.zip';
                document.body.appendChild(a);
                a.click();
                
                // Nettoyer
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 0);
                
                // Fermer la modal
                closeModals();
            })
            .catch(error => {
                console.error('Erreur lors de la génération du ZIP:', error);
                alert('Une erreur est survenue lors de l\'export. Voir la console pour plus de détails.');
            });
    });
}

/**
 * Redimensionne une image pour réduire sa taille
 * @param {string} dataUrl - URL de données de l'image
 * @param {number} maxSize - Taille maximale en octets
 * @returns {Promise<string>} - URL de données de l'image redimensionnée
 */
function resizeImage(dataUrl, maxSize) {
    return new Promise((resolve) => {
        // Créer une image à partir de l'URL de données
        const img = new Image();
        img.onload = function() {
            // Créer un canvas
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            let quality = 0.9; // Qualité initiale
            
            // Réduire progressivement la taille de l'image jusqu'à ce qu'elle soit inférieure à maxSize
            let iterations = 0;
            const maxIterations = 10; // Éviter les boucles infinies
            
            function tryResize() {
                // Définir les dimensions du canvas
                canvas.width = width;
                canvas.height = height;
                
                // Dessiner l'image sur le canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Obtenir l'URL de données du canvas
                const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Calculer la taille approximative en octets
                const base64Data = resizedDataUrl.split(',')[1];
                const sizeInBytes = Math.ceil(base64Data.length * 0.75); // Approximation de la taille en octets
                
                console.log(`Taille de l'image: ${sizeInBytes} octets (max: ${maxSize} octets), dimensions: ${width}x${height}, qualité: ${quality}`);
                
                if (sizeInBytes <= maxSize || iterations >= maxIterations) {
                    // La taille est acceptable ou nous avons atteint le nombre maximum d'itérations
                    resolve(resizedDataUrl);
                } else {
                    iterations++;
                    
                    if (quality > 0.5) {
                        // Réduire d'abord la qualité
                        quality -= 0.1;
                    } else {
                        // Ensuite réduire les dimensions
                        width = Math.floor(width * 0.8);
                        height = Math.floor(height * 0.8);
                    }
                    
                    // Essayer à nouveau
                    tryResize();
                }
            }
            
            // Commencer le processus de redimensionnement
            tryResize();
        };
        
        img.src = dataUrl;
    });
}

/**
 * Génère le contenu du fichier index.html
 * @param {string} title - Titre du site
 * @param {boolean} showTitle - Afficher le titre
 * @returns {string} Contenu HTML
 */
function generateIndexHtml(title, showTitle) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/icons.css">
</head>
<body>
    <div class="container">
        ${showTitle ? `<h1 class="site-title">${title}</h1>` : ''}
        <div id="pano-container"></div>
        
        <!-- Bouton du menu -->
        <button id="menu-toggle" class="menu-toggle">
            <i class="fas fa-bars"></i>
        </button>
        
        <!-- Menu rétractable des scènes -->
        <div id="scene-menu" class="scene-menu">
            <div class="scene-menu-header">
                <h2>Scènes</h2>
                <button id="close-menu" class="close-menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="scene-list" class="scene-list">
                <!-- Les scènes seront ajoutées ici dynamiquement -->
            </div>
        </div>
    </div>
    
    <script src="js/marzipano.min.js"></script>
    <script src="js/data.js"></script>
    <script src="js/viewer.js"></script>
</body>
</html>`;
}

/**
 * Génère le contenu du fichier style.css
 * @returns {string} Contenu CSS
 */
function generateStyleCss() {
    return `/* Styles pour le site web exporté */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f5f5;
    color: #333;
}

.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
}

.site-title {
    padding: 1rem;
    background-color: #2196F3;
    color: white;
    text-align: center;
}

#pano-container {
    flex: 1;
    background-color: #000;
}

/* Menu rétractable */
.menu-toggle {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #2196F3;
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    z-index: 10;
    transition: all 0.3s ease;
}

.menu-toggle:hover {
    background-color: #1976D2;
    transform: scale(1.1);
}

.menu-toggle i {
    font-size: 24px;
}

.scene-menu {
    position: absolute;
    top: 0;
    right: -300px;
    width: 300px;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    z-index: 20;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
}

.scene-menu.active {
    right: 0;
}

.scene-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #2196F3;
    color: white;
}

.close-menu {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
}

.scene-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.scene-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    background-color: #f0f0f0;
    cursor: pointer;
    transition: all 0.2s ease;
}

.scene-item:hover {
    background-color: #e0e0e0;
}

.scene-item.active {
    background-color: #BBDEFB;
    border-left: 4px solid #2196F3;
}

.scene-item-thumbnail {
    width: 60px;
    height: 40px;
    margin-right: 0.5rem;
    background-size: cover;
    background-position: center;
    border-radius: 2px;
}

.scene-item-title {
    flex: 1;
    font-weight: 500;
}

/* Styles pour les hotspots */
.hotspot {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
}

.hotspot:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: scale(1.1);
}

.hotspot i {
    font-size: 20px;
}

.hotspot-info i {
    color: #2196F3;
}

.hotspot-link i {
    color: #FF9800;
}

.hotspot-scene i {
    color: #4CAF50;
}

.hotspot-tooltip {
    position: absolute;
    background-color: white;
    padding: 0.5rem;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    max-width: 300px;
    z-index: 2;
    transform: translate(-50%, -100%);
    margin-top: -10px;
}

.hotspot-tooltip::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 10px 10px 0;
    border-style: solid;
    border-color: white transparent transparent;
}

/* Responsive */
@media (max-width: 768px) {
    .scene-menu {
        width: 250px;
    }
}`;
}

/**
 * Génère le contenu du fichier viewer.js
 * @param {boolean} autorotate - Activer le défilement automatique (toujours false)
 * @param {number} autorotateSpeed - Vitesse de rotation (non utilisé)
 * @param {boolean} showSceneBar - Afficher la barre de scènes
 * @returns {string} Contenu JavaScript
 */
function generateViewerJs(autorotate, autorotateSpeed, showSceneBar) {
    return `// Initialisation du viewer
document.addEventListener('DOMContentLoaded', function() {
    // Récupération de l'élément conteneur
    const panoElement = document.getElementById('pano-container');
    
    // Création du viewer avec les options par défaut
    const viewerOpts = {
        controls: {
            mouseViewMode: 'drag'
        }
    };
    
    // Initialisation du viewer
    const viewer = new Marzipano.Viewer(panoElement, viewerOpts);
    
    // Tableau pour stocker les scènes Marzipano
    const marzipanoScenes = [];
    
    // Charger toutes les scènes
    scenes.forEach((sceneData, index) => {
        // Créer une source d'image pour Marzipano
        const source = new Marzipano.ImageUrlSource(function(tile) {
            return { url: sceneData.imageUrl };
        });
        
        // Créer une géométrie équirectangulaire
        const geometry = new Marzipano.EquirectGeometry([{ width: 2000 }]);
        
        // Créer un limiteur de vue
        const limiter = Marzipano.RectilinearView.limit.traditional(2000, 100*Math.PI/180);
        
        // Créer une vue rectilinéaire avec les paramètres initiaux de la scène
        const view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);
        
        // Créer la scène Marzipano
        const marzipanoScene = viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
        });
        
        // Ajouter les hotspots
        sceneData.hotspots.forEach(hotspot => {
            addHotspotToScene(marzipanoScene, hotspot, index);
        });
        
        // Stocker la scène
        marzipanoScenes.push(marzipanoScene);
    });
    
    // Afficher la première scène
    if (marzipanoScenes.length > 0) {
        marzipanoScenes[currentSceneIndex].switchTo();
    }
    
    // Configurer le menu des scènes
    setupSceneMenu(marzipanoScenes);
    
    // Autorotation désactivée
    
    // Configurer les boutons du menu
    document.getElementById('menu-toggle').addEventListener('click', toggleMenu);
    document.getElementById('close-menu').addEventListener('click', toggleMenu);
    
    /**
     * Ouvre ou ferme le menu des scènes
     */
    function toggleMenu() {
        const menu = document.getElementById('scene-menu');
        menu.classList.toggle('active');
    }
    
    /**
     * Configure le menu des scènes
     * @param {Array} marzipanoScenes - Tableau des scènes Marzipano
     */
    function setupSceneMenu(marzipanoScenes) {
        const sceneList = document.getElementById('scene-list');
        sceneList.innerHTML = '';
        
        // Créer un élément pour chaque scène
        scenes.forEach((scene, index) => {
            const sceneItem = document.createElement('div');
            sceneItem.classList.add('scene-item');
            if (index === currentSceneIndex) {
                sceneItem.classList.add('active');
            }
            
            sceneItem.innerHTML = \`
                <div class="scene-item-thumbnail" style="background-image: url('\${scene.imageUrl}')"></div>
                <div class="scene-item-title">\${scene.name}</div>
            \`;
            
            // Ajouter un gestionnaire d'événements pour la navigation
            sceneItem.addEventListener('click', () => {
                // Afficher la scène
                marzipanoScenes[index].switchTo();
                
                // Mettre à jour la classe active
                document.querySelectorAll('.scene-item').forEach((item, i) => {
                    if (i === index) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
                
                // Fermer le menu sur mobile
                if (window.innerWidth <= 768) {
                    toggleMenu();
                }
            });
            
            sceneList.appendChild(sceneItem);
        });
    }
    
    /**
     * Ajoute un hotspot à la scène Marzipano
     * @param {Marzipano.Scene} marzipanoScene - Scène Marzipano
     * @param {Object} hotspot - Données du hotspot
     * @param {number} sceneIndex - Index de la scène courante
     */
    function addHotspotToScene(marzipanoScene, hotspot, sceneIndex) {
        // Créer l'élément DOM pour le hotspot
        const element = document.createElement('div');
        element.classList.add('hotspot');
        
        // Ajouter une classe spécifique au type de hotspot
        element.classList.add(\`hotspot-\${hotspot.type}\`);
        
        // Ajouter une icône en fonction du type
        let icon = '';
        switch (hotspot.type) {
            case 'info':
                icon = '<i class="fas fa-info-circle"></i>';
                break;
            case 'link':
                icon = '<i class="fas fa-link"></i>';
                break;
            case 'scene':
                icon = '<i class="fas fa-exchange-alt"></i>';
                break;
            case 'photo':
                icon = '<i class="fas fa-image"></i>';
                break;
            case 'video':
                icon = '<i class="fas fa-video"></i>';
                break;
            case 'audio':
                icon = '<i class="fas fa-music"></i>';
                break;
        }
        element.innerHTML = icon;
        
        // Ajouter le hotspot à la scène
        marzipanoScene.hotspotContainer().createHotspot(element, { yaw: hotspot.position.yaw, pitch: hotspot.position.pitch });
        
        // Ajouter un gestionnaire d'événements pour l'affichage du tooltip
        if (hotspot.type === 'info') {
            element.addEventListener('mouseenter', () => {
                showInfoTooltip(element, hotspot);
            });
            
            element.addEventListener('mouseleave', () => {
                hideInfoTooltip();
            });
        }
        
        // Ajouter un gestionnaire d'événements pour la navigation entre scènes
        if (hotspot.type === 'scene') {
            element.addEventListener('click', () => {
                // Trouver l'index de la scène cible
                const targetSceneIndex = scenes.findIndex(scene => scene.id === hotspot.target);
                if (targetSceneIndex >= 0) {
                    // Afficher la scène cible
                    marzipanoScenes[targetSceneIndex].switchTo();
                    
                    // Mettre à jour la barre de scènes
                    if (${showSceneBar}) {
                        updateSceneBar(targetSceneIndex);
                    }
                }
            });
        }
        
        // Ajouter un gestionnaire d'événements pour les liens externes
        if (hotspot.type === 'link') {
            element.addEventListener('click', () => {
                window.open(hotspot.url, hotspot.target || '_blank');
            });
        }
        
        // Ajouter un gestionnaire d'événements pour les photos
        if (hotspot.type === 'photo') {
            element.addEventListener('click', () => {
                showPhotoModal(hotspot);
            });
        }
        
        // Ajouter un gestionnaire d'événements pour les vidéos
        if (hotspot.type === 'video') {
            element.addEventListener('click', () => {
                showVideoModal(hotspot);
            });
        }
        
        // Ajouter un gestionnaire d'événements pour les audios
        if (hotspot.type === 'audio') {
            element.addEventListener('click', () => {
                showAudioModal(hotspot);
            });
            
            // Lecture automatique si configurée
            if (hotspot.autoplay) {
                setTimeout(() => {
                    showAudioModal(hotspot);
                }, 1000);
            }
        }
    }
    
    /**
     * Affiche une modal avec une image
     * @param {Object} hotspot - Données du hotspot photo
     */
    function showPhotoModal(hotspot) {
        // Créer une modal pour afficher l'image
        const photoModal = document.createElement('div');
        photoModal.style.position = 'fixed';
        photoModal.style.top = '0';
        photoModal.style.left = '0';
        photoModal.style.width = '100%';
        photoModal.style.height = '100%';
        photoModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        photoModal.style.display = 'flex';
        photoModal.style.alignItems = 'center';
        photoModal.style.justifyContent = 'center';
        photoModal.style.zIndex = '1000';
        
        // Créer le contenu de la modal
        photoModal.innerHTML = \`
            <div style="position: relative; max-width: 90%; max-height: 90%; background-color: white; border-radius: 5px; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #2196F3; color: white;">
                    <h2 style="margin: 0;">\${hotspot.title}</h2>
                    <button style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 0; text-align: center;">
                    <img src="\${hotspot.photoUrl}" alt="\${hotspot.title}" style="max-width: 100%; max-height: 70vh;">
                    \${hotspot.photoDescription ? \`<p style="padding: 15px;">\${hotspot.photoDescription}</p>\` : ''}
                </div>
            </div>
        \`;
        
        // Ajouter la modal au document
        document.body.appendChild(photoModal);
        
        // Ajouter un gestionnaire d'événements pour fermer la modal
        const closeButton = photoModal.querySelector('button');
        closeButton.addEventListener('click', () => {
            photoModal.remove();
        });
        
        // Fermer la modal en cliquant en dehors
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                photoModal.remove();
            }
        });
    }
    
    /**
     * Affiche une modal avec une vidéo
     * @param {Object} hotspot - Données du hotspot vidéo
     */
    function showVideoModal(hotspot) {
        // Créer une modal pour afficher la vidéo
        const videoModal = document.createElement('div');
        videoModal.style.position = 'fixed';
        videoModal.style.top = '0';
        videoModal.style.left = '0';
        videoModal.style.width = '100%';
        videoModal.style.height = '100%';
        videoModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        videoModal.style.display = 'flex';
        videoModal.style.alignItems = 'center';
        videoModal.style.justifyContent = 'center';
        videoModal.style.zIndex = '1000';
        
        // Préparer l'iframe en fonction du type de vidéo
        let videoEmbed = '';
        
        switch (hotspot.videoType) {
            case 'youtube':
                // Extraire l'ID de la vidéo YouTube
                const youtubeId = extractYoutubeId(hotspot.videoUrl);
                if (youtubeId) {
                    videoEmbed = \`<iframe width="100%" height="400" src="https://www.youtube.com/embed/\${youtubeId}" frameborder="0" allowfullscreen></iframe>\`;
                } else {
                    videoEmbed = \`<p>URL YouTube invalide</p>\`;
                }
                break;
            case 'vimeo':
                // Extraire l'ID de la vidéo Vimeo
                const vimeoId = extractVimeoId(hotspot.videoUrl);
                if (vimeoId) {
                    videoEmbed = \`<iframe width="100%" height="400" src="https://player.vimeo.com/video/\${vimeoId}" frameborder="0" allowfullscreen></iframe>\`;
                } else {
                    videoEmbed = \`<p>URL Vimeo invalide</p>\`;
                }
                break;
                case 'podeduc':
                    // Utiliser directement le code iframe fourni si disponible
                    if (hotspot.podeducIframe) {
                        // Modifier l'iframe pour s'adapter à la modal
                        let iframe = hotspot.podeducIframe;
                        // Remplacer width et height par des valeurs adaptées à la modal
                        iframe = iframe.replace(/width="[^"]*"/, 'width="100%"');
                        iframe = iframe.replace(/height="[^"]*"/, 'height="400"');
                        videoEmbed = iframe;
                    } else {
                        // Fallback au comportement précédent si podeducIframe n'est pas défini
                        const podeducId = extractPodeducId(hotspot.videoUrl);
                        if (podeducId) {
                            videoEmbed = \`<iframe src="https://podeduc.apps.education.fr/video/\${podeducId}/?is_iframe=true" width="100%" height="400" style="padding: 0; margin: 0; border:0" allowfullscreen></iframe>\`;
                        } else {
                            videoEmbed = \`<p>URL Podeduc invalide</p>\`;
                        }
                    }
                    break;
            case 'direct':
                videoEmbed = \`<video width="100%" height="400" controls>
                    <source src="\${hotspot.videoUrl}" type="video/mp4">
                    Votre navigateur ne supporte pas la lecture de vidéos.
                </video>\`;
                break;
        }
        
        // Créer le contenu de la modal
        videoModal.innerHTML = \`
            <div style="position: relative; max-width: 800px; width: 90%; background-color: white; border-radius: 5px; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #2196F3; color: white;">
                    <h2 style="margin: 0;">\${hotspot.title}</h2>
                    <button style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 0;">
                    \${videoEmbed}
                    \${hotspot.videoDescription ? \`<p style="padding: 15px;">\${hotspot.videoDescription}</p>\` : ''}
                </div>
            </div>
        \`;
        
        // Ajouter la modal au document
        document.body.appendChild(videoModal);
        
        // Ajouter un gestionnaire d'événements pour fermer la modal
        const closeButton = videoModal.querySelector('button');
        closeButton.addEventListener('click', () => {
            videoModal.remove();
        });
        
        // Fermer la modal en cliquant en dehors
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                videoModal.remove();
            }
        });
    }
    
    /**
     * Extrait l'ID d'une vidéo YouTube à partir de son URL
     * @param {string} url - URL de la vidéo YouTube
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    function extractYoutubeId(url) {
        const regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|\\&v=)([^#\\&\\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    /**
     * Extrait l'ID d'une vidéo Vimeo à partir de son URL
     * @param {string} url - URL de la vidéo Vimeo
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    function extractVimeoId(url) {
        const regExp = /vimeo\\.com\\/(?:channels\\/(?:\\w+\\/)?|groups\\/([^\\/]*)\\/videos\\/|album\\/(\\d+)\\/video\\/|)(\\d+)(?:$|\\/|\\?)/;
        const match = url.match(regExp);
        return match ? match[3] : null;
    }
    
    /**
     * Extrait l'ID d'une vidéo Podeduc à partir de son URL
     * @param {string} url - URL de la vidéo Podeduc
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    function extractPodeducId(url) {
        // Format: https://podeduc.apps.education.fr/video/86450-presentation-du-village-decouche-par-des-collegiens-de-4e/
        const regExp = /podeduc\\.apps\\.education\\.fr\\/video\\/(\\d+)(?:-[^\\/]*)?(?:\\/|\\?|$)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }
    
    /**
     * Affiche une modal avec un lecteur audio
     * @param {Object} hotspot - Données du hotspot audio
     */
    function showAudioModal(hotspot) {
        // Créer une modal pour afficher le lecteur audio
        const audioModal = document.createElement('div');
        audioModal.style.position = 'fixed';
        audioModal.style.top = '0';
        audioModal.style.left = '0';
        audioModal.style.width = '100%';
        audioModal.style.height = '100%';
        audioModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        audioModal.style.display = 'flex';
        audioModal.style.alignItems = 'center';
        audioModal.style.justifyContent = 'center';
        audioModal.style.zIndex = '1000';
        
        // Déterminer la source audio
        let audioSrc = '';
        if (hotspot.audioDataUrl) {
            // Utiliser les données audio chargées
            audioSrc = hotspot.audioDataUrl;
        } else if (hotspot.audioUrl) {
            // Utiliser l'URL audio
            audioSrc = hotspot.audioUrl;
        }
        
        // Créer l'élément audio
        const audio = new Audio(audioSrc);
        audio.controls = true;
        audio.autoplay = hotspot.autoplay || false;
        audio.loop = hotspot.loop || false;
        
        // Créer le contenu de la modal
        audioModal.innerHTML = \`
            <div style="position: relative; max-width: 500px; width: 90%; background-color: white; border-radius: 5px; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #2196F3; color: white;">
                    <h2 style="margin: 0;">\${hotspot.title}</h2>
                    <button style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 15px;">
                    <div style="margin-bottom: 15px;">
                        <audio controls src="\${audioSrc}" \${hotspot.autoplay ? 'autoplay' : ''} \${hotspot.loop ? 'loop' : ''} style="width: 100%;"></audio>
                    </div>
                    \${hotspot.audioDescription ? \`<p>\${hotspot.audioDescription}</p>\` : ''}
                </div>
            </div>
        \`;
        
        // Ajouter la modal au document
        document.body.appendChild(audioModal);
        
        // Ajouter un gestionnaire d'événements pour fermer la modal
        const closeButton = audioModal.querySelector('button');
        closeButton.addEventListener('click', () => {
            audio.pause();
            audioModal.remove();
        });
        
        // Fermer la modal en cliquant en dehors
        audioModal.addEventListener('click', (e) => {
            if (e.target === audioModal) {
                audio.pause();
                audioModal.remove();
            }
        });
        
        // Démarrer la lecture si autoplay est activé
        if (hotspot.autoplay) {
            audio.play().catch(error => {
                console.error('Erreur lors de la lecture audio automatique:', error);
                // Ne pas afficher d'alerte pour l'autoplay, car cela peut être bloqué par le navigateur
            });
        }
    }
    
    /**
     * Affiche un tooltip d'information pour un hotspot
     * @param {HTMLElement} element - Élément du hotspot
     * @param {Object} hotspot - Données du hotspot
     */
    function showInfoTooltip(element, hotspot) {
        // Supprimer tout tooltip existant
        hideInfoTooltip();
        
        // Créer le tooltip
        const tooltip = document.createElement('div');
        tooltip.classList.add('hotspot-tooltip');
        tooltip.id = 'hotspot-tooltip';
        
        // Ajouter le contenu
        let content = '';
        if (hotspot.title) {
            content += \`<h3>\${hotspot.title}</h3>\`;
        }
        if (hotspot.content) {
            content += \`<p>\${hotspot.content}</p>\`;
        }
        tooltip.innerHTML = content;
        
        // Ajouter le tooltip au hotspot
        element.appendChild(tooltip);
    }
    
    /**
     * Cache le tooltip d'information
     */
    function hideInfoTooltip() {
        const tooltip = document.getElementById('hotspot-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    /**
     * Configure la barre de scènes
     * @param {Array} marzipanoScenes - Tableau des scènes Marzipano
     */
    function setupSceneBar(marzipanoScenes) {
        const sceneBar = document.getElementById('scene-bar');
        
        // Créer un élément pour chaque scène
        scenes.forEach((scene, index) => {
            const sceneThumb = document.createElement('div');
            sceneThumb.classList.add('scene-thumb');
            sceneThumb.style.backgroundImage = \`url(\${scene.imageUrl})\`;
            sceneThumb.title = scene.name;
            
            // Ajouter la classe active à la scène courante
            if (index === currentSceneIndex) {
                sceneThumb.classList.add('active');
            }
            
            // Ajouter un gestionnaire d'événements pour la navigation
            sceneThumb.addEventListener('click', () => {
                marzipanoScenes[index].switchTo();
                updateSceneBar(index);
            });
            
            sceneBar.appendChild(sceneThumb);
        });
    }
    
    /**
     * Met à jour la barre de scènes
     * @param {number} activeIndex - Index de la scène active
     */
    function updateSceneBar(activeIndex) {
        const sceneBar = document.getElementById('scene-bar');
        const sceneThumbElements = sceneBar.querySelectorAll('.scene-thumb');
        
        // Mettre à jour la classe active
        sceneThumbElements.forEach((thumb, index) => {
            if (index === activeIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }
});`;
}

/**
 * Génère le contenu du fichier data.js
 * @returns {string} Contenu JavaScript
 */
function generateDataJs() {
    // Créer une copie des scènes en gardant les URLs base64
    const exportScenes = appState.scenes.map(scene => ({ ...scene }));
    
    // Créer le contenu du fichier data.js
    return `// Données des scènes
const scenes = ${JSON.stringify(exportScenes, null, 2)};

// Index de la scène courante
const currentSceneIndex = ${appState.currentSceneIndex};`;
}

/**
 * Récupère le contenu du fichier marzipano.min.js
 * @returns {string} Contenu JavaScript
 */
function getMarzipanoJs() {
    // Utiliser le fichier local marzipano.min.js
    try {
        // Créer une requête AJAX synchrone pour récupérer le contenu du fichier
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'js/marzipano.min.js', false); // synchrone
        xhr.send();
        
        if (xhr.status === 200) {
            return xhr.responseText;
        } else {
            console.error('Erreur lors du chargement de marzipano.min.js:', xhr.status);
            return '';
        }
    } catch (error) {
        console.error('Erreur lors du chargement de marzipano.min.js:', error);
        return '';
    }
}

/**
 * Récupère le contenu du fichier all.min.css
 * @returns {string} Contenu CSS
 */
function getAllMinCss() {
    // Utiliser le fichier local all.min.css
    try {
        // Créer une requête AJAX synchrone pour récupérer le contenu du fichier
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'js/all.min.css', false); // synchrone
        xhr.send();
        
        if (xhr.status === 200) {
            return xhr.responseText;
        } else {
            console.error('Erreur lors du chargement de all.min.css:', xhr.status);
            return '';
        }
    } catch (error) {
        console.error('Erreur lors du chargement de all.min.css:', error);
        return '';
    }
}

/**
 * Récupère le contenu du fichier icons.css
 * @returns {string} Contenu CSS
 */
function getIconsCss() {
    // Utiliser le fichier local icons.css
    try {
        // Créer une requête AJAX synchrone pour récupérer le contenu du fichier
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'js/icons.css', false); // synchrone
        xhr.send();
        
        if (xhr.status === 200) {
            return xhr.responseText;
        } else {
            console.error('Erreur lors du chargement de icons.css:', xhr.status);
            return '';
        }
    } catch (error) {
        console.error('Erreur lors du chargement de icons.css:', error);
        return '';
    }
}

/**
 * Configure les contrôles de musique de fond
 */
function setupBackgroundMusicControls() {
    if (!backgroundAudioManager) return;
    
    // Récupérer les éléments du DOM
    const playButton = document.getElementById('background-music-play-btn');
    const addButton = document.getElementById('background-music-add-btn');
    const titleElement = document.getElementById('background-music-title');
    const statusElement = document.getElementById('background-music-status');
    const fileInput = document.getElementById('background-music-input');
    
    // Ajouter les gestionnaires d'événements
    playButton.addEventListener('click', () => {
        if (backgroundAudioManager.hasAudio()) {
            const isPlaying = backgroundAudioManager.togglePlay();
            playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            statusElement.textContent = isPlaying ? 'En lecture' : 'En pause';
        } else {
            alert('Veuillez d\'abord ajouter une musique de fond.');
        }
    });
    
    addButton.addEventListener('click', () => {
        console.log('Bouton Ajouter musique de fond cliqué');
        // Ouvrir la modal de configuration de la musique de fond
        const modal = document.getElementById('background-music-modal');
        modal.classList.add('active');
        
        // Si une musique est déjà configurée, remplir les champs
        if (backgroundAudioManager.hasAudio()) {
            document.getElementById('background-music-url').value = backgroundAudioManager.getAudioUrl() || '';
            document.getElementById('background-music-volume').value = backgroundAudioManager.volume;
            document.getElementById('background-music-volume-value').textContent = `${Math.round(backgroundAudioManager.volume * 100)}%`;
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Vérifier que c'est bien un fichier audio
        if (!file.type.startsWith('audio/')) {
            alert('Veuillez sélectionner un fichier audio valide.');
            return;
        }
        
        // Lire le fichier et le convertir en Data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            // Initialiser la musique de fond
            backgroundAudioManager.initAudio(event.target.result, {
                loop: true,
                volume: 0.5
            });
            
            // Mettre à jour l'interface
            titleElement.textContent = file.name;
            statusElement.textContent = 'Prêt à jouer';
            playButton.innerHTML = '<i class="fas fa-play"></i>';
        };
        
        reader.readAsDataURL(file);
    });
    
    // Configurer la modal de musique de fond
    document.getElementById('background-music-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Vérifier que c'est bien un fichier audio
        if (!file.type.startsWith('audio/')) {
            alert('Veuillez sélectionner un fichier audio valide.');
            return;
        }
        
        // Afficher le nom du fichier
        const fileNameDisplay = document.createElement('div');
        fileNameDisplay.className = 'file-name-display';
        fileNameDisplay.textContent = `Fichier sélectionné: ${file.name}`;
        
        // Remplacer l'affichage précédent s'il existe
        const previousDisplay = document.querySelector('.file-name-display');
        if (previousDisplay) {
            previousDisplay.remove();
        }
        
        // Ajouter le nouvel affichage après l'input
        const audioFileInput = document.getElementById('background-music-file');
        audioFileInput.parentNode.appendChild(fileNameDisplay);
        
        // Créer un aperçu audio
        const reader = new FileReader();
        reader.onload = (event) => {
            // Créer un élément audio pour l'aperçu
            const audio = new Audio(event.target.result);
            audio.volume = parseFloat(document.getElementById('background-music-volume').value);
            
            // Importer les utilitaires audio
            import('./js/utils/audio.js').then(({ AudioUtils }) => {
                // Ajouter le contrôle audio personnalisé
                const previewContainer = document.getElementById('background-music-preview');
                previewContainer.innerHTML = '';
                const audioControl = AudioUtils.createAudioControl(audio);
                previewContainer.appendChild(audioControl);
            }).catch(error => {
                console.error('Erreur lors du chargement des utilitaires audio:', error);
                
                // Fallback simple si le module audio n'est pas chargé
                const previewContainer = document.getElementById('background-music-preview');
                previewContainer.innerHTML = '';
                audio.controls = true;
                previewContainer.appendChild(audio);
            });
        };
        
        reader.readAsDataURL(file);
    });
    
    // Gérer le changement de volume
    document.getElementById('background-music-volume').addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        document.getElementById('background-music-volume-value').textContent = `${Math.round(volume * 100)}%`;
        
        // Mettre à jour le volume de l'aperçu audio
        const audioPreview = document.querySelector('#background-music-preview audio');
        if (audioPreview) {
            audioPreview.volume = volume;
        }
    });
    
    // Gérer l'enregistrement de la musique de fond
    document.getElementById('save-background-music-btn').addEventListener('click', () => {
        console.log('Bouton Enregistrer musique de fond cliqué');
        
        const url = document.getElementById('background-music-url').value;
        const file = document.getElementById('background-music-file').files[0];
        const volume = parseFloat(document.getElementById('background-music-volume').value);
        const autoplay = document.getElementById('background-music-autoplay').checked;
        const loop = document.getElementById('background-music-loop').checked;
        
        console.log('Paramètres musique de fond:', {
            url: url,
            file: file ? file.name : 'aucun',
            volume: volume,
            autoplay: autoplay,
            loop: loop
        });
        
        if (!url && !file) {
            alert('Veuillez spécifier une URL ou sélectionner un fichier audio.');
            return;
        }
        
        if (file) {
            console.log('Traitement du fichier audio:', file.name);
            
            // Lire le fichier et le convertir en Data URL
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log('Fichier audio chargé avec succès');
                
                // Initialiser la musique de fond
                backgroundAudioManager.initAudio(event.target.result, {
                    loop: loop,
                    volume: volume
                });
                
                // Mettre à jour l'interface
                titleElement.textContent = file.name;
                statusElement.textContent = autoplay ? 'En lecture' : 'Prêt à jouer';
                playButton.innerHTML = autoplay ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
                
                // Démarrer la lecture si autoplay est activé
                if (autoplay) {
                    console.log('Démarrage automatique de la lecture');
                    backgroundAudioManager.play();
                }
                
                // Fermer la modal
                document.getElementById('background-music-modal').classList.remove('active');
            };
            
            reader.onerror = (error) => {
                console.error('Erreur lors de la lecture du fichier audio:', error);
                alert('Erreur lors de la lecture du fichier audio: ' + error);
            };
            
            reader.readAsDataURL(file);
        } else if (url) {
            console.log('Utilisation de l\'URL audio:', url);
            
            // Initialiser la musique de fond avec l'URL
            backgroundAudioManager.initAudio(url, {
                loop: loop,
                volume: volume
            });
            
            // Mettre à jour l'interface
            titleElement.textContent = url.split('/').pop() || 'Musique de fond';
            statusElement.textContent = autoplay ? 'En lecture' : 'Prêt à jouer';
            playButton.innerHTML = autoplay ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            
            // Démarrer la lecture si autoplay est activé
            if (autoplay) {
                console.log('Démarrage automatique de la lecture');
                backgroundAudioManager.play();
            }
            
            // Fermer la modal
            document.getElementById('background-music-modal').classList.remove('active');
        }
    });
    
    // Gérer l'annulation
    document.getElementById('cancel-background-music-btn').addEventListener('click', () => {
        document.getElementById('background-music-modal').classList.remove('active');
    });
}
