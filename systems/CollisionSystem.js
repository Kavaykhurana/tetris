import { COLS, ROWS, HIDDEN_ROWS } from '../entities/Board.js';

export class CollisionSystem {
    constructor(board) {
        this.board = board;
    }

    // Checks if the piece geometry at generic x/y overlaps with board blocks or borders
    isValidPosition(piece, testX, testY) {
        const matrix = piece.getMatrix();

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                // Only check filled blocks in the tetromino matrix
                if (matrix[row][col] !== 0) {
                    const currentX = testX + col;
                    const currentY = testY + row;

                    // Bounds Check: Walls
                    if (currentX < 0 || currentX >= COLS) {
                        return false;
                    }

                    // Bounds Check: Floor
                    if (currentY >= ROWS + HIDDEN_ROWS) {
                        return false;
                    }

                    // Ignore overlap checks above the board (hidden area top)
                    if (currentY < 0) {
                        continue;
                    }

                    // Collision Check: Existing blocks on the board
                    if (this.board.getValue(currentX, currentY) !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Drops the piece virtually until it hits something and returns that Y. Used for Ghost Piece.
    getGhostPositionY(piece) {
        let ghostY = piece.y;
        while (this.isValidPosition(piece, piece.x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    // Determines if a piece is locked out (spawn blocked) -> Game Over condition
    isSpawnBlocked(piece) {
        return !this.isValidPosition(piece, piece.x, piece.y);
    }
}
