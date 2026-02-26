export class MobileControls {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.container = document.getElementById('mobile-controls');
        
        // Only show if touch is supported
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        if (this.isTouchDevice) {
            this.init();
        }
    }

    init() {
        this.container.classList.remove('hidden');
        this.container.style.display = 'grid';
        
        // We bind touch events to avoid 300ms click delay on iOS/Android
        this.bindButton('btn-left', 'LEFT');
        this.bindButton('btn-right', 'RIGHT');
        this.bindButton('btn-soft-drop', 'SOFT_DROP');
        this.bindButton('btn-hard-drop', 'HARD_DROP');
        this.bindButton('btn-rotate-ccw', 'ROTATE_CCW');
        this.bindButton('btn-rotate-cw', 'ROTATE_CW');
        this.bindButton('btn-hold', 'HOLD');
        

    }

    bindButton(id, actionName) {
        const btn = document.getElementById(id);
        if (!btn) return;
        
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.inputManager.triggerAction(actionName, true);
        }, { passive: false });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.inputManager.triggerAction(actionName, false);
        });
        
        // In case touch moves off the button
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.inputManager.triggerAction(actionName, false);
        });
    }
}
