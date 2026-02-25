import { Engine } from './core/Engine';
import { GameScene } from './scenes/GameScene';

// Game configuration
const config = {
  width: 800,
  height: 600,
  canvasId: 'game-canvas',
  targetFPS: 60,
};

// Initialize and start the game engine
async function main() {
  const engine = new Engine(config);

  try {
    await engine.initialize();

    // Create and register game scene
    const gameScene = new GameScene(engine);
    engine.addScene('game', gameScene);

    // Switch to game scene
    engine.switchScene('game');

    // Start the engine
    engine.start();
    console.log('Snake game started successfully');
    console.log('Use Arrow Keys or WASD to control the snake');
  } catch (error) {
    console.error('Failed to start game engine:', error);
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
