export const InputActions = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    SOFT_DROP: 'SOFT_DROP',
    HARD_DROP: 'HARD_DROP',
    ROTATE_CW: 'ROTATE_CW',
    ROTATE_CCW: 'ROTATE_CCW',
    HOLD: 'HOLD',
    PAUSE: 'PAUSE',
    UI_CONFIRM: 'UI_CONFIRM',
    UI_BACK: 'UI_BACK',
    UI_UP: 'UI_UP',
    UI_DOWN: 'UI_DOWN'
};

export class InputManager {
    constructor() {
        this.keys = new Map();
        this.actions = new Map();
        
        // Polling states vs Event Driven
        this.actionState = new Map();
        this.lastActionState = new Map();
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.swipeThreshold = 30; // Min px to count as swipe
        this.isSwiping = false;

        this.bindDefaults();
        this.attachEventListeners();
    }

    bindDefaults() {
        // Default Keyboard Bindings
        this.keys.set('ArrowLeft', InputActions.LEFT);
        this.keys.set('ArrowRight', InputActions.RIGHT);
        this.keys.set('ArrowDown', InputActions.SOFT_DROP);
        this.keys.set('ArrowUp', InputActions.ROTATE_CW); 
        this.keys.set('Shift', InputActions.HARD_DROP);
        this.keys.set(' ', InputActions.PAUSE); 
        
        this.keys.set('x', InputActions.ROTATE_CW);
        this.keys.set('z', InputActions.ROTATE_CCW);
        this.keys.set('c', InputActions.HOLD);
        
        this.keys.set('Escape', InputActions.PAUSE);
        this.keys.set('Enter', InputActions.UI_CONFIRM);

        // UI nav
        this.keys.set('w', InputActions.UI_UP);
        this.keys.set('s', InputActions.UI_DOWN);
    }

    attachEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Touch Swipe
        const board = document.getElementById('board-container');
        if (board) {
            board.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            board.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            board.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        }

        // On-screen buttons (bound later or directly via UI manager, but we expose an API)
        const uiBindings = {
            'btn-left': InputActions.LEFT,
            'btn-right': InputActions.RIGHT,
            'btn-soft-drop': InputActions.SOFT_DROP,
            'btn-hard-drop': InputActions.HARD_DROP,
            'btn-rotate-cw': InputActions.ROTATE_CW,
            'btn-rotate-ccw': InputActions.ROTATE_CCW,
            'btn-hold': InputActions.HOLD
        };

        for (const [id, action] of Object.entries(uiBindings)) {
            const el = document.getElementById(id);
            if (el) {
                // To prevent delay on mobile browsers
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.triggerAction(action, true);
                });
                el.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.triggerAction(action, false);
                });
            }
        }
    }

    handleKeyDown(e) {
        if (this.keys.has(e.key) || this.keys.has(e.key.toLowerCase())) {
            const action = this.keys.get(e.key) || this.keys.get(e.key.toLowerCase());
            this.triggerAction(action, true);
            // Prevent scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        }
    }

    handleKeyUp(e) {
        if (this.keys.has(e.key) || this.keys.has(e.key.toLowerCase())) {
            const action = this.keys.get(e.key) || this.keys.get(e.key.toLowerCase());
            this.triggerAction(action, false);
        }
    }

    triggerAction(action, isDown) {
        this.actionState.set(action, isDown);
    }

    // Call once per frame exactly before logical updates
    update() {
        // We sync previous state to check "just pressed" vs "held"
        for (const [action, isDown] of this.actionState.entries()) {
            this.lastActionState.set(action, isDown);
        }
    }

    // Returns TRUE if currently held down
    isDown(action) {
        return !!this.actionState.get(action);
    }

    // Returns TRUE only on the exact frame it was pressed
    isJustPressed(action) {
        return !!this.actionState.get(action) && !this.lastActionState.get(action);
    }

    isJustReleased(action) {
        return !this.actionState.get(action) && !!this.lastActionState.get(action);
    }

    consumeAction(action) {
        // Prevents triggering the same action multiple times until keyup
        this.lastActionState.set(action, true);
        this.actionState.set(action, false);
    }

    // Touch Handling (Basic Gesture Recognition)
    handleTouchStart(e) {
        // Ignore multi-touch for gestures
        if (e.touches.length > 1) return;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isSwiping = false;
        // Don't prevent default yet, lets single taps pass through if necessary
    }

    handleTouchMove(e) {
        if (e.touches.length > 1) return;
        e.preventDefault(); // Prevent scrolling the page
        
        this.touchCurrentX = e.touches[0].clientX;
        this.touchCurrentY = e.touches[0].clientY;
        
        const dx = this.touchCurrentX - this.touchStartX;
        const dy = this.touchCurrentY - this.touchStartY;

        if (Math.abs(dx) > this.swipeThreshold || Math.abs(dy) > this.swipeThreshold) {
            this.isSwiping = true;
        }

        // We can do direct left/right dragging here for precise movement
        // Or discrete "swipes". Standard mobile Tetris often uses swipes for Hard/Soft drop, 
        // and taps/dragging for movement. We will implement discrete gestures for now.
    }

    handleTouchEnd(e) {
        // Simple Swipe Evaluation
        if (this.isSwiping) {
            const dx = this.touchCurrentX - this.touchStartX;
            const dy = this.touchCurrentY - this.touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal Swipe
                if (dx > this.swipeThreshold) {
                    this.actionState.set(InputActions.RIGHT, true);
                    setTimeout(() => this.actionState.set(InputActions.RIGHT, false), 50);
                } else if (dx < -this.swipeThreshold) {
                    this.actionState.set(InputActions.LEFT, true);
                    setTimeout(() => this.actionState.set(InputActions.LEFT, false), 50);
                }
            } else {
                // Vertical Swipe
                if (dy > this.swipeThreshold) {
                    // Swipe Down = Soft Drop
                    this.actionState.set(InputActions.SOFT_DROP, true);
                    setTimeout(() => this.actionState.set(InputActions.SOFT_DROP, false), 50);
                } else if (dy < -this.swipeThreshold) {
                    // Swipe Up = Hard Drop
                    this.actionState.set(InputActions.HARD_DROP, true);
                    setTimeout(() => this.actionState.set(InputActions.HARD_DROP, false), 50);
                }
            }
        } else {
            // It was a tap. Let's make tap rotate CW
            this.actionState.set(InputActions.ROTATE_CW, true);
            setTimeout(() => this.actionState.set(InputActions.ROTATE_CW, false), 50);
        }
    }
}
