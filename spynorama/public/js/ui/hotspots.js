/**
 * Spynorama - UI Hotspots Module
 * Gère l'interface utilisateur pour les hotspots
 */

/**
 * Classe de gestion des hotspots dans l'interface
 */
class HotspotsUI {
    /**
     * Constructeur
     * @param {Object} appState - État de l'application
     * @param {Function} onHotspotEdit - Fonction appelée lors de l'édition d'un hotspot
     * @param {Function} onHotspotDelete - Fonction appelée lors de la suppression d'un hotspot
     * @param {Function} onHotspotCreate - Fonction appelée lors de la création d'un hotspot
     */
    constructor(appState, onHotspotEdit, onHotspotDelete, onHotspotCreate) {
        this.appState = appState;
        this.onHotspotEdit = onHotspotEdit;
        this.onHotspotDelete = onHotspotDelete;
        this.onHotspotCreate = onHotspotCreate;
        this.editMode = null;
        this.activeHotspot = null;
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Boutons d'ajout de hotspots
        document.getElementById('add-info-hotspot-btn').addEventListener('click', () => this.setEditMode('info'));
        document.getElementById('add-link-hotspot-btn').addEventListener('click', () => this.setEditMode('link'));
        document.getElementById('add-scene-hotspot-btn').addEventListener('click', () => this.setEditMode('scene'));
        document.getElementById('add-photo-hotspot-btn').addEventListener('click', () => this.setEditMode('photo'));
        document.getElementById('add-video-hotspot-btn').addEventListener('click', () => this.setEditMode('video'));
        document.getElementById('add-audio-hotspot-btn').addEventListener('click', () => this.setEditMode('audio'));
        
        // Modal des hotspots
        document.getElementById('save-hotspot-btn').addEventListener('click', () => this.saveHotspot());
        document.getElementById('delete-hotspot-btn').addEventListener('click', () => this.deleteHotspot());
        
        // Clic sur le viewer pour ajouter des hotspots
        document.getElementById('pano-container').addEventListener('click', (e) => this.handleViewerClick(e));
        
        // Champ de type de vidéo
        document.getElementById('hotspot-video-type').addEventListener('change', () => this.toggleVideoFields());
        
        // Gestion des fichiers audio pour les hotspots audio
        const audioFileInput = document.getElementById('hotspot-audio-file');
        if (audioFileInput) {
            audioFileInput.addEventListener('change', (e) => this.handleAudioFileSelect(e));
        }
    }
    
    /**
     * Gère la sélection d'un fichier audio pour un hotspot
     * @param {Event} e - Événement de changement
     */
    handleAudioFileSelect(e) {
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
            // Stocker le Data URL dans le hotspot actif
            if (this.activeHotspot && this.activeHotspot.type === 'audio') {
                this.activeHotspot.audioDataUrl = event.target.result;
                
                // Mettre à jour l'interface pour indiquer que le fichier a été chargé
                const fileNameDisplay = document.createElement('div');
                fileNameDisplay.className = 'file-name-display';
                fileNameDisplay.textContent = `Fichier chargé: ${file.name}`;
                
                // Remplacer l'affichage précédent s'il existe
                const previousDisplay = document.querySelector('.file-name-display');
                if (previousDisplay) {
                    previousDisplay.remove();
                }
                
                // Ajouter le nouvel affichage après l'input
                const audioFileInput = document.getElementById('hotspot-audio-file');
                audioFileInput.parentNode.appendChild(fileNameDisplay);
            }
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Définit le mode d'édition actuel
     * @param {string|null} mode - Mode d'édition ('info', 'link', 'scene', 'photo', 'video' ou null)
     */
    setEditMode(mode) {
        this.editMode = mode;
        
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
     * Gère le clic sur le viewer pour ajouter des hotspots
     * @param {Event} e - Événement de clic
     */
    handleViewerClick(e) {
        // Ne rien faire si on n'est pas en mode édition ou si aucune scène n'est chargée
        if (!this.editMode || this.appState.currentSceneIndex < 0) {
            return;
        }
        
        console.log("Clic détecté en mode édition:", this.editMode);
        
        // Récupérer la position du clic dans le viewer
        const panoContainer = document.getElementById('pano-container');
        const rect = panoContainer.getBoundingClientRect();
        const viewerX = e.clientX - rect.left;
        const viewerY = e.clientY - rect.top;
        
        console.log("Coordonnées du clic:", viewerX, viewerY);
        
        // Convertir les coordonnées en yaw/pitch
        const view = this.appState.viewer.view();
        
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
        this.createHotspot(this.editMode, yaw, pitch);
        
        // Désactiver le mode édition après avoir ajouté un hotspot
        this.setEditMode(null);
    }

    /**
     * Crée un nouveau hotspot
     * @param {string} type - Type de hotspot ('info', 'link', 'scene', 'photo', 'video', 'audio')
     * @param {number} yaw - Position horizontale
     * @param {number} pitch - Position verticale
     */
    createHotspot(type, yaw, pitch) {
        // Vérifier qu'une scène est active
        if (this.appState.currentSceneIndex < 0) {
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
                if (this.appState.scenes.length > 1) {
                    const targetScenes = this.appState.scenes.filter((_, index) => index !== this.appState.currentSceneIndex);
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
                hotspot.audioDataUrl = null; // Pour stocker les données du fichier audio
                hotspot.autoplay = false;
                hotspot.loop = false;
                hotspot.audioDescription = '';
                break;
        }
        
        // Appeler la fonction de création
        if (this.onHotspotCreate) {
            this.onHotspotCreate(hotspot);
        }
        
        // Ouvrir la modal d'édition pour le nouveau hotspot
        this.editHotspot(hotspotId);
    }

    /**
     * Ouvre la modal d'édition pour un hotspot
     * @param {string} hotspotId - ID du hotspot à éditer
     */
    editHotspot(hotspotId) {
        // Vérifier qu'une scène est active
        if (this.appState.currentSceneIndex < 0) {
            return;
        }
        
        // Trouver le hotspot dans la scène courante
        const hotspot = this.appState.scenes[this.appState.currentSceneIndex].hotspots.find(h => h.id === hotspotId);
        if (!hotspot) {
            return;
        }
        
        // Stocker le hotspot actif
        this.activeHotspot = hotspot;
        
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
                
                this.appState.scenes.forEach((scene, index) => {
                    // Ne pas inclure la scène courante comme cible
                    if (index !== this.appState.currentSceneIndex) {
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
                this.toggleVideoFields();
                if (hotspot.videoType === 'podeduc') {
                    document.getElementById('hotspot-podeduc-iframe').value = hotspot.podeducIframe || '';
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
     * Affiche ou masque les champs spécifiques au type de vidéo sélectionné
     */
    toggleVideoFields() {
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
     * Enregistre les modifications d'un hotspot
     */
    saveHotspot() {
        // Vérifier qu'un hotspot est actif
        if (!this.activeHotspot) {
            return;
        }
        
        // Récupérer les valeurs communes
        this.activeHotspot.title = document.getElementById('hotspot-title').value;
        
        // Récupérer les valeurs spécifiques au type
        switch (this.activeHotspot.type) {
            case 'info':
                this.activeHotspot.content = document.getElementById('hotspot-content').value;
                break;
            case 'link':
                this.activeHotspot.url = document.getElementById('hotspot-url').value;
                this.activeHotspot.target = document.getElementById('hotspot-target').value;
                break;
            case 'scene':
                this.activeHotspot.target = document.getElementById('hotspot-scene-target').value;
                break;
            case 'photo':
                this.activeHotspot.photoUrl = document.getElementById('hotspot-photo-url').value;
                this.activeHotspot.photoDescription = document.getElementById('hotspot-photo-description').value;
                break;
            case 'video':
                this.activeHotspot.videoType = document.getElementById('hotspot-video-type').value;
                this.activeHotspot.videoDescription = document.getElementById('hotspot-video-description').value;
                
                // Pour les vidéos Podeduc, sauvegarder le code iframe
                if (this.activeHotspot.videoType === 'podeduc') {
                    this.activeHotspot.podeducIframe = document.getElementById('hotspot-podeduc-iframe').value;
                } else {
                    this.activeHotspot.videoUrl = document.getElementById('hotspot-video-url').value;
                }
                break;
            case 'audio':
                this.activeHotspot.audioUrl = document.getElementById('hotspot-audio-url').value;
                this.activeHotspot.autoplay = document.getElementById('hotspot-audio-autoplay').checked;
                this.activeHotspot.loop = document.getElementById('hotspot-audio-loop').checked;
                this.activeHotspot.audioDescription = document.getElementById('hotspot-audio-description').value;
                break;
        }
        
        // Appeler la fonction d'édition
        if (this.onHotspotEdit) {
            this.onHotspotEdit(this.activeHotspot);
        }
        
        // Fermer la modal
        this.closeModal();
    }

    /**
     * Supprime le hotspot actif
     */
    deleteHotspot() {
        // Vérifier qu'un hotspot est actif
        if (!this.activeHotspot) {
            return;
        }
        
        // Appeler la fonction de suppression
        if (this.onHotspotDelete) {
            this.onHotspotDelete(this.activeHotspot.id);
        }
        
        // Fermer la modal
        this.closeModal();
    }

    /**
     * Ferme la modal d'édition
     */
    closeModal() {
        document.getElementById('hotspot-modal').classList.remove('active');
        this.activeHotspot = null;
    }

    /**
     * Met à jour la liste des hotspots dans l'interface
     * @param {Array} hotspots - Liste des hotspots à afficher
     */
    updateHotspotsList(hotspots) {
        const hotspotsList = document.getElementById('hotspots-list');
        hotspotsList.innerHTML = '';
        
        if (!hotspots || hotspots.length === 0) {
            return;
        }
        
        hotspots.forEach(hotspot => {
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
                this.editHotspot(hotspot.id);
            });
            
            hotspotsList.appendChild(listItem);
        });
    }
}

// Exporter la classe
export default HotspotsUI;
