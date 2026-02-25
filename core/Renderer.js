import { COLS, ROWS, HIDDEN_ROWS } from '../entities/Board.js';
import { TETROMINO_COLORS } from '../entities/Tetromino.js';

export class Renderer {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for no background transparency
        
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Internal logical resolution
        this.blockSize = 30;
        this.canvas.width = COLS * this.blockSize;
        this.canvas.height = ROWS * this.blockSize;
        
        // Dirty Rendering optimization: Offscreen static board
        this.staticCanvas = document.createElement('canvas');
        this.staticCanvas.width = this.canvas.width;
        this.staticCanvas.height = this.canvas.height;
        this.staticCtx = this.staticCanvas.getContext('2d', { alpha: false });
        this.isBoardDirty = true;
        
        this.initCanvasStyles();
    }

    initCanvasStyles() {
        // Handle High-DPI screens specifically for pixel-perfect sharpness
        const dpr = window.devicePixelRatio || 1;
        
        // Scale main canvas container but keep logical resolution for drawing
        // Provide the EXACT physical CSS properties so the canvas aspect ratio isn't squashed by Flexbox
        this.canvas.style.width = `${COLS * this.blockSize}px`;
        this.canvas.style.height = `${ROWS * this.blockSize}px`;
        this.canvas.style.minWidth = `${COLS * this.blockSize}px`;
        this.canvas.style.minHeight = `${ROWS * this.blockSize}px`;
        
        this.staticCtx.fillStyle = '#000000';
        this.staticCtx.fillRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
    }

    markBoardDirty() {
        this.isBoardDirty = true;
    }

    // Pre-renders the non-moving blocks so we don't redraw 200 blocks per frame
    renderStaticBoard(board) {
        if (!this.isBoardDirty) return;

        this.staticCtx.fillStyle = '#0b0c10'; // Matching bg-color
        this.staticCtx.fillRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);

        // Draw grid lines
        this.staticCtx.strokeStyle = 'rgba(69, 162, 158, 0.15)';
        this.staticCtx.lineWidth = 1;

        for (let x = 0; x <= COLS; x++) {
            this.staticCtx.beginPath();
            this.staticCtx.moveTo(x * this.blockSize, 0);
            this.staticCtx.lineTo(x * this.blockSize, this.staticCanvas.height);
            this.staticCtx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            this.staticCtx.beginPath();
            this.staticCtx.moveTo(0, y * this.blockSize);
            this.staticCtx.lineTo(this.staticCanvas.width, y * this.blockSize);
            this.staticCtx.stroke();
        }

        // Draw locked blocks
        for (let y = HIDDEN_ROWS; y < ROWS + HIDDEN_ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const type = board.getValue(x, y);
                if (type !== 0) {
                    this.drawBlock(this.staticCtx, x, y - HIDDEN_ROWS, type, 1.0);
                }
            }
        }
        
        this.isBoardDirty = false;
    }

    drawBlock(ctx, x, y, type, opacity = 1.0, isGhost = false) {
        if (y < 0) return; // Don't draw blocks in the hidden spawn zone

        const pxX = x * this.blockSize;
        const pxY = y * this.blockSize;
        const size = this.blockSize;

        // Base color
        ctx.fillStyle = TETROMINO_COLORS[type];
        
        if (isGhost) {
            ctx.globalAlpha = 0.3;
            // Ghost piece relies strictly on outline and transparency
            ctx.lineWidth = 2;
            ctx.strokeStyle = TETROMINO_COLORS[type];
            ctx.strokeRect(pxX + 1, pxY + 1, size - 2, size - 2);
        } else {
            ctx.globalAlpha = opacity;
            ctx.fillRect(pxX, pxY, size, size);

            // Inner glowing/glass highlight for premium feel
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(pxX, pxY, size, size / 4); // Top highlight
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(pxX, pxY + size - (size / 4), size, size / 4); // Bottom shadow
            
            // Add subtle separating border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(pxX, pxY, size, size);
        }

        ctx.globalAlpha = 1.0; // Reset
    }

    drawPiece(ctx, piece, drawY, isGhost = false, overrideAlpha = 1.0) {
        if (!piece) return;
        
        const matrix = piece.getMatrix();
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col]) {
                    this.drawBlock(ctx, piece.x + col, drawY + row - HIDDEN_ROWS, piece.type, overrideAlpha, isGhost);
                }
            }
        }
    }

    // Called every frame
    drawFrame(board, activePiece, ghostY, particles) {
        // 1. Draw static layer
        this.renderStaticBoard(board);
        this.ctx.drawImage(this.staticCanvas, 0, 0);

        // 2. Draw active play state
        if (activePiece) {
            // Drop Shadow/Ghost Piece
            this.drawPiece(this.ctx, activePiece, ghostY, true);

            // Actual Player Piece
            this.drawPiece(this.ctx, activePiece, activePiece.y, false);
        }

        // 3. Draw particles directly to main canvas
        this.drawParticles(this.ctx, particles);
    }

    drawParticles(ctx, particles) {
        if (!particles || particles.length === 0) return;
        
        // Fast batch render
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (!p.active) continue;

            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1.0;
    }

    // Draw Right Panel: Next Pieces
    drawNextQueue(queue) {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const previews = queue.getPreviews(3);
        const gap = 80; // Distance between previews
        let yOffset = 20;

        for (let i = 0; i < previews.length; i++) {
            const piece = previews[i];
            this.drawCenteredPiece(this.nextCtx, piece, this.nextCanvas.width / 2, yOffset + (i * gap));
        }
    }

    // Draw Left Panel: Hold Piece
    drawHold(piece) {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        if (piece) {
            this.drawCenteredPiece(this.holdCtx, piece, this.holdCanvas.width / 2, this.holdCanvas.height / 2);
        }
    }

    // Utility for panel drawing
    drawCenteredPiece(ctx, piece, centerX, centerY) {
        const matrix = piece.getMatrix();
        const bSize = 20; // Smaller block size for UI panels
        
        // Calculate bounding box of piece to strictly center it
        let minX = matrix.length, maxX = 0, minY = matrix.length, maxY = 0;
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c]) {
                    minX = Math.min(minX, c);
                    maxX = Math.max(maxX, c);
                    minY = Math.min(minY, r);
                    maxY = Math.max(maxY, r);
                }
            }
        }
        
        const width = (maxX - minX + 1) * bSize;
        const height = (maxY - minY + 1) * bSize;
        
        const startX = centerX - (width / 2) - (minX * bSize);
        const startY = centerY - (height / 2) - (minY * bSize);

        ctx.fillStyle = TETROMINO_COLORS[piece.type];
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c]) {
                    const px = startX + c * bSize;
                    const py = startY + r * bSize;
                    
                    ctx.fillRect(px, py, bSize, bSize);
                    // Minimal highlight for UI blocks
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(px, py, bSize, bSize / 4);
                    // Subtle border 
                    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, bSize, bSize);
                    
                    ctx.fillStyle = TETROMINO_COLORS[piece.type]; // restore base
                }
            }
        }
    }
}
