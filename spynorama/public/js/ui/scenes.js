/**
 * Spynorama - UI Scenes Module
 * Gère l'interface utilisateur pour les scènes
 */

/**
 * Classe de gestion des scènes dans l'interface
 */
class ScenesUI {
    /**
     * Constructeur
     * @param {Object} appState - État de l'application
     * @param {Function} onSceneSelect - Fonction appelée lors de la sélection d'une scène
     * @param {Function} onSceneDelete - Fonction appelée lors de la suppression d'une scène
     * @param {Function} onSceneTitleChange - Fonction appelée lors du changement de titre d'une scène
     * @param {Function} onInitialViewSet - Fonction appelée lors de la définition de la vue initiale
     */
    constructor(appState, onSceneSelect, onSceneDelete, onSceneTitleChange, onInitialViewSet) {
        this.appState = appState;
        this.onSceneSelect = onSceneSelect;
        this.onSceneDelete = onSceneDelete;
        this.onSceneTitleChange = onSceneTitleChange;
        this.onInitialViewSet = onInitialViewSet;
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Boutons d'ajout de scène
        document.getElementById('add-scene-btn').addEventListener('click', () => {
            document.getElementById('scene-file-input').click();
        });
        
        document.getElementById('welcome-add-scene-btn').addEventListener('click', () => {
            document.getElementById('scene-file-input').click();
        });
        
        // Boutons d'ajout de scène via URL
        document.getElementById('add-scene-url-btn').addEventListener('click', () => this.showAddUrlModal());
        document.getElementById('welcome-add-scene-url-btn').addEventListener('click', () => this.showAddUrlModal());
        
        // Import d'images pour les scènes
        document.getElementById('scene-file-input').addEventListener('change', (e) => this.handleSceneFileSelect(e));
        
        // Paramètres de la scène
        document.getElementById('scene-title').addEventListener('change', () => this.updateCurrentSceneTitle());
        document.getElementById('set-initial-view-btn').addEventListener('click', () => this.setInitialView());
        
        // Modal d'ajout via URL
        document.getElementById('add-url-btn').addEventListener('click', () => this.addSceneFromUrl());
        document.getElementById('cancel-url-btn').addEventListener('click', () => this.closeModals());
    }

    /**
     * Gère la sélection de fichiers pour les scènes
     * @param {Event} e - Événement de changement
     */
    handleSceneFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }
        
        // Traiter chaque fichier
        Array.from(files).forEach(file => {
            // Vérifier si c'est une image
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    // Créer une scène avec l'image
                    this.createScene(file.name, e.target.result);
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Réinitialiser l'input pour permettre de sélectionner le même fichier plusieurs fois
        e.target.value = '';
    }

    /**
     * Crée une nouvelle scène à partir d'une image
     * @param {string} name - Nom de la scène
     * @param {string} imageUrl - URL de l'image (data URL ou URL externe)
     * @param {boolean} isExternalUrl - Indique si l'image provient d'une URL externe
     */
    createScene(name, imageUrl, isExternalUrl = false) {
        // Extraire le nom de fichier sans extension ou utiliser un nom par défaut pour les URLs
        const fileName = isExternalUrl ? name : name.split('.')[0];
        
        console.log(`Création de la scène: ${fileName}`);
        
        // Précharger l'image pour s'assurer qu'elle est valide
        const img = new Image();
        img.crossOrigin = "anonymous"; // Permettre le chargement d'images cross-origin
        
        img.onload = () => {
            console.log(`Image chargée avec succès: ${fileName} (${img.width}x${img.height})`);
            
            // Créer l'objet scène
            const scene = {
                id: 'scene_' + Date.now(),
                name: fileName,
                imageUrl: imageUrl,
                isExternalUrl: isExternalUrl,
                initialViewParameters: { 
                    yaw: 0, 
                    pitch: 0, 
                    fov: Math.PI/2 
                },
                hotspots: []
            };
            
            // Ajouter la scène à l'état de l'application
            this.appState.scenes.push(scene);
            
            // Sélectionner la nouvelle scène
            const newIndex = this.appState.scenes.length - 1;
            if (this.onSceneSelect) {
                this.onSceneSelect(newIndex);
            }
        };
        
        img.onerror = () => {
            console.error(`Erreur lors du chargement de l'image: ${fileName}`);
            alert(`Erreur lors du chargement de l'image: ${fileName}. Veuillez vérifier que le fichier est une image panoramique valide.`);
        };
        
        img.src = imageUrl;
    }

    /**
     * Affiche la modal pour ajouter une scène via URL
     */
    showAddUrlModal() {
        // Réinitialiser les champs
        document.getElementById('scene-url').value = '';
        document.getElementById('scene-url-name').value = '';
        
        // Afficher la modal
        document.getElementById('add-url-modal').classList.add('active');
    }

    /**
     * Ajoute une scène à partir d'une URL
     */
    addSceneFromUrl() {
        const url = document.getElementById('scene-url').value.trim();
        const name = document.getElementById('scene-url-name').value.trim() || 'Scène URL';
        
        if (!url) {
            alert('Veuillez entrer une URL valide.');
            return;
        }
        
        // Créer la scène avec l'URL externe
        this.createScene(name, url, true);
        
        // Fermer la modal
        this.closeModals();
    }

    /**
     * Met à jour le titre de la scène courante
     */
    updateCurrentSceneTitle() {
        // Vérifier qu'une scène est active
        if (this.appState.currentSceneIndex < 0) {
            return;
        }
        
        // Mettre à jour le titre
        const newTitle = document.getElementById('scene-title').value;
        this.appState.scenes[this.appState.currentSceneIndex].name = newTitle;
        
        // Appeler la fonction de changement de titre
        if (this.onSceneTitleChange) {
            this.onSceneTitleChange(this.appState.currentSceneIndex, newTitle);
        }
    }

    /**
     * Définit la vue actuelle comme vue initiale pour la scène courante
     */
    setInitialView() {
        // Vérifier qu'une scène est active
        if (this.appState.currentSceneIndex < 0 || !this.appState.viewer) {
            return;
        }
        
        // Récupérer la vue actuelle
        const view = this.appState.viewer.view();
        const params = view.parameters();
        
        // Mettre à jour les paramètres de vue initiale
        this.appState.scenes[this.appState.currentSceneIndex].initialViewParameters = {
            yaw: params.yaw,
            pitch: params.pitch,
            fov: params.fov
        };
        
        // Appeler la fonction de définition de vue initiale
        if (this.onInitialViewSet) {
            this.onInitialViewSet(this.appState.currentSceneIndex, {
                yaw: params.yaw,
                pitch: params.pitch,
                fov: params.fov
            });
        }
    }

    /**
     * Ferme toutes les modals
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Met à jour la liste des scènes dans l'interface
     */
    updateScenesList() {
        console.log('Updating scenes list...');
        const scenesList = document.getElementById('scenes-list');
        scenesList.innerHTML = '';
        
        this.appState.scenes.forEach((scene, index) => {
            console.log(`Adding scene: ${scene.name} (index: ${index})`);
            const listItem = document.createElement('div');
            listItem.classList.add('list-item');
            
            if (index === this.appState.currentSceneIndex) {
                listItem.classList.add('active');
            }
            
            listItem.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${scene.name}</div>
                </div>
                <div class="list-item-actions">
                    ${scene.isExternalUrl ? `<button class="btn-open-url" title="Ouvrir l'image depuis l'URL"><i class="fas fa-globe"></i></button>` : ''}
                    <button class="btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Ajouter un gestionnaire d'événements pour la sélection de la scène
            listItem.addEventListener('click', (e) => {
                // Ne pas déclencher si on a cliqué sur le bouton de suppression
                if (e.target.closest('.btn-delete')) {
                    return;
                }
                
                console.log(`Scene clicked: ${scene.name} (index: ${index})`);
                if (this.onSceneSelect) {
                    this.onSceneSelect(index);
                }
            });
            
            // Ajouter un gestionnaire d'événements pour la suppression de la scène
            listItem.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteScene(index);
            });
            
            // Ajouter un gestionnaire d'événements pour l'ouverture de l'URL si c'est une scène externe
            if (scene.isExternalUrl) {
                listItem.querySelector('.btn-open-url').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openSceneUrl(scene);
                });
            }
            
            scenesList.appendChild(listItem);
        });
    }

    /**
     * Supprime une scène
     * @param {number} index - Index de la scène à supprimer
     */
    deleteScene(index) {
        // Demander confirmation
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette scène ?')) {
            return;
        }
        
        // Appeler la fonction de suppression
        if (this.onSceneDelete) {
            this.onSceneDelete(index);
        }
    }

    /**
     * Ouvre l'URL d'une scène externe et copie l'URL dans le presse-papier
     * @param {Object} scene - La scène à ouvrir
     */
    openSceneUrl(scene) {
        if (!scene || !scene.isExternalUrl) {
            return;
        }
        
        // Copier l'URL dans le presse-papier
        navigator.clipboard.writeText(scene.imageUrl)
            .then(() => {
                console.log(`URL copiée dans le presse-papier: ${scene.imageUrl}`);
            })
            .catch(err => {
                console.error('Erreur lors de la copie de l\'URL:', err);
            });
        
        // Ouvrir l'image dans un nouvel onglet
        const viewerUrl = `index.html?image=${encodeURIComponent(scene.imageUrl)}`;
        window.open(viewerUrl, '_blank');
    }

    /**
     * Met à jour les paramètres de la scène dans l'interface
     */
    updateSceneSettings() {
        const titleInput = document.getElementById('scene-title');
        const setViewBtn = document.getElementById('set-initial-view-btn');
        
        // Vérifier qu'une scène est active
        if (this.appState.currentSceneIndex < 0) {
            titleInput.value = '';
            titleInput.disabled = true;
            setViewBtn.disabled = true;
        } else {
            const scene = this.appState.scenes[this.appState.currentSceneIndex];
            titleInput.value = scene.name;
            titleInput.disabled = false;
            setViewBtn.disabled = false;
        }
    }
}

// Exporter la classe
export default ScenesUI;
