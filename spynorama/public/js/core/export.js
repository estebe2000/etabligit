/**
 * Spynorama - Core Export Module
 * Gère l'export du projet en site web autonome
 */

/**
 * Classe de gestion de l'export
 */
class ExportManager {
    /**
     * Exporte le projet en site web
     * @param {Object} project - Données du projet
     * @param {Object} options - Options d'export
     * @returns {Promise<Blob>} - Promesse résolue avec le blob du fichier ZIP
     */
    exportWebsite(project, options) {
        // Vérifier qu'il y a des scènes à exporter
        if (!project.scenes || project.scenes.length === 0) {
            throw new Error('Aucune scène à exporter.');
        }
        
        // Créer un fichier ZIP
        const zip = new JSZip();

        // Créer les dossiers nécessaires
        zip.folder('css');
        zip.folder('js');
        zip.folder('images');

        // Ajouter les fichiers au ZIP
        zip.file('index.html', this.generateIndexHtml(options.title, options.showTitle));
        zip.file('css/style.css', this.generateStyleCss());
        zip.file('css/icons.css', this.getIconsCss());
        zip.file('js/viewer.js', this.generateViewerJs(options.autorotate, options.autorotateSpeed, options.showSceneBar));
        zip.file('js/marzipano.min.js', this.getMarzipanoJs());

        // Traiter les images selon la qualité sélectionnée
        return this.processImages(project.scenes, options.imageQuality, options.urlImagesOption)
            .then(processedScenes => {
                // Générer data.js avec les scènes traitées
                const dataJsContent = `const scenes = ${JSON.stringify(processedScenes, null, 2)};\n`
                                   + `const currentSceneIndex = ${project.currentSceneIndex};`;
                zip.file('js/data.js', dataJsContent);

                // Générer le ZIP final
                return zip.generateAsync({type: 'blob'});
            });
    }

    /**
     * Traite les images des scènes selon les options d'export
     * @param {Array} scenes - Scènes du projet
     * @param {string} imageQuality - Qualité des images ('native', 'optimized', 'reduced')
     * @param {string} urlImagesOption - Option pour les images URL ('keep')
     * @returns {Promise<Array>} - Promesse résolue avec les scènes traitées
     */
    processImages(scenes, imageQuality, urlImagesOption) {
        const imagePromises = scenes.map((scene, index) => {
            return new Promise((resolve) => {
                // Si c'est une URL externe
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
                    this.resizeImage(scene.imageUrl, maxSize).then(resizedImageUrl => {
                        resolve({index, imageUrl: resizedImageUrl, isExternalUrl: false});
                    });
                }
            });
        });

        // Attendre que toutes les images soient traitées
        return Promise.all(imagePromises).then(processedScenes => {
            // Créer une copie des scènes avec les URLs traitées
            return scenes.map((scene, i) => {
                const processedScene = processedScenes.find(s => s.index === i);
                
                // Si c'est une URL externe
                if (processedScene.isExternalUrl) {
                    return {
                        ...scene,
                        imageUrl: processedScene.imageUrl
                    };
                } else {
                    // Pour les images locales ou les URLs à télécharger
                    return {
                        ...scene,
                        imageUrl: processedScene.imageUrl
                    };
                }
            });
        });
    }

    /**
     * Redimensionne une image pour réduire sa taille
     * @param {string} dataUrl - URL de données de l'image
     * @param {number} maxSize - Taille maximale en octets
     * @returns {Promise<string>} - URL de données de l'image redimensionnée
     */
    resizeImage(dataUrl, maxSize) {
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
    generateIndexHtml(title, showTitle) {
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
    generateStyleCss() {
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
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    position: relative;
    overflow: visible;
}

.hotspot:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: scale(1.1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.hotspot i {
    font-size: 18px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* Ajouter un effet de pulsation pour les hotspots */
.hotspot::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
    z-index: -1;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.7;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.3;
    }
    100% {
        transform: scale(1);
        opacity: 0.7;
    }
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

.hotspot-photo i {
    color: #9C27B0; /* Violet */
}

.hotspot-video i {
    color: #F44336; /* Rouge */
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
     * @param {boolean} autorotate - Activer le défilement automatique
     * @param {number} autorotateSpeed - Vitesse de rotation
     * @param {boolean} showSceneBar - Afficher la barre de scènes
     * @returns {string} Contenu JavaScript
     */
    generateViewerJs(autorotate, autorotateSpeed, showSceneBar) {
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
    
    // Configurer l'autorotation si activée
    if (${autorotate}) {
        // Convertir la vitesse de degrés/seconde en radians/millisecondes
        const autorotateSpeed = ${autorotateSpeed} * Math.PI / 180 / 1000;
        
        // Fonction d'autorotation
        function autorotate() {
            // Obtenir la vue de la scène active
            const view = viewer.view();
            
            // Calculer le nouveau yaw
            const yaw = view.yaw() + autorotateSpeed;
            
            // Mettre à jour la vue
            view.setYaw(yaw);
            
            // Continuer l'autorotation
            requestAnimationFrame(autorotate);
        }
        
        // Démarrer l'autorotation
        autorotate();
    }
    
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
});`;
    }

    /**
     * Récupère le contenu du fichier marzipano.min.js
     * @returns {string} Contenu JavaScript
     */
    getMarzipanoJs() {
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
     * Récupère le contenu du fichier icons.css
     * @returns {string} Contenu CSS
     */
    getIconsCss() {
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
}

// Exporter la classe
export default ExportManager;
