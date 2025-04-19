/**
 * Spynorama - Utils Internationalization Module
 * Gère l'internationalisation de l'application
 */

/**
 * Classe d'utilitaires pour l'internationalisation
 */
class I18nUtils {
    /**
     * Constructeur
     * @param {string} defaultLocale - Locale par défaut (ex: 'fr', 'en', 'es')
     */
    constructor(defaultLocale = 'fr') {
        this.translations = {};
        this.currentLocale = defaultLocale;
        this.defaultLocale = defaultLocale;
    }

    /**
     * Ajoute des traductions pour une locale spécifique
     * @param {string} locale - Locale (ex: 'fr', 'en', 'es')
     * @param {Object} translations - Objet contenant les traductions
     */
    addTranslations(locale, translations) {
        if (!this.translations[locale]) {
            this.translations[locale] = {};
        }
        
        // Fusionner les nouvelles traductions avec les existantes
        this.translations[locale] = {
            ...this.translations[locale],
            ...translations
        };
    }

    /**
     * Définit la locale courante
     * @param {string} locale - Locale à définir
     * @returns {boolean} - true si la locale a été changée, false sinon
     */
    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            
            // Déclencher un événement pour informer l'application du changement de locale
            const event = new CustomEvent('localeChanged', { detail: { locale } });
            document.dispatchEvent(event);
            
            // Sauvegarder la préférence de l'utilisateur
            localStorage.setItem('spynorama-locale', locale);
            
            return true;
        }
        return false;
    }

    /**
     * Récupère la locale courante
     * @returns {string} - Locale courante
     */
    getLocale() {
        return this.currentLocale;
    }

    /**
     * Récupère les locales disponibles
     * @returns {Array<string>} - Liste des locales disponibles
     */
    getAvailableLocales() {
        return Object.keys(this.translations);
    }

    /**
     * Traduit une clé dans la locale courante
     * @param {string} key - Clé de traduction
     * @param {Object} params - Paramètres à insérer dans la traduction
     * @returns {string} - Texte traduit
     */
    translate(key, params = {}) {
        // Chercher la traduction dans la locale courante
        let translation = this.getTranslationFromKey(key, this.currentLocale);
        
        // Si la traduction n'existe pas dans la locale courante, utiliser la locale par défaut
        if (!translation && this.currentLocale !== this.defaultLocale) {
            translation = this.getTranslationFromKey(key, this.defaultLocale);
        }
        
        // Si la traduction n'existe toujours pas, retourner la clé
        if (!translation) {
            return key;
        }
        
        // Remplacer les paramètres dans la traduction
        return this.replaceParams(translation, params);
    }

    /**
     * Récupère une traduction à partir d'une clé et d'une locale
     * @param {string} key - Clé de traduction
     * @param {string} locale - Locale
     * @returns {string|null} - Traduction ou null si non trouvée
     * @private
     */
    getTranslationFromKey(key, locale) {
        if (!this.translations[locale]) {
            return null;
        }
        
        // Gérer les clés imbriquées (ex: 'app.title')
        const keys = key.split('.');
        let translation = this.translations[locale];
        
        for (const k of keys) {
            if (translation[k] === undefined) {
                return null;
            }
            translation = translation[k];
        }
        
        return translation;
    }

    /**
     * Remplace les paramètres dans une traduction
     * @param {string} translation - Traduction
     * @param {Object} params - Paramètres à insérer
     * @returns {string} - Traduction avec paramètres remplacés
     * @private
     */
    replaceParams(translation, params) {
        return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Charge la locale depuis le localStorage ou la détecte automatiquement
     * @returns {string} - Locale chargée
     */
    loadLocale() {
        // Essayer de charger depuis le localStorage
        const savedLocale = localStorage.getItem('spynorama-locale');
        if (savedLocale && this.translations[savedLocale]) {
            this.currentLocale = savedLocale;
            return savedLocale;
        }
        
        // Détecter la locale du navigateur
        const browserLocale = navigator.language.split('-')[0];
        if (this.translations[browserLocale]) {
            this.currentLocale = browserLocale;
            return browserLocale;
        }
        
        // Utiliser la locale par défaut
        return this.defaultLocale;
    }

    /**
     * Traduit tous les éléments de la page avec l'attribut data-i18n
     */
    translatePage() {
        // Traduire les éléments avec data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            
            // Si l'élément a un attribut placeholder, mettre à jour le placeholder
            if (element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', translation);
            } 
            // Sinon, mettre à jour le contenu de l'élément
            else {
                element.textContent = translation;
            }
        });
        
        // Traduire les placeholders avec data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.translate(key);
            element.setAttribute('placeholder', translation);
        });
    }

    /**
     * Initialise l'internationalisation
     * @param {Object} options - Options d'initialisation
     * @param {string} options.defaultLocale - Locale par défaut
     * @param {Object} options.translations - Objet contenant les traductions pour chaque locale
     * @param {boolean} options.autoTranslate - Traduire automatiquement la page après initialisation
     * @returns {I18nUtils} - Instance de I18nUtils
     */
    static init(options = {}) {
        const i18n = new I18nUtils(options.defaultLocale || 'fr');
        
        // Ajouter les traductions
        if (options.translations) {
            Object.entries(options.translations).forEach(([locale, translations]) => {
                i18n.addTranslations(locale, translations);
            });
        }
        
        // Charger la locale
        i18n.loadLocale();
        
        // Traduire la page si demandé
        if (options.autoTranslate !== false) {
            i18n.translatePage();
            
            // Traduire la page à chaque changement de locale
            document.addEventListener('localeChanged', () => {
                i18n.translatePage();
            });
        }
        
        return i18n;
    }
}

// Fonction raccourcie pour la traduction
export const t = (key, params = {}) => {
    if (!window.i18n) {
        console.warn('I18nUtils not initialized. Call I18nUtils.init() first.');
        return key;
    }
    return window.i18n.translate(key, params);
};

// Exporter la classe
export default I18nUtils;
