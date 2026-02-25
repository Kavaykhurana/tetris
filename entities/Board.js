// Board configuration
export const COLS = 10;
export const ROWS = 20;
export const HIDDEN_ROWS = 2; // Extra rows above the visible area for spawning pieces

export class Board {
    constructor() {
        // We use a 1D array to represent the 2D grid for efficiency. 
        // 0 = empty, else string color/type identifier
        this.grid = new Array(COLS * (ROWS + HIDDEN_ROWS)).fill(0);
    }

    reset() {
        this.grid.fill(0);
    }

    // Grid coordinates: x (0 to 9), y (0 to 21) where 0,1 are hidden
    getIndex(x, y) {
        return y * COLS + x;
    }

    getValue(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS + HIDDEN_ROWS) {
            return null; // Out of bounds
        }
        return this.grid[this.getIndex(x, y)];
    }

    setValue(x, y, value) {
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS + HIDDEN_ROWS) {
            this.grid[this.getIndex(x, y)] = value;
        }
    }

    // Lock a piece into the board grid
    lockPiece(piece) {
        const matrix = piece.getMatrix();
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col] !== 0) {
                    const boardX = piece.x + col;
                    const boardY = piece.y + row;
                    
                    // Do not lock out of bounds, preventing 1D array wrap-around warping
                    if (boardX >= 0 && boardX < COLS && boardY >= 0 && boardY < ROWS + HIDDEN_ROWS) {
                        this.setValue(boardX, boardY, piece.type);
                    }
                }
            }
        }
    }

    // Scan for and clear full lines, dropping everything above down
    // Returns array of exactly which lines were cleared (for animations/scoring)
    clearLines() {
        let linesCleared = [];
        let numCleared = 0;

        // Scan from bottom to top
        for (let y = ROWS + HIDDEN_ROWS - 1; y >= 0; y--) {
            let isLineFull = true;
            for (let x = 0; x < COLS; x++) {
                if (this.getValue(x, y) === 0) {
                    isLineFull = false;
                    break;
                }
            }

            if (isLineFull) {
                linesCleared.push(y);
                numCleared++;
            } else if (numCleared > 0) {
                // Shift this line down by numCleared
                for (let x = 0; x < COLS; x++) {
                    const value = this.getValue(x, y);
                    this.setValue(x, y + numCleared, value);
                    // Clear the old position
                    this.setValue(x, y, 0); 
                }
            }
        }

        // Return number of cleared lines for scoring purposes, plus indices for row animation
        return { count: numCleared, indices: linesCleared };
    }

    getState() {
        return [...this.grid];
    }

    setState(newState) {
        this.grid = [...newState];
    }
}
