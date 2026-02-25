export class LevelSystem {
    constructor() {
        this.level = 1;
        this.linesCleared = 0;
        this.linesToNextLevel = 10;
        this.gravity = this.calculateGravity(1);
        this.lockDelay = 500; // ms
        this.maxLockResets = 15;
    }

    addLines(lines) {
        this.linesCleared += lines;
        
        const newLevel = Math.floor(this.linesCleared / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.gravity = this.calculateGravity(this.level);
            return true; // Leveled up
        }
        return false;
    }

    // Calculates the lock delay timer length.
    getLockDelay() {
        return this.lockDelay;
    }

    // Returns gravity in frames per line based on 60FPS tick.
    // Converted to seconds/line here: Frames / 60
    // Standard Guideline Fall Speed
    calculateGravity(level) {
        // Known fixed table for modern Guideline:
        const table = [
            1.00000, 0.79300, 0.61780, 0.47273, 0.35520, 
            0.26200, 0.18968, 0.13473, 0.09388, 0.06415, 
            0.04298, 0.02822, 0.01815, 0.01144, 0.00706  // Level 1-15 speeds in seconds/cell
        ];
        
        let targetLevel = level;
        if (targetLevel < 1) targetLevel = 1;
        if (targetLevel > 15) {
            // Speed caps or continues asymptotically in standard Tetris. 
            // 20G behavior is standard past certain limits (drops instantly) where lock delay is the only survival mechanic.
            if (targetLevel >= 20) {
                return 0; // 20G implementation (Instant bottoming logic is handled in the Game Engine tick)
            }
            return table[14]; // Cap speed between 15-19
        }
        
        return table[targetLevel - 1]; // Return seconds taken to drop 1 row
    }

    reset() {
        this.level = 1;
        this.linesCleared = 0;
        this.gravity = this.calculateGravity(1);
    }
}
