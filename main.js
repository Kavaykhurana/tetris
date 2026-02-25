import { Game } from "./core/Game.js";

// Application Entry Point
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Game Engine
  const game = new Game();

  // Attach to window for debugging or global access if absolutely necessary
  // Avoid accessing directly in module code
  window._TetrisGame = game;

  // The Game class handles bootstrap, event listener binding, and state initialization
  game.init();
});
