/**
 * Spynorama - UI Modals Module
 * Gère les modales de l'interface utilisateur
 */

/**
 * Classe de gestion des modales
 */
class ModalsUI {
    /**
     * Constructeur
     * @param {Object} appState - État de l'application
     * @param {Function} onExport - Fonction appelée lors de l'export du projet
     * @param {Function} onExportWebsite - Fonction appelée lors de l'export du site web
     * @param {Function} onPublishToForge - Fonction appelée lors de la publication sur la forge
     */
    constructor(appState, onExport, onExportWebsite, onPublishToForge) {
        this.appState = appState;
        this.onExport = onExport;
        this.onExportWebsite = onExportWebsite;
        this.onPublishToForge = onPublishToForge;
        
        // Initialiser les écouteurs d'événements
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Boutons de fermeture des modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        // Modal d'export
        document.getElementById('export-website-btn').addEventListener('click', () => this.showExportOptions());
        document.getElementById('confirm-export-btn').addEventListener('click', () => this.exportWebsite());
        document.getElementById('cancel-export-btn').addEventListener('click', () => this.closeModals());
        
        // Modal de publication sur la forge
        document.getElementById('publish-forge-btn').addEventListener('click', () => this.showPublishForgeOptions());
        document.getElementById('confirm-publish-btn').addEventListener('click', () => this.publishToForge());
        document.getElementById('cancel-publish-btn').addEventListener('click', () => this.closeModals());
        
        // Aide
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
    }

    /**
     * Ferme toutes les modales
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Affiche la modale des options d'export
     */
    showExportOptions() {
        // Vérifier qu'il y a des scènes à exporter
        if (this.appState.scenes.length === 0) {
            alert('Aucune scène à exporter. Veuillez ajouter au moins une scène.');
            return;
        }
        
        // Afficher la modale
        const modal = document.getElementById('export-options-modal');
        modal.classList.add('active');
        
        // Vérifier s'il y a des images URL dans le projet
        const hasUrlImages = this.appState.scenes.some(scene => scene.isExternalUrl);
        
        // Afficher ou masquer l'option pour les images URL
        const urlImagesGroup = document.getElementById('export-url-images-group');
        if (urlImagesGroup) {
            urlImagesGroup.style.display = hasUrlImages ? 'block' : 'none';
        }
    }

    /**
     * Exporte le site web
     */
    exportWebsite() {
        // Récupérer les options d'export
        const options = {
            title: document.getElementById('export-title').value,
            showTitle: document.getElementById('export-show-title').checked,
            showSceneBar: document.getElementById('export-scenebar').checked,
            imageQuality: document.getElementById('export-image-quality').value,
            urlImagesOption: 'keep', // Seule option disponible actuellement
            autorotate: false, // Option supprimée de l'interface
            autorotateSpeed: 0 // Option supprimée de l'interface
        };
        
        // Appeler la fonction d'export
        if (this.onExportWebsite) {
            this.onExportWebsite(options);
        }
        
        // Fermer la modale
        this.closeModals();
    }
    
    /**
     * Affiche la modale des options de publication sur la forge
     */
    showPublishForgeOptions() {
        // Vérifier qu'il y a des scènes à publier
        if (this.appState.scenes.length === 0) {
            alert('Aucune scène à publier. Veuillez ajouter au moins une scène.');
            return;
        }
        
        // Afficher la modale
        const modal = document.getElementById('publish-forge-modal');
        modal.classList.add('active');
    }
    
    /**
     * Publie le site web sur la forge
     */
    async publishToForge() {
        // Récupérer les options de publication
        const options = {
            token: document.getElementById('forge-token').value,
            name: document.getElementById('forge-name').value,
            etabliUrl: document.getElementById('etabli-url').value
        };
        
        // Vérifier que les champs obligatoires sont remplis
        if (!options.token || !options.name) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        // Afficher un message de chargement
        const publishStatus = document.getElementById('publish-status');
        publishStatus.textContent = 'Publication en cours...';
        publishStatus.style.display = 'block';
        
        try {
            // Appeler la fonction de publication
            if (this.onPublishToForge) {
                const result = await this.onPublishToForge(options);
                
                // Afficher l'URL générée
                if (result && result.pages_url) {
                    document.getElementById('published-url').value = result.pages_url;
                    document.getElementById('published-url-container').style.display = 'block';
                    publishStatus.textContent = 'Publication réussie !';
                    publishStatus.style.color = 'green';
                } else {
                    publishStatus.textContent = 'Publication terminée, mais l\'URL n\'est pas disponible immédiatement.';
                    publishStatus.style.color = 'orange';
                }
            }
        } catch (error) {
            console.error('Erreur lors de la publication:', error);
            publishStatus.textContent = `Erreur: ${error.message || 'Une erreur est survenue lors de la publication.'}`;
            publishStatus.style.color = 'red';
        }
    }

    /**
     * Affiche l'aide de l'application
     */
    showHelp() {
        // Créer une modale d'aide
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
                        <li><strong>Photo</strong> : Affiche une image en plein écran.</li>
                        <li><strong>Vidéo</strong> : Intègre des vidéos YouTube, Vimeo, Podeduc ou directes.</li>
                    </ul>
                    
                    <h4>Gérer le projet</h4>
                    <ul>
                        <li><strong>Nouveau</strong> : Crée un nouveau projet vide.</li>
                        <li><strong>Ouvrir</strong> : Charge un projet existant depuis un fichier JSON.</li>
                        <li><strong>Enregistrer</strong> : Sauvegarde le projet actuel dans un fichier JSON.</li>
                        <li><strong>Exporter site web</strong> : Génère un site web autonome avec la visite virtuelle.</li>
                    </ul>
                    
                    <h4>Fonctionnalités spéciales</h4>
                    <ul>
                        <li><strong>Scènes depuis URL</strong> : Pour les scènes ajoutées via URL, un icône globe (🌐) apparaît dans la liste des scènes. En cliquant sur cet icône, l'URL de l'image est copiée dans le presse-papier et l'image s'ouvre dans un nouvel onglet en mode visualisation 360°.</li>
                        <li><strong>Visualisation directe</strong> : Vous pouvez visualiser directement une image panoramique en ajoutant le paramètre <code>?image=URL_DE_VOTRE_IMAGE</code> à l'URL de l'application.</li>
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
        
        // Ajouter la modale au document
        document.body.appendChild(helpModal);
        
        // Ajouter les gestionnaires d'événements pour fermer la modale
        helpModal.querySelector('.close-modal').addEventListener('click', () => {
            helpModal.remove();
        });
        
        helpModal.querySelector('.close-help').addEventListener('click', () => {
            helpModal.remove();
        });
        
        // Fermer la modale en cliquant en dehors
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
    }

    /**
     * Affiche une modale avec une image
     * @param {Object} hotspot - Données du hotspot photo
     */
    showPhotoModal(hotspot) {
        // Créer une modale pour afficher l'image
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
        
        // Ajouter la modale au document
        document.body.appendChild(photoModal);
        
        // Ajouter un gestionnaire d'événements pour fermer la modale
        photoModal.querySelector('.close-modal').addEventListener('click', () => {
            photoModal.remove();
        });
        
        // Fermer la modale en cliquant en dehors
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                photoModal.remove();
            }
        });
    }

    /**
     * Affiche une modale avec une vidéo
     * @param {Object} hotspot - Données du hotspot vidéo
     */
    showVideoModal(hotspot) {
        // Créer une modale pour afficher la vidéo
        const videoModal = document.createElement('div');
        videoModal.classList.add('modal', 'active');
        videoModal.id = 'video-modal';
        
        // Préparer l'iframe en fonction du type de vidéo
        let videoEmbed = '';
        
        switch (hotspot.videoType) {
            case 'youtube':
                // Extraire l'ID de la vidéo YouTube
                const youtubeId = this.extractYoutubeId(hotspot.videoUrl);
                if (youtubeId) {
                    videoEmbed = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    videoEmbed = `<p>URL YouTube invalide</p>`;
                }
                break;
            case 'vimeo':
                // Extraire l'ID de la vidéo Vimeo
                const vimeoId = this.extractVimeoId(hotspot.videoUrl);
                if (vimeoId) {
                    videoEmbed = `<iframe width="100%" height="400" src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                    videoEmbed = `<p>URL Vimeo invalide</p>`;
                }
                break;
            case 'podeduc':
                // Utiliser directement le code iframe fourni
                if (hotspot.podeducIframe) {
                    // Modifier l'iframe pour s'adapter à la modale
                    let iframe = hotspot.podeducIframe;
                    // Remplacer width et height par des valeurs adaptées à la modale
                    iframe = iframe.replace(/width="[^"]*"/, 'width="100%"');
                    iframe = iframe.replace(/height="[^"]*"/, 'height="400"');
                    videoEmbed = iframe;
                } else {
                    // Fallback au comportement précédent si podeducIframe n'est pas défini
                    const podeducId = this.extractPodeducId(hotspot.videoUrl);
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
        
        // Ajouter la modale au document
        document.body.appendChild(videoModal);
        
        // Ajouter un gestionnaire d'événements pour fermer la modale
        videoModal.querySelector('.close-modal').addEventListener('click', () => {
            videoModal.remove();
        });
        
        // Fermer la modale en cliquant en dehors
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
    extractYoutubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Extrait l'ID d'une vidéo Vimeo à partir de son URL
     * @param {string} url - URL de la vidéo Vimeo
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    extractVimeoId(url) {
        const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        const match = url.match(regExp);
        return match ? match[3] : null;
    }

    /**
     * Extrait l'ID d'une vidéo Podeduc à partir de son URL
     * @param {string} url - URL de la vidéo Podeduc
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    extractPodeducId(url) {
        // Format: https://podeduc.apps.education.fr/video/86450-presentation-du-village-decouche-par-des-collegiens-de-4e/
        const regExp = /podeduc\.apps\.education\.fr\/video\/(\d+)(?:-[^\/]*)?(?:\/|\?|$)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }
}

// Exporter la classe
export default ModalsUI;
