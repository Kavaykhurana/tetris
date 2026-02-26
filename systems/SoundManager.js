export class SoundManager {
    constructor(storage) {
        this.storage = storage;
        this.audioCtx = null;
        this.masterGain = null;
        this.isMuted = this.storage ? this.storage.get('isMuted') : false;
        this.volume = this.storage ? this.storage.get('volume') : 0.5;
        this.initialized = false;
        this.bgmOscillator = null;
    }

    // Must be called upon user interaction (e.g. Start button or any tap)
    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        
        this.masterGain = this.audioCtx.createGain();
        this.setVolume(this.volume);
        
        this.masterGain.connect(this.audioCtx.destination);
        this.initialized = true;

        if (this.isMuted) {
            this.masterGain.gain.value = 0;
        }

        // Optional: Start silent background sequence to keep context awake on mobile
        this.playSilentPulse();
    }

    playSilentPulse() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    setVolume(vol) {
        this.volume = vol;
        if (this.storage) this.storage.set('volume', vol);
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        }
    }

    mute() {
        this.isMuted = true;
        if (this.storage) this.storage.set('isMuted', true);
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        }
    }

    unmute() {
        this.isMuted = false;
        if (this.storage) this.storage.set('isMuted', false);
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        }
    }

    // Generic synth runner
    playTone(frequency, type, duration, vol = 1, slideTo = null) {
        if (!this.initialized || this.audioCtx.state === 'suspended') return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.audioCtx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    // SFX Methods
    playMove() {
        // Light pop
        this.playTone(400, 'sine', 0.04, 0.3, 200);
    }

    playRotate() {
        // Short tick, slightly higher
        this.playTone(550, 'square', 0.05, 0.2, 450);
    }

    playSoftDrop() {
        // Low soft tick
        this.playTone(200, 'sine', 0.05, 0.3, 100);
    }

    playHardDrop() {
        // Satisfying deep thud: layered sawtooth and sine
        this.playTone(150, 'sawtooth', 0.15, 0.5, 30);
        this.playTone(100, 'sine', 0.15, 0.8, 20);
    }

    playLineClear() {
        // Happy little arpeggio
        this.playTone(523.25, 'sine', 0.2, 0.3); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.3), 50); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.4, 0.4, 1046.50), 100); // G5 -> C6
    }

    playTetrisClear() {
        // Triumphant Fanfare
        this.playTone(440, 'square', 0.1, 0.4); // A4
        setTimeout(() => this.playTone(440, 'square', 0.1, 0.4), 100); // A4
        setTimeout(() => this.playTone(440, 'square', 0.1, 0.4), 200); // A4
        setTimeout(() => this.playTone(587.33, 'square', 0.15, 0.4), 300); // D5
        setTimeout(() => this.playTone(523.25, 'square', 0.15, 0.4), 450); // C5
        setTimeout(() => this.playTone(659.25, 'sawtooth', 0.5, 0.6, 880), 600); // E5 -> A5
    }

    playTSpin() {
        // Magical spinning sound
        this.playTone(400, 'sine', 0.1, 0.5, 800);
        this.playTone(600, 'sine', 0.15, 0.4, 1200);
        setTimeout(() => this.playTone(800, 'triangle', 0.3, 0.6, 1600), 100);
    }

    playCombo(count) {
        // Increasingly hype ascending tones
        const baseFreq = 300;
        const jump = 60 * count;
        this.playTone(baseFreq + jump, 'square', 0.15, 0.4);
        setTimeout(() => this.playTone((baseFreq + jump) * 1.25, 'square', 0.2, 0.5), 80);
    }

    playLevelUp() {
        // Power up arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C Major
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'square', 0.15, 0.3), i * 60);
        });
    }

    playGameOver() {
        // Sad declining sequence
        this.playTone(400, 'sawtooth', 0.4, 0.5, 200);
        setTimeout(() => this.playTone(350, 'sawtooth', 0.4, 0.5, 150), 400);
        setTimeout(() => this.playTone(300, 'sawtooth', 1.0, 0.6, 50), 800);
    }
}
