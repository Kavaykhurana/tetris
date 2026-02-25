export class StorageManager {
    constructor() {
        this.prefix = 'tetris_v1_';
        
        // Defaults
        this.data = {
            highScore: 0,
            highLevel: 1,
            volume: 0.5,
            isMuted: false,
            // Example: bindings customizer could go here
        };

        this.load();
    }

    load() {
        try {
            for (const key in this.data) {
                const item = localStorage.getItem(this.prefix + key);
                if (item !== null) {
                    this.data[key] = JSON.parse(item);
                }
            }
        } catch (e) {
            console.error("Local storage error on load. Overriden with defaults.", e);
        }
    }

    save() {
        try {
            for (const [key, value] of Object.entries(this.data)) {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
            }
        } catch (e) {
            console.error("Local storage error on save. Ensure quotas aren't exceeded.", e);
        }
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    updateHighScore(score) {
        if (score > this.data.highScore) {
            this.set('highScore', score);
            return true; // Indicates new high score
        }
        return false;
    }

    updateHighLevel(level) {
        if (level > this.data.highLevel) {
            this.set('highLevel', level);
        }
    }
}
