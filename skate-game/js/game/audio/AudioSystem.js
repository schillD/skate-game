export class AudioSystem {
    constructor() {
        this.bgMusic = null;
        this.isMuted = false;
        this.volume = 0.5; // Default volume at 50%
        this.initialized = false;
        this.audioContext = null;
        this.oscillator = null;
        this.useSynthesizedAudio = true; // Always use synthesized audio
    }

    initialize() {
        if (this.initialized) return;
        
        // Create audio context for fallback audio
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API not supported in this browser");
        }
        
        // Start with synthesized audio directly
        this.createFallbackAudio();
        
        // Add UI controls for music
        this.createMusicControls();
        
        this.initialized = true;
    }
    
    createFallbackAudio() {
        if (!this.audioContext) return;
        
        // Create a simple synthesized music pattern
        this.oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configure oscillator
        this.oscillator.type = 'triangle';
        this.oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
        
        // Connect nodes
        this.oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set volume
        gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        
        // Create a rhythmic pattern
        this.createRhythmicPattern(gainNode);
    }
    
    createRhythmicPattern(gainNode) {
        // Create a simple rhythmic pattern by modulating volume
        const now = this.audioContext.currentTime;
        const tempo = 0.5; // Time per beat in seconds
        
        // Create a repeating pattern
        for (let i = 0; i < 16; i++) {
            const beatTime = now + i * tempo;
            // Volume envelope
            if (i % 4 === 0) {
                // Accent on every 4th beat
                gainNode.gain.setValueAtTime(this.volume * 0.3, beatTime);
                gainNode.gain.exponentialRampToValueAtTime(this.volume * 0.1, beatTime + tempo * 0.8);
            } else {
                gainNode.gain.setValueAtTime(this.volume * 0.15, beatTime);
                gainNode.gain.exponentialRampToValueAtTime(this.volume * 0.05, beatTime + tempo * 0.8);
            }
            
            // Change pitch occasionally
            if (i % 8 === 0) {
                this.oscillator.frequency.setValueAtTime(220, beatTime); // A3
            } else if (i % 8 === 4) {
                this.oscillator.frequency.setValueAtTime(262, beatTime); // C4
            }
        }
        
        // Loop the pattern by recursively calling this function
        setTimeout(() => {
            if (!this.isMuted && this.oscillator) {
                this.createRhythmicPattern(gainNode);
            }
        }, tempo * 16 * 1000);
    }
    
    createMusicControls() {
        // Create a simple music control interface
        const musicControls = document.createElement('div');
        musicControls.id = 'musicControls';
        musicControls.style.position = 'fixed';
        musicControls.style.bottom = '10px';
        musicControls.style.right = '10px';
        musicControls.style.background = 'rgba(0, 0, 0, 0.7)';
        musicControls.style.padding = '10px';
        musicControls.style.borderRadius = '5px';
        musicControls.style.color = 'white';
        musicControls.style.fontFamily = 'Arial, sans-serif';
        musicControls.style.zIndex = '1000';
        
        // Toggle music button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Music: ON';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.marginRight = '10px';
        toggleButton.style.cursor = 'pointer';
        
        toggleButton.addEventListener('click', () => {
            this.toggleMute();
            toggleButton.textContent = this.isMuted ? 'Music: OFF' : 'Music: ON';
        });
        
        // Volume slider
        const volumeControl = document.createElement('input');
        volumeControl.type = 'range';
        volumeControl.min = '0';
        volumeControl.max = '1';
        volumeControl.step = '0.1';
        volumeControl.value = this.volume.toString();
        volumeControl.style.verticalAlign = 'middle';
        
        volumeControl.addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });
        
        // Add controls to the container
        musicControls.appendChild(toggleButton);
        musicControls.appendChild(volumeControl);
        
        // Add to document
        document.body.appendChild(musicControls);
    }
    
    playMusic() {
        if (!this.initialized) this.initialize();
        
        // Use synthesized audio only
        if (this.oscillator && !this.isMuted) {
            try {
                this.oscillator.start();
            } catch (e) {
                console.log('Oscillator already started or unavailable');
            }
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Only handle the oscillator
        if (this.audioContext) {
            if (this.isMuted && this.oscillator) {
                try {
                    this.oscillator.stop();
                    this.oscillator = null;
                } catch (e) {
                    console.log('Error stopping oscillator');
                }
            } else if (!this.isMuted) {
                this.createFallbackAudio();
                try {
                    this.oscillator.start();
                } catch (e) {
                    console.log('Oscillator start failed');
                }
            }
        }
    }
    
    setVolume(value) {
        this.volume = value;
        // Recreate the audio pattern with the new volume
        if (this.oscillator && !this.isMuted) {
            // Note: We don't need to do anything here since the volume is applied
            // when creating new gain patterns, which happens periodically anyway
        }
    }
}