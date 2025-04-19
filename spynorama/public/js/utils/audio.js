/**
 * Spynorama - Utils Audio Module
 * Utilitaires pour le traitement des fichiers audio
 */

/**
 * Classe d'utilitaires pour les fichiers audio
 */
class AudioUtils {
    /**
     * Vérifie si une URL est un fichier audio valide
     * @param {string} url - URL à vérifier
     * @returns {boolean} - true si l'URL est un fichier audio valide, false sinon
     */
    static isValidAudioUrl(url) {
        if (!url) return false;
        
        // Vérifier l'extension du fichier
        return url.match(/\.(mp3|wav|ogg|aac|m4a)$/i) !== null;
    }

    /**
     * Crée un élément audio avec les options spécifiées
     * @param {string} url - URL du fichier audio
     * @param {Object} options - Options de configuration
     * @param {boolean} options.autoplay - Lecture automatique
     * @param {boolean} options.loop - Lecture en boucle
     * @param {number} options.volume - Volume (0-1)
     * @returns {HTMLAudioElement} - Élément audio
     */
    static createAudioElement(url, options = {}) {
        const audio = new Audio(url);
        
        // Appliquer les options
        if (options.autoplay) audio.autoplay = true;
        if (options.loop) audio.loop = true;
        if (options.volume !== undefined) audio.volume = options.volume;
        
        return audio;
    }

    /**
     * Détermine le type de fichier audio à partir de son URL
     * @param {string} url - URL du fichier audio
     * @returns {string|null} - Type de fichier audio ('mp3', 'wav', 'ogg', etc.) ou null si inconnu
     */
    static getAudioType(url) {
        if (!url) return null;
        
        const match = url.match(/\.([^.]+)$/);
        if (match) {
            return match[1].toLowerCase();
        }
        
        return null;
    }

    /**
     * Formate la durée en secondes au format MM:SS
     * @param {number} seconds - Durée en secondes
     * @returns {string} - Durée formatée (MM:SS)
     */
    static formatDuration(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Crée un élément de contrôle audio personnalisé
     * @param {HTMLAudioElement} audioElement - Élément audio à contrôler
     * @returns {HTMLElement} - Élément de contrôle
     */
    static createAudioControl(audioElement) {
        const container = document.createElement('div');
        container.className = 'audio-control';
        
        // Bouton play/pause
        const playButton = document.createElement('button');
        playButton.className = 'audio-play-btn';
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        
        // Barre de progression
        const progressContainer = document.createElement('div');
        progressContainer.className = 'audio-progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'audio-progress-bar';
        
        const progressCurrent = document.createElement('div');
        progressCurrent.className = 'audio-progress-current';
        
        // Affichage du temps
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'audio-time';
        timeDisplay.textContent = '00:00 / 00:00';
        
        // Contrôle du volume
        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'audio-volume-container';
        
        const volumeButton = document.createElement('button');
        volumeButton.className = 'audio-volume-btn';
        volumeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.className = 'audio-volume-slider';
        volumeSlider.min = '0';
        volumeSlider.max = '1';
        volumeSlider.step = '0.1';
        volumeSlider.value = audioElement.volume.toString();
        
        // Assembler les éléments
        progressContainer.appendChild(progressBar);
        progressBar.appendChild(progressCurrent);
        
        volumeContainer.appendChild(volumeButton);
        volumeContainer.appendChild(volumeSlider);
        
        container.appendChild(playButton);
        container.appendChild(progressContainer);
        container.appendChild(timeDisplay);
        container.appendChild(volumeContainer);
        
        // Ajouter les gestionnaires d'événements
        playButton.addEventListener('click', () => {
            if (audioElement.paused) {
                audioElement.play()
                    .then(() => {
                        playButton.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(error => {
                        console.error('Erreur lors de la lecture audio:', error);
                        alert('Erreur lors de la lecture audio. Veuillez vérifier l\'URL ou le fichier audio.');
                    });
            } else {
                audioElement.pause();
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
        
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            audioElement.currentTime = ratio * audioElement.duration;
        });
        
        volumeButton.addEventListener('click', () => {
            if (audioElement.volume > 0) {
                audioElement.dataset.previousVolume = audioElement.volume;
                audioElement.volume = 0;
                volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
                volumeSlider.value = '0';
            } else {
                audioElement.volume = audioElement.dataset.previousVolume || 0.5;
                volumeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                volumeSlider.value = audioElement.volume;
            }
        });
        
        volumeSlider.addEventListener('input', () => {
            audioElement.volume = parseFloat(volumeSlider.value);
            if (audioElement.volume === 0) {
                volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (audioElement.volume < 0.5) {
                volumeButton.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                volumeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });
        
        // Mettre à jour la barre de progression et l'affichage du temps
        audioElement.addEventListener('timeupdate', () => {
            const currentTime = audioElement.currentTime;
            const duration = audioElement.duration || 0;
            
            // Mettre à jour la barre de progression
            const progress = (currentTime / duration) * 100;
            progressCurrent.style.width = `${progress}%`;
            
            // Mettre à jour l'affichage du temps
            timeDisplay.textContent = `${AudioUtils.formatDuration(currentTime)} / ${AudioUtils.formatDuration(duration)}`;
        });
        
        // Mettre à jour l'état du bouton play/pause
        audioElement.addEventListener('play', () => {
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        audioElement.addEventListener('pause', () => {
            playButton.innerHTML = '<i class="fas fa-play"></i>';
        });
        
        // Mettre à jour l'affichage à la fin de la lecture
        audioElement.addEventListener('ended', () => {
            if (!audioElement.loop) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
                progressCurrent.style.width = '0%';
            }
        });
        
        // Démarrer la lecture si autoplay est activé
        if (audioElement.autoplay) {
            audioElement.play()
                .then(() => {
                    playButton.innerHTML = '<i class="fas fa-pause"></i>';
                })
                .catch(error => {
                    console.error('Erreur lors de la lecture audio automatique:', error);
                    // Ne pas afficher d'alerte pour l'autoplay, car cela peut être bloqué par le navigateur
                });
        }
        
        return container;
    }
}

// Gestionnaire audio global pour la musique de fond
class BackgroundAudioManager {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.audioUrl = null;
    }
    
    /**
     * Initialise ou met à jour la musique de fond
     * @param {string} url - URL du fichier audio
     * @param {Object} options - Options de configuration
     */
    initAudio(url, options = {}) {
        console.log('BackgroundAudioManager.initAudio appelé avec URL:', url);
        
        if (!url) {
            console.error('URL audio invalide');
            return;
        }
        
        this.audioUrl = url;
        
        // Si un audio est déjà en cours, sauvegarder sa position
        let currentTime = 0;
        let wasPlaying = false;
        
        if (this.audio) {
            currentTime = this.audio.currentTime;
            wasPlaying = !this.audio.paused;
            this.audio.pause();
            console.log('Audio existant mis en pause, position:', currentTime);
        }
        
        try {
            // Créer un nouvel élément audio
            this.audio = new Audio(url);
            
            // Ajouter un gestionnaire d'erreur
            this.audio.addEventListener('error', (e) => {
                console.error('Erreur lors du chargement de l\'audio:', e);
                alert('Erreur lors du chargement de la musique de fond. Veuillez vérifier l\'URL ou le fichier audio.');
            });
            
            // Configurer les options
            this.audio.loop = options.loop !== undefined ? options.loop : true;
            this.volume = options.volume !== undefined ? options.volume : this.volume;
            this.audio.volume = this.volume;
            
            console.log('Nouvel audio créé avec options:', {
                loop: this.audio.loop,
                volume: this.audio.volume,
                url: url
            });
            
            // Restaurer la position et l'état de lecture
            if (wasPlaying) {
                this.audio.currentTime = currentTime;
                this.play();
                console.log('Lecture audio reprise à la position:', currentTime);
            }
        } catch (error) {
            console.error('Exception lors de l\'initialisation de l\'audio:', error);
            alert('Erreur lors de l\'initialisation de la musique de fond: ' + error.message);
        }
    }
    
    /**
     * Joue la musique de fond
     */
    play() {
        if (!this.audio) return;
        
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                console.log('Musique de fond en lecture');
            })
            .catch(error => {
                console.error('Erreur lors de la lecture audio:', error);
                alert('Erreur lors de la lecture de la musique de fond. Veuillez vérifier l\'URL ou le fichier audio.');
            });
    }
    
    /**
     * Met en pause la musique de fond
     */
    pause() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isPlaying = false;
        console.log('Musique de fond en pause');
    }
    
    /**
     * Bascule entre lecture et pause
     * @returns {boolean} - Nouvel état de lecture (true = en lecture)
     */
    togglePlay() {
        if (!this.audio) return false;
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        
        return this.isPlaying;
    }
    
    /**
     * Règle le volume
     * @param {number} value - Volume (0-1)
     */
    setVolume(value) {
        this.volume = value;
        if (this.audio) {
            this.audio.volume = value;
        }
    }
    
    /**
     * Arrête la musique et réinitialise
     */
    stop() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }
    
    /**
     * Vérifie si un audio est chargé
     * @returns {boolean} - true si un audio est chargé
     */
    hasAudio() {
        return this.audio !== null && this.audioUrl !== null;
    }
    
    /**
     * Récupère l'URL de l'audio actuel
     * @returns {string|null} - URL de l'audio ou null
     */
    getAudioUrl() {
        return this.audioUrl;
    }
}

// Exporter les classes
export { AudioUtils, BackgroundAudioManager };
