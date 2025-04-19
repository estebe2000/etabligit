/**
 * Spynorama - Core Viewer Module
 * Gère l'initialisation et les interactions avec le viewer Marzipano
 */

// Constantes et variables
const DEFAULT_VIEW = { yaw: 0, pitch: 0, fov: Math.PI/2 };

// Classe principale du viewer
class MarzipanoViewer {
    constructor() {
        this.viewer = null;
        this.currentScene = null;
    }

    /**
     * Initialise le viewer Marzipano
     * @param {HTMLElement} panoElement - Élément DOM conteneur du viewer
     * @returns {Marzipano.Viewer} - Instance du viewer
     */
    initialize(panoElement) {
        // Création du viewer avec les options par défaut
        const viewerOpts = {
            controls: {
                mouseViewMode: 'drag' // Mode de contrôle à la souris
            }
        };
        
        // Initialisation du viewer
        this.viewer = new Marzipano.Viewer(panoElement, viewerOpts);
        
        return this.viewer;
    }

    /**
     * Charge une scène dans le viewer
     * @param {Object} sceneData - Données de la scène à charger
     * @param {Array} hotspots - Liste des hotspots de la scène
     * @param {Function} onHotspotClick - Fonction à appeler lors du clic sur un hotspot
     * @returns {Marzipano.Scene} - Instance de la scène Marzipano
     */
    loadScene(sceneData, hotspots, onHotspotClick) {
        if (!this.viewer) {
            console.error('Viewer non initialisé');
            return null;
        }

        console.log('Chargement de la scène:', sceneData.name);
        
        try {
            // Nettoyer le viewer avant de charger une nouvelle scène
            this.viewer.destroyAllScenes();
            
            // Créer une source d'image pour Marzipano
            const source = new Marzipano.ImageUrlSource(function(tile) {
                return { url: sceneData.imageUrl };
            });
            
            // Créer une géométrie équirectangulaire
            const geometry = new Marzipano.EquirectGeometry([{ width: 2000 }]);
            
            // Créer un limiteur de vue
            const limiter = Marzipano.RectilinearView.limit.traditional(2000, 100*Math.PI/180);
            
            // Créer une vue rectilinéaire avec les paramètres initiaux de la scène
            const viewParams = sceneData.initialViewParameters || DEFAULT_VIEW;
            const view = new Marzipano.RectilinearView(viewParams, limiter);
            
            // Créer la scène Marzipano
            const marzipanoScene = this.viewer.createScene({
                source: source,
                geometry: geometry,
                view: view,
                pinFirstLevel: true
            });
            
            // Afficher la scène
            marzipanoScene.switchTo();
            
            // Ajouter les hotspots
            if (hotspots && hotspots.length > 0) {
                this.addHotspotsToScene(marzipanoScene, hotspots, onHotspotClick);
            }
            
            // Stocker la scène courante
            this.currentScene = marzipanoScene;
            
            console.log('Scène chargée avec succès:', sceneData.name);
            return marzipanoScene;
            
        } catch (error) {
            console.error('Erreur lors du chargement de la scène:', error);
            throw error;
        }
    }

    /**
     * Ajoute des hotspots à une scène Marzipano
     * @param {Marzipano.Scene} marzipanoScene - Scène Marzipano
     * @param {Array} hotspots - Liste des hotspots à ajouter
     * @param {Function} onHotspotClick - Fonction à appeler lors du clic sur un hotspot
     */
    addHotspotsToScene(marzipanoScene, hotspots, onHotspotClick) {
        hotspots.forEach(hotspot => {
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
            marzipanoScene.hotspotContainer().createHotspot(element, { 
                yaw: hotspot.position.yaw, 
                pitch: hotspot.position.pitch 
            });
            
            // Ajouter un gestionnaire d'événements pour le clic
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                if (onHotspotClick) {
                    onHotspotClick(hotspot, element);
                }
            });
            
            // Ajouter des comportements spécifiques selon le type
            this.setupHotspotBehavior(element, hotspot);
        });
    }

    /**
     * Configure le comportement spécifique d'un hotspot selon son type
     * @param {HTMLElement} element - Élément DOM du hotspot
     * @param {Object} hotspot - Données du hotspot
     */
    setupHotspotBehavior(element, hotspot) {
        // Ajouter un gestionnaire d'événements pour l'affichage du tooltip
        if (hotspot.type === 'info') {
            element.addEventListener('mouseenter', () => {
                this.showInfoTooltip(element, hotspot);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideInfoTooltip();
            });
        }
        
        // Ajouter un gestionnaire d'événements pour les hotspots audio
        if (hotspot.type === 'audio' && hotspot.autoplay) {
            // Lecture automatique si configurée
            setTimeout(() => {
                // Simuler un clic sur le hotspot pour déclencher la lecture
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                element.dispatchEvent(clickEvent);
            }, 1000);
        }
    }

    /**
     * Affiche un tooltip d'information pour un hotspot
     * @param {HTMLElement} element - Élément du hotspot
     * @param {Object} hotspot - Données du hotspot
     */
    showInfoTooltip(element, hotspot) {
        // Supprimer tout tooltip existant
        this.hideInfoTooltip();
        
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
    hideInfoTooltip() {
        const tooltip = document.getElementById('hotspot-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Récupère les paramètres de vue actuels
     * @returns {Object} - Paramètres de vue (yaw, pitch, fov)
     */
    getCurrentViewParameters() {
        if (!this.viewer) {
            return DEFAULT_VIEW;
        }
        
        const view = this.viewer.view();
        return view.parameters();
    }

    /**
     * Détruit toutes les scènes et nettoie le viewer
     */
    destroy() {
        if (this.viewer) {
            this.viewer.destroyAllScenes();
            this.currentScene = null;
        }
    }
}

// Exporter la classe
export default MarzipanoViewer;
