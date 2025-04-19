/**
 * Spynorama
 * Application permettant de créer et visualiser des scènes panoramiques 360° avec hotspots interactifs
 */

// Importation des modules
import MarzipanoViewer from './core/viewer.js';
import StorageManager from './core/storage.js';
import ExportManager from './core/export.js';
import HotspotsUI from './ui/hotspots.js';
import ScenesUI from './ui/scenes.js';
import ModalsUI from './ui/modals.js';
import ImageUtils from './utils/image.js';
import VideoUtils from './utils/video.js';
import I18nUtils, { t } from './utils/i18n.js';
import translations from './translations/index.js';

// État de l'application
const appState = {
    scenes: [],            // Liste des scènes
    currentSceneIndex: -1, // Index de la scène active
    viewer: null,          // Instance du viewer Marzipano
    marzipanoViewer: null, // Instance de notre classe MarzipanoViewer
    storageManager: null,  // Instance de notre classe StorageManager
    exportManager: null,   // Instance de notre classe ExportManager
    hotspotsUI: null,      // Instance de notre classe HotspotsUI
    scenesUI: null,        // Instance de notre classe ScenesUI
    modalsUI: null,        // Instance de notre classe ModalsUI
    dragCounter: 0         // Compteur pour le drag & drop
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeModules();
    setupEventListeners();
    
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
 * Initialise les modules de l'application
 */
function initializeModules() {
    // Initialiser l'internationalisation
    window.i18n = I18nUtils.init({
        defaultLocale: 'fr',
        translations: translations,
        autoTranslate: true
    });
    
    // Initialiser le viewer Marzipano
    appState.marzipanoViewer = new MarzipanoViewer();
    appState.viewer = appState.marzipanoViewer.initialize(document.getElementById('pano-container'));
    
    // Initialiser le gestionnaire de stockage
    appState.storageManager = new StorageManager();
    
    // Initialiser le gestionnaire d'export
    appState.exportManager = new ExportManager();
    
    // Initialiser l'interface utilisateur des hotspots
    appState.hotspotsUI = new HotspotsUI(
        appState,
        hotspot => onHotspotEdit(hotspot),
        hotspotId => onHotspotDelete(hotspotId),
        hotspot => onHotspotCreate(hotspot)
    );
    
    // Initialiser l'interface utilisateur des scènes
    appState.scenesUI = new ScenesUI(
        appState,
        index => onSceneSelect(index),
        index => onSceneDelete(index),
        (index, title) => onSceneTitleChange(index, title),
        (index, viewParams) => onInitialViewSet(index, viewParams)
    );
    
    // Initialiser l'interface utilisateur des modales
    appState.modalsUI = new ModalsUI(
        appState,
        () => exportProject(),
        options => exportWebsite(options),
        options => publishToForge(options)
    );
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Gestion du projet
    document.getElementById('new-project-btn').addEventListener('click', createNewProject);
    document.getElementById('open-project-btn').addEventListener('click', () => {
        document.getElementById('load-project-input').click();
    });
    document.getElementById('save-project-btn').addEventListener('click', exportProject);
    document.getElementById('load-project-input').addEventListener('change', e => importProject(e));
    
    // Barre d'outils
    document.getElementById('toggle-sidebar-btn').addEventListener('click', toggleSidebar);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Sélecteur de langue
    const languageBtn = document.getElementById('language-btn');
    const languageDropdown = document.querySelector('.language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // Marquer la langue active
    const setActiveLanguage = (locale) => {
        languageOptions.forEach(option => {
            if (option.dataset.lang === locale) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    };
    
    // Initialiser la langue active
    setActiveLanguage(window.i18n.getLocale());
    
    // Afficher/masquer le menu déroulant
    languageBtn.addEventListener('click', () => {
        languageDropdown.classList.toggle('show');
    });
    
    // Gérer le clic sur une option de langue
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const locale = option.dataset.lang;
            window.i18n.setLocale(locale);
            setActiveLanguage(locale);
            languageDropdown.classList.remove('show');
        });
    });
    
    // Fermer le menu déroulant si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!languageBtn.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('show');
        }
    });
    
    // Drag & drop
    setupDragAndDrop();
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
                appState.scenesUI.createScene(file.name, e.target.result);
            };
            
            reader.readAsDataURL(file);
        }
    });
}

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
    appState.scenesUI.createScene(sceneName, imageUrl, true);
    
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
 * Met à jour les informations de vue dans la barre d'outils
 */
function updateViewInfo() {
    if (!appState.viewer) return;
    
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
    sidebar.classList.toggle('active');
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
    appState.scenesUI.updateScenesList();
    appState.scenesUI.updateSceneSettings();
    
    if (appState.currentSceneIndex >= 0) {
        appState.hotspotsUI.updateHotspotsList(appState.scenes[appState.currentSceneIndex].hotspots);
    } else {
        appState.hotspotsUI.updateHotspotsList([]);
    }
}

/**
 * Charge le projet depuis le localStorage
 */
function loadFromLocalStorage() {
    const project = appState.storageManager.loadFromLocalStorage();
    if (project) {
        appState.scenes = project.scenes;
        appState.currentSceneIndex = project.currentSceneIndex;
        
        // Si l'index de scène est invalide, le réinitialiser
        if (appState.currentSceneIndex < 0 || appState.currentSceneIndex >= appState.scenes.length) {
            appState.currentSceneIndex = appState.scenes.length > 0 ? 0 : -1;
        }
        
        // Charger la scène courante
        if (appState.currentSceneIndex >= 0) {
            loadCurrentScene();
        }
    }
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
    
    try {
        // Charger la scène dans le viewer
        appState.marzipanoViewer.loadScene(
            scene,
            scene.hotspots,
            (hotspot, element) => {
                // Gérer le clic sur un hotspot
                switch (hotspot.type) {
                    case 'info':
                        // Rien à faire, le tooltip est géré par le viewer
                        break;
                    case 'link':
                        window.open(hotspot.url, hotspot.target || '_blank');
                        break;
                    case 'scene':
                        navigateToScene(hotspot.target);
                        break;
                    case 'photo':
                        appState.modalsUI.showPhotoModal(hotspot);
                        break;
                    case 'video':
                        appState.modalsUI.showVideoModal(hotspot);
                        break;
                    default:
                        // Ouvrir la modal d'édition
                        appState.hotspotsUI.editHotspot(hotspot.id);
                        break;
                }
            }
        );
        
        // Mettre à jour les informations de vue
        updateViewInfo();
        
        // Configurer l'événement de mise à jour des informations de vue
        appState.viewer.addEventListener('viewChange', updateViewInfo);
        
    } catch (error) {
        console.error('Erreur lors du chargement de la scène:', error);
        alert(`Erreur lors du chargement de la scène ${scene.name}: ${error.message}`);
    }
}

/**
 * Navigue vers une scène spécifique
 * @param {string} sceneId - ID de la scène cible
 */
function navigateToScene(sceneId) {
    const targetIndex = appState.scenes.findIndex(scene => scene.id === sceneId);
    if (targetIndex >= 0) {
        onSceneSelect(targetIndex);
    }
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
    appState.marzipanoViewer.destroy();
    
    // Mettre à jour l'interface
    updateUI();
    
    // Afficher le message d'accueil
    document.getElementById('welcome-message').classList.remove('hidden');
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
    
    console.log('Nouveau projet créé.');
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
    
    // Exporter le projet
    const url = appState.storageManager.exportProject(project);
    
    // Télécharger le fichier
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
    
    appState.storageManager.importProject(file)
        .then(project => {
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
        })
        .catch(error => {
            alert('Erreur lors de l\'importation du projet : ' + error.message);
        });
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier plusieurs fois
    e.target.value = '';
}

/**
 * Exporte le projet en site web
 * @param {Object} options - Options d'export
 */
function exportWebsite(options) {
    // Créer l'objet projet
    const project = {
        version: '1.0',
        scenes: appState.scenes,
        currentSceneIndex: appState.currentSceneIndex
    };
    
    // Exporter le site web
    appState.exportManager.exportWebsite(project, options)
        .then(blob => {
            // Télécharger le fichier ZIP
            const url = URL.createObjectURL(blob);
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
        })
        .catch(error => {
            console.error('Erreur lors de l\'export du site web:', error);
            alert('Une erreur est survenue lors de l\'export. Voir la console pour plus de détails.');
        });
}

/**
 * Publie le projet sur la forge
 * @param {Object} options - Options de publication
 * @returns {Promise<Object>} - Promesse résolue avec les informations de publication
 */
async function publishToForge(options) {
    try {
        // Créer l'objet projet
        const project = {
            version: '1.0',
            scenes: appState.scenes,
            currentSceneIndex: appState.currentSceneIndex
        };
        
        // Exporter le site web en blob
        const blob = await appState.exportManager.exportWebsite(project, {
            title: "Spynorama: " + options.name,
            showTitle: true,
            showSceneBar: true,
            imageQuality: 'optimized',
            urlImagesOption: 'keep',
            autorotate: false,
            autorotateSpeed: 0
        });
        
        // Créer un objet FormData pour l'envoi
        const formData = new FormData();
        formData.append('file', blob, 'spynorama.zip');
        formData.append('name', options.name);
        formData.append('token', options.token);
        
        // Envoyer la requête à l'établi
        const response = await fetch(`${options.etabliUrl}/api/publish-spynorama`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erreur lors de la publication');
        }
        
        // Récupérer les informations de publication
        const publishData = await response.json();
        return publishData;
    } catch (error) {
        console.error('Erreur lors de la publication sur la forge:', error);
        throw error;
    }
}

/**
 * Planifie une sauvegarde automatique
 */
function scheduleAutoSave() {
    // Créer l'objet projet
    const project = {
        version: '1.0',
        scenes: appState.scenes,
        currentSceneIndex: appState.currentSceneIndex
    };
    
    // Planifier la sauvegarde
    appState.storageManager.scheduleAutoSave(project);
}

// Callbacks pour les événements de l'interface utilisateur

/**
 * Appelé lors de la sélection d'une scène
 * @param {number} index - Index de la scène sélectionnée
 */
function onSceneSelect(index) {
    console.log(`Scene selected: ${index}`);
    appState.currentSceneIndex = index;
    loadCurrentScene();
    updateUI();
    scheduleAutoSave();
}

/**
 * Appelé lors de la suppression d'une scène
 * @param {number} index - Index de la scène à supprimer
 */
function onSceneDelete(index) {
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
 * Appelé lors du changement de titre d'une scène
 * @param {number} index - Index de la scène
 * @param {string} title - Nouveau titre
 */
function onSceneTitleChange(index, title) {
    // Mettre à jour l'interface
    updateUI();
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Appelé lors de la définition de la vue initiale
 * @param {number} index - Index de la scène
 * @param {Object} viewParams - Paramètres de vue
 */
function onInitialViewSet(index, viewParams) {
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Appelé lors de l'édition d'un hotspot
 * @param {Object} hotspot - Hotspot édité
 */
function onHotspotEdit(hotspot) {
    // Recharger la scène pour mettre à jour le hotspot
    loadCurrentScene();
    
    // Mettre à jour l'interface
    updateUI();
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}

/**
 * Appelé lors de la suppression d'un hotspot
 * @param {string} hotspotId - ID du hotspot à supprimer
 */
function onHotspotDelete(hotspotId) {
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    // Trouver l'index du hotspot dans la scène courante
    const hotspotIndex = appState.scenes[appState.currentSceneIndex].hotspots.findIndex(h => h.id === hotspotId);
    if (hotspotIndex >= 0) {
        // Supprimer le hotspot
        appState.scenes[appState.currentSceneIndex].hotspots.splice(hotspotIndex, 1);
        
        // Recharger la scène
        loadCurrentScene();
        
        // Mettre à jour l'interface
        updateUI();
        
        // Sauvegarder automatiquement
        scheduleAutoSave();
    }
}

/**
 * Appelé lors de la création d'un hotspot
 * @param {Object} hotspot - Nouveau hotspot
 */
function onHotspotCreate(hotspot) {
    // Vérifier qu'une scène est active
    if (appState.currentSceneIndex < 0) {
        return;
    }
    
    // Ajouter le hotspot à la scène courante
    appState.scenes[appState.currentSceneIndex].hotspots.push(hotspot);
    
    // Recharger la scène pour afficher le nouveau hotspot
    loadCurrentScene();
    
    // Mettre à jour l'interface
    updateUI();
    
    // Sauvegarder automatiquement
    scheduleAutoSave();
}
