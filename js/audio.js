// Audio manager for the Pac-Man game

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.initialized = false;
    }

    /**
     * Initialize the audio manager and load all sounds
     */
    async init() {
        if (this.initialized) return;

        try {
            // Load sound effects
            await Promise.all([
                this.loadSound('start', 'assets/sounds/game_start.mp3'),
                this.loadSound('munch', 'assets/sounds/munch.mp3'),
                this.loadSound('death', 'assets/sounds/death.mp3'),
                this.loadSound('ghost', 'assets/sounds/eat_ghost.mp3'),
                this.loadSound('fruit', 'assets/sounds/eat_fruit.mp3'),
                this.loadSound('extra_life', 'assets/sounds/extend.mp3'),
                this.loadSound('siren', 'assets/sounds/siren.mp3'),
                this.loadSound('frightened', 'assets/sounds/frightened.mp3'),
                this.loadSound('ghost_returning', 'assets/sounds/retreating.mp3'),
                this.loadSound('intermission', 'assets/sounds/intermission.mp3')
            ]);

            // Load background music
            this.music = new Audio('assets/sounds/siren.mp3');
            this.music.loop = true;

            this.initialized = true;
            console.log('Audio manager initialized');
        } catch (error) {
            console.error('Error initializing audio manager:', error);
        }
    }

    /**
     * Load a sound file
     * @param {string} name - Name of the sound
     * @param {string} path - Path to the sound file
     * @returns {Promise} Promise that resolves when the sound is loaded
     */
    loadSound(name, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = path;
            
            audio.oncanplaythrough = () => {
                this.sounds[name] = audio;
                resolve();
            };
            
            audio.onerror = (error) => {
                console.error(`Error loading sound ${name}:`, error);
                reject(error);
            };
        });
    }

    /**
     * Play a sound effect
     * @param {string} name - Name of the sound to play
     * @param {boolean} loop - Whether to loop the sound
     * @returns {HTMLAudioElement|null} The audio element or null if sound not found
     */
    play(name, loop = false) {
        if (this.isMuted || !this.sounds[name]) return null;
        
        // Create a clone to allow overlapping sounds
        const sound = this.sounds[name].cloneNode();
        sound.loop = loop;
        sound.play().catch(error => console.error(`Error playing sound ${name}:`, error));
        
        return sound;
    }

    /**
     * Stop a specific sound
     * @param {HTMLAudioElement} sound - The sound to stop
     */
    stop(sound) {
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    /**
     * Play background music
     */
    playMusic() {
        if (this.isMuted || !this.music) return;
        
        this.music.play().catch(error => console.error('Error playing background music:', error));
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    /**
     * Pause background music
     */
    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }

    /**
     * Resume background music
     */
    resumeMusic() {
        if (!this.isMuted && this.music) {
            this.music.play().catch(error => console.error('Error resuming background music:', error));
        }
    }

    /**
     * Change the background music
     * @param {string} path - Path to the new music file
     */
    changeMusic(path) {
        this.stopMusic();
        this.music = new Audio(path);
        this.music.loop = true;
        
        if (!this.isMuted) {
            this.playMusic();
        }
    }

    /**
     * Mute all sounds
     */
    mute() {
        this.isMuted = true;
        this.stopMusic();
        
        // Stop all currently playing sounds
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }

    /**
     * Unmute all sounds
     */
    unmute() {
        this.isMuted = false;
    }

    /**
     * Toggle mute state
     * @returns {boolean} New mute state
     */
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        
        return this.isMuted;
    }
}

// Create and export a singleton instance
const audioManager = new AudioManager();
