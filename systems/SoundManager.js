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
        this.playTone(300, 'sine', 0.05, 0.5);
    }

    playRotate() {
        this.playTone(400, 'square', 0.05, 0.3);
    }

    playSoftDrop() {
        this.playTone(150, 'sine', 0.05, 0.4);
    }

    playHardDrop() {
        this.playTone(100, 'sawtooth', 0.15, 0.8, 50);
    }

    playLineClear() {
        this.playTone(800, 'square', 0.2, 0.5, 1200);
        setTimeout(() => this.playTone(1200, 'sine', 0.3, 0.5), 100);
    }

    playTetrisClear() {
        this.playTone(400, 'square', 0.1, 0.6);
        setTimeout(() => this.playTone(600, 'square', 0.1, 0.6), 100);
        setTimeout(() => this.playTone(800, 'square', 0.1, 0.6), 200);
        setTimeout(() => this.playTone(1200, 'sawtooth', 0.5, 0.8, 2000), 300);
    }

    playTSpin() {
        this.playTone(600, 'sine', 0.1, 0.6, 900);
        setTimeout(() => this.playTone(900, 'sine', 0.3, 0.8, 1200), 100);
    }

    playCombo(count) {
        // Pitch goes up with combo
        const baseFreq = 400;
        const freq = baseFreq + (count * 50);
        this.playTone(freq, 'triangle', 0.2 + (count * 0.02), 0.6);
    }

    playLevelUp() {
        [400, 500, 600, 800, 1000].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'square', 0.2, 0.5), i * 100);
        });
    }

    playGameOver() {
        this.playTone(300, 'sawtooth', 0.3, 0.8, 100);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.8, 50), 300);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.8, 0.8, 20), 600);
    }
}
