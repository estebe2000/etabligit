/**
 * Spynorama - Core Storage Module
 * Gère le stockage, le chargement et l'export des projets
 */

// Constante pour la clé de stockage localStorage
const STORAGE_KEY = 'spynorama-project';

/**
 * Classe de gestion du stockage
 */
class StorageManager {
    constructor() {
        this.autoSaveTimer = null;
    }

    /**
     * Sauvegarde le projet dans le localStorage
     * @param {Object} project - Données du projet à sauvegarder
     * @returns {boolean} - Succès de l'opération
     */
    saveToLocalStorage(project) {
        try {
            // Vérifier la taille du projet
            const jsonString = JSON.stringify(project);
            
            // Vérifier si le projet n'est pas trop volumineux pour localStorage
            if (jsonString.length > 5000000) { // ~5MB
                console.warn('Projet trop volumineux pour localStorage');
                return false;
            }
            
            // Sauvegarder dans localStorage
            localStorage.setItem(STORAGE_KEY, jsonString);
            
            console.log('Projet sauvegardé dans le localStorage.');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde dans le localStorage :', error);
            return false;
        }
    }

    /**
     * Charge le projet depuis le localStorage
     * @returns {Object|null} - Données du projet ou null si erreur
     */
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) {
                return null;
            }
            
            const project = JSON.parse(savedData);
            
            // Vérifier la structure du projet
            if (!project.scenes || !Array.isArray(project.scenes)) {
                throw new Error('Format de projet invalide.');
            }
            
            console.log('Projet chargé depuis le localStorage.');
            return project;
        } catch (error) {
            console.error('Erreur lors du chargement depuis le localStorage :', error);
            return null;
        }
    }

    /**
     * Planifie une sauvegarde automatique
     * @param {Object} project - Données du projet à sauvegarder
     * @param {number} delay - Délai en ms avant la sauvegarde
     */
    scheduleAutoSave(project, delay = 2000) {
        // Annuler tout timer existant
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Planifier une nouvelle sauvegarde
        this.autoSaveTimer = setTimeout(() => {
            this.saveToLocalStorage(project);
        }, delay);
    }

    /**
     * Exporte le projet au format JSON
     * @param {Object} project - Données du projet à exporter
     * @returns {string} - URL du fichier à télécharger
     */
    exportProject(project) {
        // Vérifier qu'il y a des scènes à exporter
        if (!project.scenes || project.scenes.length === 0) {
            throw new Error('Aucune scène à exporter.');
        }
        
        // Convertir en JSON
        const jsonString = JSON.stringify(project, null, 2);
        
        // Créer un blob et un lien de téléchargement
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        return url;
    }

    /**
     * Importe un projet depuis un fichier JSON
     * @param {File} file - Fichier JSON à importer
     * @returns {Promise<Object>} - Promesse résolue avec les données du projet
     */
    importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // Parser le JSON
                    const project = JSON.parse(e.target.result);
                    
                    // Vérifier la structure du projet
                    if (!project.scenes || !Array.isArray(project.scenes)) {
                        throw new Error('Format de projet invalide.');
                    }
                    
                    resolve(project);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function(error) {
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Crée un nouveau projet vide
     * @returns {Object} - Structure de projet vide
     */
    createNewProject() {
        return {
            version: '1.0',
            scenes: [],
            currentSceneIndex: -1
        };
    }
}

// Exporter la classe
export default StorageManager;
