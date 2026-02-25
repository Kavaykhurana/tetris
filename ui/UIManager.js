import { GameStates } from '../core/StateMachine.js';

export class UIManager {
    constructor(game) {
        this.game = game; // Reference strictly for dispatching events/actions

        // DOM Elements
        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.linesDisplay = document.getElementById('lines-display');
        this.finalScoreDisplay = document.getElementById('final-score-display');
        
        // Screens
        this.screens = {
            [GameStates.MENU]: document.getElementById('menu-screen'),
            [GameStates.PAUSED]: document.getElementById('pause-screen'),
            [GameStates.GAME_OVER]: document.getElementById('game-over-screen'),
            [GameStates.SETTINGS]: document.getElementById('settings-screen')
        };
        
        // Touch Controls
        this.mobileControls = document.getElementById('mobile-controls');

        // Messages
        this.messageContainer = document.getElementById('message-container');

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.game.startNewGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.game.quitGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.startNewGame();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.game.openSettings();
        });

        document.getElementById('close-settings-btn').addEventListener('click', () => {
            this.game.closeSettings();
        });

        // Settings inputs
        const volumeSlider = document.getElementById('volume-slider');
        const muteToggle = document.getElementById('mute-toggle');
        
        volumeSlider.addEventListener('input', (e) => {
            if (this.game.soundManager) {
                this.game.soundManager.setVolume(parseFloat(e.target.value));
            }
        });

        muteToggle.addEventListener('change', (e) => {
            if (this.game.soundManager) {
                if (e.target.checked) this.game.soundManager.mute();
                else this.game.soundManager.unmute();
            }
        });
    }

    // Called on state transitions by the Game engine
    showScreen(state) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        // Show requested screen if exists
        const targetScreen = this.screens[state];
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Show/hide touch controls based on device support and game state
        if (state === GameStates.PLAYING && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            this.mobileControls.style.display = 'flex';
        } else {
            this.mobileControls.style.display = 'none';
        }
    }

    updateStats(score, level, lines) {
        // Fast DOM updates only when changed (handled by caller or minimal reflow)
        this.scoreDisplay.innerText = score;
        this.levelDisplay.innerText = level;
        this.linesDisplay.innerText = lines;
        
        // Pre-fill game over score
        this.finalScoreDisplay.innerText = score; 
    }

    showScrollingMessage(text, color = 'var(--accent-color)') {
        const msg = document.createElement('div');
        msg.className = 'floating-message';
        msg.innerText = text;
        msg.style.color = color;
        msg.style.position = 'absolute';
        msg.style.top = '50%';
        msg.style.left = '50%';
        msg.style.transform = 'translate(-50%, -50%)';
        msg.style.fontWeight = 'bold';
        msg.style.fontSize = '2rem';
        msg.style.textShadow = `0 0 10px ${color}, 0 0 20px #000`;
        msg.style.opacity = '1';
        msg.style.pointerEvents = 'none';
        msg.style.transition = 'all 1s ease-out';
        msg.style.zIndex = '100';

        this.messageContainer.appendChild(msg);

        // Animate up and fade out
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                msg.style.top = '30%';
                msg.style.opacity = '0';
            });
        });

        setTimeout(() => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 1000);
    }
}
