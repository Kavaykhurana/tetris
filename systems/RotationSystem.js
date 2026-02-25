import { TETROMINO_TYPES } from '../entities/Tetromino.js';

// SRS offset data for J, L, S, T, Z pieces mapped as [N=0, E=1, S=2, W=3]
// The offsets map how you try to kick the piece if rotation fails at [dy, dx] (standard is [dx, -dy] but we map grid coordinates [x, y])
const JLSTZ_OFFSETS = [
    [ [0,0], [0,0], [0,0], [0,0], [0,0] ], // 0: Spawn State
    [ [0,0], [1,0], [1,-1], [0,2], [1,2] ], // 1: Right (E)
    [ [0,0], [0,0], [0,0], [0,0], [0,0] ], // 2: Double (S)
    [ [0,0], [-1,0], [-1,-1], [0,2], [-1,2] ] // 3: Left (W)
];

// SRS offset data for I piece
const I_OFFSETS = [
    [ [0,0], [-1,0], [2,0], [-1,0], [2,0] ], // 0: N
    [ [-1,0], [0,0], [0,0], [0,1], [0,-2] ], // 1: E
    [ [-1,1], [1,1], [-2,1], [1,0], [-2,0] ], // 2: S
    [ [0,1], [0,1], [0,1], [0,-1], [0,2] ] // 3: W
];

// O piece doesn't need kicks because it perfectly spins around center.

export class RotationSystem {
    constructor(board, collisionSystem) {
        this.board = board;
        this.collisionSystem = collisionSystem;
    }

    // Try rotating piece clockwise using SRS tables
    tryRotateCW(piece) {
        if (piece.type === TETROMINO_TYPES.O) {
            // No kicks for O, but we still check if the base rotate is valid
            piece.rotateCW();
            if (this.collisionSystem.isValidPosition(piece, piece.x, piece.y)) {
                return true;
            }
            piece.rotateCCW(); // Rollback
            return false;
        }

        const startIndex = piece.rotationIndex;
        const endIndex = piece.getNextRotationCW();
        return this.applyKicks(piece, startIndex, endIndex, true);
    }

    // Try rotating piece counter-clockwise using SRS tables
    tryRotateCCW(piece) {
        if (piece.type === TETROMINO_TYPES.O) {
            piece.rotateCCW();
            if (this.collisionSystem.isValidPosition(piece, piece.x, piece.y)) {
                return true;
            }
            piece.rotateCW();
            return false;
        }

        const startIndex = piece.rotationIndex;
        const endIndex = piece.getNextRotationCCW();
        return this.applyKicks(piece, startIndex, endIndex, false);
    }

    applyKicks(piece, startIndex, endIndex, isCW) {
        const offsetTable = piece.type === TETROMINO_TYPES.I ? I_OFFSETS : JLSTZ_OFFSETS;
        
        // Let's get the 5 kick tests. A kick is (offsetStart - offsetEnd)
        // Note: Coordinates in Guideline are usually +Y is up, but standard Canvas grid is +Y down.
        // The offsets below are mapped for +Y down (web grids)
        
        // We simulate the rotation
        if (isCW) {
            piece.rotateCW();
        } else {
            piece.rotateCCW();
        }

        for (let test = 0; test < 5; test++) {
            const startOffset = offsetTable[startIndex][test];
            const endOffset = offsetTable[endIndex][test];

            // Calculate translation for the kick
            // In SRS: translation = offset_from_start - offset_from_end
            // We use Y as inverted for screen coordinates, so negate Y offset diff
            let dx = startOffset[0] - endOffset[0];
            let dy = startOffset[1] - endOffset[1];
            
            // Adjusting dy because SRS guideline Y is "up", canvas Y is "down"
            dy = -dy; 

            if (this.collisionSystem.isValidPosition(piece, piece.x + dx, piece.y + dy)) {
                // Kick succeeded
                piece.x += dx;
                piece.y += dy;
                
                // Return T-Spin tracking data if this is a T-piece and it used a kick
                // (Useful for ScoreSystem later)
                return { success: true, kickIndex: test };
            }
        }

        // All 5 kicks failed, Revert Rotation
        if (isCW) {
            piece.rotateCCW();
        } else {
            piece.rotateCW();
        }

        return { success: false, kickIndex: -1 };
    }
}
