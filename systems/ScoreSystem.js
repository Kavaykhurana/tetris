import { TETROMINO_TYPES } from '../entities/Tetromino.js';
import { COLS, ROWS, HIDDEN_ROWS } from '../entities/Board.js';

export const SCORE_EVENTS = {
    SINGLE: 'SINGLE',
    DOUBLE: 'DOUBLE',
    TRIPLE: 'TRIPLE',
    TETRIS: 'TETRIS',
    TSPIN_MINI: 'TSPIN_MINI',
    TSPIN_MINI_SINGLE: 'TSPIN_MINI_SINGLE',
    TSPIN: 'TSPIN',
    TSPIN_SINGLE: 'TSPIN_SINGLE',
    TSPIN_DOUBLE: 'TSPIN_DOUBLE',
    TSPIN_TRIPLE: 'TSPIN_TRIPLE'
};

export class ScoreSystem {
    constructor() {
        this.score = 0;
        this.combo = -1;
        this.backToBack = false;
        
        // Track the last action before a piece locks to validate T-Spins
        this.lastRotationResult = null; // Should be { success: true/false, kickIndex: n }
        this.lastMoveWasRotation = false; 
    }

    addSoftDrop(cells) {
        this.score += cells * 1;
    }

    addHardDrop(cells) {
        this.score += cells * 2;
    }

    evaluateLock(linesCleared, piece, board, level) {
        let isTSpin = false;
        let isMini = false;
        let eventType = null;
        let actionScore = 0;
        
        if (linesCleared > 0) {
            this.combo++;
        } else {
            this.combo = -1;
        }

        // T-Spin Detection Strategy: 3-Corner Rule
        if (piece.type === TETROMINO_TYPES.T && this.lastMoveWasRotation && this.lastRotationResult.success) {
            const corners = [
                {x: 0, y: 0}, {x: 2, y: 0}, // Top Left, Top Right
                {x: 0, y: 2}, {x: 2, y: 2}  // Bottom Left, Bottom Right
            ];
            
            let filledCorners = 0;
            let frontFilled = 0; // The two corners facing the flat side of the T
            let backFilled = 0;  // The two corners facing the pointy side of the T

            // T-Matrix centers rotation around 1,1. Flat side is top when at RotationIndex 0.
            const rot = piece.rotationIndex;

            corners.forEach(corner => {
                const cx = piece.x + corner.x;
                const cy = piece.y + corner.y;
                let isFilled = false;
                
                if (cx < 0 || cx >= COLS || cy >= ROWS + HIDDEN_ROWS) {
                    isFilled = true; // Walls and floor count as filled
                } else if (cy >= 0 && board.getValue(cx, cy) !== 0) {
                    isFilled = true;
                }

                if (isFilled) {
                    filledCorners++;
                    
                    // Determine if it's a front or back corner to detect Mini
                    // Back corners map based on rotation state
                    if (rot === 0 && corner.y === 0) frontFilled++;
                    else if (rot === 1 && corner.x === 2) frontFilled++;
                    else if (rot === 2 && corner.y === 2) frontFilled++;
                    else if (rot === 3 && corner.x === 0) frontFilled++;
                    else backFilled++;
                }
            });

            if (filledCorners >= 3) {
                isTSpin = true;
                // If front corners are missing (1 out of 2 filled), it might be a mini
                // Unless the final kick used was Kick #5 (index 4 in array), which promotes mini to full T-Spin
                if (frontFilled < 2 && this.lastRotationResult.kickIndex !== 4) {
                    isMini = true;
                }
            }
        }

        // Apply Scoring Rules (Guideline)
        const b2bMultiplier = this.backToBack ? 1.5 : 1.0;
        let isDifficultClear = false;

        if (isTSpin) {
            if (isMini) {
                switch(linesCleared) {
                    case 0: eventType = SCORE_EVENTS.TSPIN_MINI; actionScore = 100 * level; break;
                    case 1: eventType = SCORE_EVENTS.TSPIN_MINI_SINGLE; actionScore = 200 * level * b2bMultiplier; isDifficultClear = true; break;
                    // Mini Doubles are extremely rare/impossible without specific custom kicks, but usually scored as full if they happen
                    case 2: eventType = SCORE_EVENTS.TSPIN_DOUBLE; actionScore = 1200 * level * b2bMultiplier; isDifficultClear = true; break;
                }
            } else {
                switch(linesCleared) {
                    case 0: eventType = SCORE_EVENTS.TSPIN; actionScore = 400 * level; break; // Some guidelines have 400xLevel for 0 line T-spin
                    case 1: eventType = SCORE_EVENTS.TSPIN_SINGLE; actionScore = 800 * level * b2bMultiplier; isDifficultClear = true; break;
                    case 2: eventType = SCORE_EVENTS.TSPIN_DOUBLE; actionScore = 1200 * level * b2bMultiplier; isDifficultClear = true; break;
                    case 3: eventType = SCORE_EVENTS.TSPIN_TRIPLE; actionScore = 1600 * level * b2bMultiplier; isDifficultClear = true; break;
                }
            }
        } else {
            switch(linesCleared) {
                case 1: eventType = SCORE_EVENTS.SINGLE; actionScore = 100 * level; break;
                case 2: eventType = SCORE_EVENTS.DOUBLE; actionScore = 300 * level; break;
                case 3: eventType = SCORE_EVENTS.TRIPLE; actionScore = 500 * level; break;
                case 4: eventType = SCORE_EVENTS.TETRIS; actionScore = 800 * level * b2bMultiplier; isDifficultClear = true; break;
            }
        }

        // Combo bonus
        if (this.combo > 0) {
            actionScore += 50 * this.combo * level;
        }

        this.score += actionScore;

        // Maintain back-to-back chaining
        if (linesCleared > 0) {
            if (isDifficultClear) {
                this.backToBack = true;
            } else {
                this.backToBack = false;
            }
        }

        // Reset tracking vars for next piece lock cycle
        this.lastMoveWasRotation = false;

        return {
            points: actionScore,
            eventType,
            comboCount: this.combo,
            isB2B: this.backToBack && isDifficultClear
        };
    }

    reset() {
        this.score = 0;
        this.combo = -1;
        this.backToBack = false;
        this.lastMoveWasRotation = false;
        this.lastRotationResult = null;
    }
}
