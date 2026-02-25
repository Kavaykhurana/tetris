import { StateMachine, GameStates } from './StateMachine.js';
import { Renderer } from './Renderer.js';
import { Board } from '../entities/Board.js';
import { InputManager, InputActions } from '../systems/InputManager.js';
import { PieceQueue } from '../systems/PieceQueue.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { RotationSystem } from '../systems/RotationSystem.js';
import { ScoreSystem, SCORE_EVENTS } from '../systems/ScoreSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { SoundManager } from '../systems/SoundManager.js';
import { StorageManager } from '../systems/StorageManager.js';
import { UIManager } from '../ui/UIManager.js';
import { MobileControls } from '../ui/MobileControls.js';

export class Game {
    constructor() {
        // Architecture & State
        this.state = new StateMachine();
        
        // Data & Logic layer
        this.board = new Board();
        this.collision = new CollisionSystem(this.board);
        this.rotation = new RotationSystem(this.board, this.collision);
        this.pieceQueue = new PieceQueue();
        
        // Progression
        this.levelSystem = new LevelSystem();
        this.scoreSystem = new ScoreSystem();
        
        // Subsystems
        this.storage = new StorageManager();
        this.input = new InputManager();
        this.soundManager = new SoundManager(this.storage);
        this.particleSystem = new ParticleSystem(500);
        this.renderer = new Renderer();
        this.ui = new UIManager(this);
        this.mobileControls = new MobileControls(this.input);

        // Frame timing
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.tickRate = 1000 / 60; // 60Hz logic loop
        this.animationFrameId = null;

        // Current Piece State
        this.activePiece = null;
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.isLocking = false;
        this.lockResets = 0;

        // DAS / ARR (Delayed Auto Shift / Auto Repeat Rate) - Standard Guideline rules
        this.dasDelay = 150; // ms before auto-repeat kicks in
        this.arrRate = 33;   // ms per repeated move
        this.dasTimer = 0;

        this.loop = this.loop.bind(this);
    }

    init() {
        console.log("[Game] Initializing Engine...");
        this.state.onStateChange((newState, oldState) => this.handleStateTransition(newState, oldState));
        this.state.change(GameStates.MENU);
        
        // Init UI with high score
        const hs = this.storage.get('highScore');
        if (hs > 0) {
            this.ui.scoreDisplay.innerText = `High: ${hs}`;
        }

        this.start();
    }

    handleStateTransition(newState, oldState) {
        this.ui.showScreen(newState);

        if (newState === GameStates.PLAYING && oldState === GameStates.MENU) {
            // Fresh Game
            this.board.reset();
            this.pieceQueue.reset();
            this.scoreSystem.reset();
            this.levelSystem.reset();
            this.spawnPiece();
            this.renderer.markBoardDirty();
            this.ui.updateStats(0, 1, 0);
            this.soundManager.init(); // Must activate on user interaction
        }

        if (newState === GameStates.GAME_OVER) {
            this.soundManager.playGameOver();
            this.ui.updateStats(this.scoreSystem.score, this.levelSystem.level, this.levelSystem.linesCleared);
            if (this.storage.updateHighScore(this.scoreSystem.score)) {
                this.ui.showScrollingMessage("NEW HIGHSCORE!", "#ff00ff");
            }
        }
    }

    /* --- Public API for UI / Buttons --- */
    startNewGame() {
        // Allow restarting directly from pause or game over
        this.soundManager.init();
        this.state.change(GameStates.MENU); // Force cycle to trigger fresh init
        this.state.change(GameStates.PLAYING);
    }
    resumeGame() {
        if (this.state.isPaused()) {
            this.state.change(GameStates.PLAYING);
        }
    }
    quitGame() {
        this.state.change(GameStates.MENU);
    }
    openSettings() {
        this.state.change(GameStates.SETTINGS);
    }
    closeSettings() {
        this.state.revert();
    }

    /* --- Engine Loop --- */
    start() {
        if (!this.animationFrameId) {
            this.lastTime = performance.now();
            this.animationFrameId = requestAnimationFrame(this.loop);
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop(currentTime) {
        this.animationFrameId = requestAnimationFrame(this.loop);
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Prevent spiral of death on lag / tab switch
        if (deltaTime > 250) {
            return;
        }

        // Catch Pause inputs gracefully across all states 
        this.input.update(); // Poll inputs once per logical frame

        if (this.state.isPlaying() && this.input.isJustPressed(InputActions.PAUSE)) {
            this.state.change(GameStates.PAUSED);
            this.input.consumeAction(InputActions.PAUSE);
        } else if (this.state.isPaused() && this.input.isJustPressed(InputActions.PAUSE)) {
            this.state.change(GameStates.PLAYING);
            this.input.consumeAction(InputActions.PAUSE);
        }

        this.accumulator += deltaTime;
        while (this.accumulator >= this.tickRate) {
            this.update(this.tickRate);
            this.accumulator -= this.tickRate;
        }

        this.render(this.accumulator / this.tickRate);
    }

    update(dt) {
        if (this.state.isPlaying()) {
            this.processInput(dt);
            this.updateGravity(dt);
            this.particleSystem.update(dt);
        }
    }

    render(alpha) {
        // Redraw regardless of state so pause menu overlaps cleanly
        let ghostY = this.activePiece ? this.collision.getGhostPositionY(this.activePiece) : 0;
        this.renderer.drawFrame(this.board, this.state.isPlaying() ? this.activePiece : null, ghostY, this.particleSystem.getParticles());
        this.renderer.drawNextQueue(this.pieceQueue);
        this.renderer.drawHold(this.pieceQueue.holdPiece);
    }

    /* --- Core Gameplay Logic --- */
    spawnPiece() {
        this.activePiece = this.pieceQueue.getNext();
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.isLocking = false;
        this.lockResets = 0;

        if (this.collision.isSpawnBlocked(this.activePiece)) {
            // Top out (Game Over)
            this.state.change(GameStates.GAME_OVER);
            this.activePiece = null;
        }
    }

    processInput(dt) {
        if (!this.activePiece) return;

        // HOLD
        if (this.input.isJustPressed(InputActions.HOLD)) {
            const spawnedPiece = this.pieceQueue.swapHold(this.activePiece);
            if (spawnedPiece) {
                this.activePiece = spawnedPiece;
                this.dropTimer = 0;
                this.scoreSystem.lastMoveWasRotation = false;
            }
        }

        // ROTATION
        if (this.input.isJustPressed(InputActions.ROTATE_CW)) {
            const rotData = this.rotation.tryRotateCW(this.activePiece);
            if (rotData) this.onPieceMoved(rotData);
        } else if (this.input.isJustPressed(InputActions.ROTATE_CCW)) {
            const rotData = this.rotation.tryRotateCCW(this.activePiece);
            if (rotData) this.onPieceMoved(rotData);
        }

        // MOVEMENT (with DAS/ARR calculation)
        let dx = 0;
        const leftDown = this.input.isDown(InputActions.LEFT);
        const rightDown = this.input.isDown(InputActions.RIGHT);

        if (this.input.isJustPressed(InputActions.LEFT)) this.activeDir = -1;
        else if (this.input.isJustPressed(InputActions.RIGHT)) this.activeDir = 1;

        if (leftDown && !rightDown) this.activeDir = -1;
        else if (rightDown && !leftDown) this.activeDir = 1;

        if (leftDown || rightDown) {
            dx = this.activeDir || 0;
        } else {
            this.activeDir = 0;
        }

        if (dx !== 0) {
            const isJustPressed = (dx === -1 && this.input.isJustPressed(InputActions.LEFT)) || 
                                  (dx === 1 && this.input.isJustPressed(InputActions.RIGHT));
            
            if (isJustPressed) {
                // Initial move
                if (this.tryMove(dx, 0)) {
                    this.onPieceMoved(null);
                }
                this.dasTimer = 0;
            } else {
                // Held down
                this.dasTimer += dt;
                while (this.dasTimer >= this.dasDelay) {
                    if (this.tryMove(dx, 0)) {
                        this.onPieceMoved(null);
                    }
                    if (this.arrRate <= 0) {
                        while (this.tryMove(dx, 0)) {}
                        break;
                    } else {
                        this.dasTimer -= this.arrRate; // Repeat rate
                    }
                }
            }
        } else {
            this.dasTimer = 0;
        }

        // HARD DROP
        if (this.input.isJustPressed(InputActions.HARD_DROP)) {
            let cellsDropped = 0;
            while (this.tryMove(0, 1)) {
                cellsDropped++;
            }
            this.scoreSystem.addHardDrop(cellsDropped);
            this.soundManager.playHardDrop();
            this.particleSystem.emitDropDust(this.activePiece.x, this.activePiece.y, this.renderer.blockSize, this.activePiece.color);
            this.lockPiece();
        } 
        // SOFT DROP
        else if (this.input.isDown(InputActions.SOFT_DROP)) {
            if (this.tryMove(0, 1)) {
                this.scoreSystem.addSoftDrop(1);
                this.soundManager.playSoftDrop();
                this.dropTimer = 0; // Reset gravity
            }
        }
    }

    tryMove(dx, dy) {
        if (this.collision.isValidPosition(this.activePiece, this.activePiece.x + dx, this.activePiece.y + dy)) {
            this.activePiece.x += dx;
            this.activePiece.y += dy;
            return true;
        }
        return false;
    }

    onPieceMoved(rotData) {
        this.soundManager.playMove();
        
        if (rotData) {
            this.scoreSystem.lastMoveWasRotation = true;
            this.scoreSystem.lastRotationResult = rotData;
        } else {
            this.scoreSystem.lastMoveWasRotation = false;
        }

        // Reset lock timer if valid move (max out to prevent endless stalling)
        if (this.isLocking && this.lockResets < this.levelSystem.maxLockResets) {
            this.lockTimer = 0;
            this.lockResets++;
        }
    }

    updateGravity(dt) {
        if (!this.activePiece) return;

        const maxFallMs = this.levelSystem.gravity * 1000; // Convert seconds to ms
        const isFloorDirectlyBelow = !this.collision.isValidPosition(this.activePiece, this.activePiece.x, this.activePiece.y + 1);

        // Instant drop / 20G handling
        if (maxFallMs === 0) {
            while (this.tryMove(0, 1)) {} 
        } else {
            this.dropTimer += dt;
            if (this.dropTimer >= maxFallMs) {
                this.dropTimer -= maxFallMs;
                this.tryMove(0, 1);
            }
        }

        if (isFloorDirectlyBelow) {
            this.isLocking = true;
            this.lockTimer += dt;
            if (this.lockTimer >= this.levelSystem.getLockDelay()) {
                this.lockPiece();
            }
        } else {
            this.isLocking = false;
            this.lockTimer = 0;
        }
    }

    lockPiece() {
        this.board.lockPiece(this.activePiece);
        this.renderer.markBoardDirty();

        const { count, indices } = this.board.clearLines();
        
        // Evaluate Score
        const evalScore = this.scoreSystem.evaluateLock(count, this.activePiece, this.board, this.levelSystem.level);
        
        // Feedbacks
        if (count > 0) {
            indices.forEach(idx => this.particleSystem.emitLineClear(idx - 2, this.renderer.blockSize, 10)); // -2 because HIDDEN_ROWS
            this.renderer.markBoardDirty();
            
            if (count === 4) this.soundManager.playTetrisClear();
            else this.soundManager.playLineClear();

            const leveledUp = this.levelSystem.addLines(count);
            if (leveledUp) this.soundManager.playLevelUp();

            this.ui.updateStats(this.scoreSystem.score, this.levelSystem.level, this.levelSystem.linesCleared);
        }

        if (evalScore.eventType === SCORE_EVENTS.TSPIN) {
            this.soundManager.playTSpin();
            this.ui.showScrollingMessage("T-SPIN!", "var(--tetris-purple)");
        } else if (evalScore.eventType === SCORE_EVENTS.TSPIN_SINGLE || evalScore.eventType === SCORE_EVENTS.TSPIN_DOUBLE || evalScore.eventType === SCORE_EVENTS.TSPIN_TRIPLE) {
            this.soundManager.playTSpin();
            this.ui.showScrollingMessage(evalScore.eventType.replace('_', ' '), "var(--tetris-purple)");
        } else if (count === 4) {
            this.ui.showScrollingMessage("TETRIS!", "var(--tetris-cyan)");
        }

        if (evalScore.comboCount > 0) {
            this.soundManager.playCombo(evalScore.comboCount);
            this.ui.showScrollingMessage(`${evalScore.comboCount} COMBO!`, "var(--tetris-orange)");
        }
        
        if (evalScore.isB2B) {
            this.ui.showScrollingMessage("BACK-TO-BACK", "var(--tetris-red)");
        }

        this.spawnPiece();
    }
}
