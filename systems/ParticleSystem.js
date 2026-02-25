import { TETROMINO_COLORS } from '../entities/Tetromino.js';

class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = '#fff';
        this.active = false;
    }

    spawn(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        
        this.x += this.vx * (dt / 16.6); // Scale to reference 60fps frame
        this.y += this.vy * (dt / 16.6);
        this.vy += 0.5 * (dt / 16.6); // Gravity

        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }
}

export class ParticleSystem {
    constructor(poolSize = 500) {
        // Pre-allocate object pool
        this.particles = Array.from({ length: poolSize }, () => new Particle());
        this.poolIndex = 0;
    }

    update(dt) {
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].update(dt);
            }
        }
    }

    getParticles() {
        return this.particles;
    }

    // Emits a burst of particles uniformly across a cleared line
    emitLineClear(yIndex, blockSize, boardCols) {
        // The yIndex should be relative to canvas (yIndex - HIDDEN_ROWS)
        const py = yIndex * blockSize;
        
        for (let x = 0; x < boardCols; x++) {
            const px = x * blockSize;
            
            // Generate 4-5 particles per block
            for (let i = 0; i < 5; i++) {
                const p = this.particles[this.poolIndex];
                
                // Random velocities outward
                const vx = (Math.random() - 0.5) * 10;
                const vy = (Math.random() - 1.0) * 10; // Bias upward
                const life = 300 + Math.random() * 300; // ms
                const size = 3 + Math.random() * 4;
                
                // Color: Use an array of neon colors
                const colors = Object.values(TETROMINO_COLORS);
                const color = colors[Math.floor(Math.random() * colors.length)];

                p.spawn(px + blockSize/2, py + blockSize/2, vx, vy, life, size, color);
                
                this.poolIndex = (this.poolIndex + 1) % this.particles.length;
            }
        }
    }

    // Emits particles directly at a block (e.g., Hard Drop impact)
    emitDropDust(x, y, blockSize, color) {
        const px = x * blockSize;
        const py = y * blockSize + blockSize; // Bottom edge

        for (let i = 0; i < 4; i++) {
            const p = this.particles[this.poolIndex];
            const vx = (Math.random() - 0.5) * 6; // Spread sideways
            const vy = -(Math.random() * 3); // Bounce up slightly
            
            p.spawn(px + blockSize/2, py, vx, vy, 200, 4, color);
            this.poolIndex = (this.poolIndex + 1) % this.particles.length;
        }
    }
}
