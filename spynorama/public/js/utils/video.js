/**
 * Spynorama - Utils Video Module
 * Utilitaires pour le traitement des vidéos
 */

/**
 * Classe d'utilitaires pour les vidéos
 */
class VideoUtils {
    /**
     * Extrait l'ID d'une vidéo YouTube à partir de son URL
     * @param {string} url - URL de la vidéo YouTube
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    static extractYoutubeId(url) {
        if (!url) return null;
        
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Extrait l'ID d'une vidéo Vimeo à partir de son URL
     * @param {string} url - URL de la vidéo Vimeo
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    static extractVimeoId(url) {
        if (!url) return null;
        
        const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
        const match = url.match(regExp);
        
        return match ? match[3] : null;
    }

    /**
     * Extrait l'ID d'une vidéo Podeduc à partir de son URL
     * @param {string} url - URL de la vidéo Podeduc
     * @returns {string|null} - ID de la vidéo ou null si l'URL est invalide
     */
    static extractPodeducId(url) {
        if (!url) return null;
        
        // Format: https://podeduc.apps.education.fr/video/86450-presentation-du-village-decouche-par-des-collegiens-de-4e/
        const regExp = /podeduc\.apps\.education\.fr\/video\/(\d+)(?:-[^\/]*)?(?:\/|\?|$)/;
        const match = url.match(regExp);
        
        return match ? match[1] : null;
    }

    /**
     * Extrait l'URL d'une vidéo à partir d'un code iframe
     * @param {string} iframeCode - Code iframe
     * @returns {string|null} - URL de la vidéo ou null si le code est invalide
     */
    static extractUrlFromIframe(iframeCode) {
        if (!iframeCode) return null;
        
        const srcRegExp = /src=["']([^"']+)["']/;
        const match = iframeCode.match(srcRegExp);
        
        return match ? match[1] : null;
    }

    /**
     * Crée un code iframe pour une vidéo YouTube
     * @param {string} youtubeId - ID de la vidéo YouTube
     * @param {number} width - Largeur de l'iframe
     * @param {number} height - Hauteur de l'iframe
     * @returns {string} - Code iframe
     */
    static createYoutubeIframe(youtubeId, width = 560, height = 315) {
        return `<iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`;
    }

    /**
     * Crée un code iframe pour une vidéo Vimeo
     * @param {string} vimeoId - ID de la vidéo Vimeo
     * @param {number} width - Largeur de l'iframe
     * @param {number} height - Hauteur de l'iframe
     * @returns {string} - Code iframe
     */
    static createVimeoIframe(vimeoId, width = 560, height = 315) {
        return `<iframe width="${width}" height="${height}" src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allowfullscreen></iframe>`;
    }

    /**
     * Crée un code iframe pour une vidéo Podeduc
     * @param {string} podeducId - ID de la vidéo Podeduc
     * @param {number} width - Largeur de l'iframe
     * @param {number} height - Hauteur de l'iframe
     * @returns {string} - Code iframe
     */
    static createPodeducIframe(podeducId, width = 560, height = 315) {
        return `<iframe src="https://podeduc.apps.education.fr/video/${podeducId}/?is_iframe=true" width="${width}" height="${height}" style="padding: 0; margin: 0; border:0" allowfullscreen></iframe>`;
    }

    /**
     * Vérifie si une URL est une vidéo valide
     * @param {string} url - URL à vérifier
     * @returns {boolean} - true si l'URL est une vidéo valide, false sinon
     */
    static isValidVideoUrl(url) {
        if (!url) return false;
        
        // Vérifier si c'est une URL YouTube, Vimeo ou Podeduc
        return (
            this.extractYoutubeId(url) !== null ||
            this.extractVimeoId(url) !== null ||
            this.extractPodeducId(url) !== null ||
            url.match(/\.(mp4|webm|ogg)$/i) !== null // Vidéos directes
        );
    }

    /**
     * Détermine le type de vidéo à partir de son URL
     * @param {string} url - URL de la vidéo
     * @returns {string|null} - Type de vidéo ('youtube', 'vimeo', 'podeduc', 'direct') ou null si inconnu
     */
    static getVideoType(url) {
        if (!url) return null;
        
        if (this.extractYoutubeId(url) !== null) {
            return 'youtube';
        } else if (this.extractVimeoId(url) !== null) {
            return 'vimeo';
        } else if (this.extractPodeducId(url) !== null) {
            return 'podeduc';
        } else if (url.match(/\.(mp4|webm|ogg)$/i) !== null) {
            return 'direct';
        }
        
        return null;
    }

    /**
     * Sanitize le code iframe pour éviter les injections XSS
     * @param {string} iframeCode - Code iframe à sanitizer
     * @returns {string} - Code iframe sanitizé
     */
    static sanitizeIframe(iframeCode) {
        if (!iframeCode) return '';
        
        // Vérifier que c'est bien un iframe
        if (!iframeCode.includes('<iframe') || !iframeCode.includes('</iframe>')) {
            return '';
        }
        
        // Extraire les attributs autorisés
        const srcRegExp = /src=["']([^"']+)["']/;
        const widthRegExp = /width=["']([^"']+)["']/;
        const heightRegExp = /height=["']([^"']+)["']/;
        const styleRegExp = /style=["']([^"']+)["']/;
        const allowfullscreenRegExp = /allowfullscreen/;
        
        const srcMatch = iframeCode.match(srcRegExp);
        const widthMatch = iframeCode.match(widthRegExp);
        const heightMatch = iframeCode.match(heightRegExp);
        const styleMatch = iframeCode.match(styleRegExp);
        const allowfullscreen = allowfullscreenRegExp.test(iframeCode);
        
        // Vérifier que la source est sécurisée (YouTube, Vimeo ou Podeduc)
        const src = srcMatch ? srcMatch[1] : '';
        if (!src || !(
            src.includes('youtube.com/embed/') ||
            src.includes('player.vimeo.com/video/') ||
            src.includes('podeduc.apps.education.fr/video/')
        )) {
            return '';
        }
        
        // Reconstruire l'iframe avec seulement les attributs autorisés
        let sanitizedIframe = '<iframe';
        sanitizedIframe += ` src="${src}"`;
        
        if (widthMatch) sanitizedIframe += ` width="${widthMatch[1]}"`;
        if (heightMatch) sanitizedIframe += ` height="${heightMatch[1]}"`;
        if (styleMatch) {
            // Filtrer les styles pour ne garder que ceux qui sont sûrs
            const safeStyles = styleMatch[1].split(';')
                .filter(style => {
                    const prop = style.split(':')[0].trim().toLowerCase();
                    return ['padding', 'margin', 'border'].includes(prop);
                })
                .join(';');
            
            if (safeStyles) sanitizedIframe += ` style="${safeStyles}"`;
        }
        
        if (allowfullscreen) sanitizedIframe += ' allowfullscreen';
        
        sanitizedIframe += '></iframe>';
        
        return sanitizedIframe;
    }
}

// Exporter la classe
export default VideoUtils;
