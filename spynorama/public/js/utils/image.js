/**
 * Spynorama - Utils Image Module
 * Utilitaires pour le traitement des images
 */

/**
 * Classe d'utilitaires pour les images
 */
class ImageUtils {
    /**
     * Redimensionne une image pour réduire sa taille
     * @param {string} dataUrl - URL de données de l'image
     * @param {number} maxSize - Taille maximale en octets
     * @returns {Promise<string>} - URL de données de l'image redimensionnée
     */
    static resizeImage(dataUrl, maxSize) {
        return new Promise((resolve) => {
            // Créer une image à partir de l'URL de données
            const img = new Image();
            img.onload = function() {
                // Calculer le ratio optimal en une seule fois plutôt que par itérations
                const originalSize = Math.ceil((dataUrl.length * 0.75) / 1024);
                
                // Si l'image est déjà plus petite que la taille maximale, la retourner telle quelle
                if (originalSize <= maxSize / 1024) {
                    console.log(`L'image est déjà plus petite que la taille maximale (${originalSize}KB < ${maxSize/1024}KB)`);
                    resolve(dataUrl);
                    return;
                }
                
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
            
            img.onerror = function() {
                console.error('Erreur lors du chargement de l\'image pour le redimensionnement');
                resolve(dataUrl); // Retourner l'image originale en cas d'erreur
            };
            
            img.src = dataUrl;
        });
    }

    /**
     * Convertit une URL externe en Data URL
     * @param {string} url - URL de l'image
     * @returns {Promise<string>} - Data URL de l'image
     */
    static urlToDataUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Permettre le chargement d'images cross-origin
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/jpeg');
                resolve(dataUrl);
            };
            
            img.onerror = function() {
                reject(new Error(`Impossible de charger l'image depuis l'URL: ${url}`));
            };
            
            img.src = url;
        });
    }

    /**
     * Crée une miniature à partir d'une image
     * @param {string} dataUrl - URL de données de l'image
     * @param {number} width - Largeur de la miniature
     * @param {number} height - Hauteur de la miniature
     * @returns {Promise<string>} - URL de données de la miniature
     */
    static createThumbnail(dataUrl, width, height) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                
                // Calculer les dimensions pour conserver le ratio
                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                
                const imgRatio = img.width / img.height;
                const canvasRatio = width / height;
                
                if (imgRatio > canvasRatio) {
                    // L'image est plus large que le canvas
                    drawHeight = height;
                    drawWidth = height * imgRatio;
                    offsetX = (width - drawWidth) / 2;
                } else {
                    // L'image est plus haute que le canvas
                    drawWidth = width;
                    drawHeight = width / imgRatio;
                    offsetY = (height - drawHeight) / 2;
                }
                
                // Dessiner l'image sur le canvas
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                // Obtenir l'URL de données du canvas
                const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(thumbnailDataUrl);
            };
            
            img.onerror = function() {
                console.error('Erreur lors du chargement de l\'image pour la miniature');
                resolve(null);
            };
            
            img.src = dataUrl;
        });
    }

    /**
     * Vérifie si une URL est valide
     * @param {string} url - URL à vérifier
     * @returns {boolean} - true si l'URL est valide, false sinon
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Vérifie si une URL est une image
     * @param {string} url - URL à vérifier
     * @returns {Promise<boolean>} - true si l'URL est une image, false sinon
     */
    static isImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                resolve(true);
            };
            img.onerror = function() {
                resolve(false);
            };
            img.src = url;
        });
    }
}

// Exporter la classe
export default ImageUtils;
