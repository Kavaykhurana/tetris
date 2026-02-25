export const GameStates = {
    LOADING: 'LOADING',
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    SETTINGS: 'SETTINGS'
};

export class StateMachine {
    constructor() {
        this.currentState = GameStates.LOADING;
        this.previousState = null;
        
        // Allowed transitions define a strict flow. Any other transition is rejected.
        this.transitions = {
            [GameStates.LOADING]: [GameStates.MENU],
            [GameStates.MENU]: [GameStates.PLAYING, GameStates.SETTINGS],
            [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
            [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
            [GameStates.GAME_OVER]: [GameStates.MENU, GameStates.PLAYING],
            [GameStates.SETTINGS]: [GameStates.MENU, GameStates.PLAYING]
        };
        
        // Observers notified of state changes
        this.listeners = [];
    }
    
    // Attempt state mutation
    change(newState, context = {}) {
        if (!this.canTransitionTo(newState)) {
            console.warn(`[StateMachine] Invalid transition from ${this.currentState} to ${newState}`);
            return false;
        }

        console.log(`[StateMachine] Transition: ${this.currentState} -> ${newState}`);
        this.previousState = this.currentState;
        this.currentState = newState;
        
        // Notify all registered systems
        this.notify(newState, this.previousState, context);
        return true;
    }

    canTransitionTo(state) {
        return this.transitions[this.currentState]?.includes(state);
    }
    
    // Go to previous state (useful for settings menu returning to game or main menu)
    revert(context = {}) {
        if (this.previousState) {
            this.change(this.previousState, context);
        }
    }

    onStateChange(callback) {
        this.listeners.push(callback);
    }

    notify(newState, oldState, context) {
        for (const listener of this.listeners) {
            listener(newState, oldState, context);
        }
    }

    // State checkers for quick boolean evaluation during the game loop
    isPlaying() {
        return this.currentState === GameStates.PLAYING;
    }

    isPaused() {
        return this.currentState === GameStates.PAUSED;
    }

    isMenu() {
        return this.currentState === GameStates.MENU;
    }
}
