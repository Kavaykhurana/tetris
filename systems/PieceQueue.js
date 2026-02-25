import { Tetromino, TETROMINO_TYPES } from '../entities/Tetromino.js';

export class PieceQueue {
    constructor() {
        this.queue = [];
        this.holdPiece = null;
        this.hasHeldThisTurn = false;

        // Initialize queue with 2 bags so we always have enough previews
        this.fillBag();
        this.fillBag();
    }

    fillBag() {
        // Standard 7-bag randomizer
        const bag = Object.values(TETROMINO_TYPES);
        
        // Fisher-Yates Shuffle
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        
        // Enqueue the shuffled types as fresh Tetromino instances
        for (const type of bag) {
            this.queue.push(new Tetromino(type));
        }
    }

    // Fetch next piece and maintain minimum queue size (typically show 3-5 next pieces)
    getNext() {
        const next = this.queue.shift();
        
        if (this.queue.length <= 7) {
            this.fillBag();
        }

        this.hasHeldThisTurn = false; // Reset hold lock
        
        return next;
    }

    getPreviews(count = 3) {
        return this.queue.slice(0, count);
    }

    // Returns piece to spawn (either a swapped piece or a new next piece from queue)
    swapHold(currentPiece) {
        if (this.hasHeldThisTurn) {
            return null; // Cannot hold twice consecutively without placing
        }

        const toHold = new Tetromino(currentPiece.type); // Create fresh instance without rotation history
        let newlyActive;

        if (this.holdPiece === null) {
            newlyActive = this.getNext(); // First time holding
        } else {
            newlyActive = new Tetromino(this.holdPiece.type);
        }

        this.holdPiece = toHold;
        this.hasHeldThisTurn = true;

        return newlyActive; // Returns the piece that should now be the player's active piece
    }

    reset() {
        this.queue = [];
        this.fillBag();
        this.fillBag();
        this.holdPiece = null;
        this.hasHeldThisTurn = false;
    }
}
