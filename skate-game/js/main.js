import { SkateGame } from './game/SkateGame.js';

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Create and start the game
    const game = new SkateGame();
    
    // For debugging purposes - make the game accessible globally
    window.game = game;
    
    console.log('Skate game initialized!');
}); 