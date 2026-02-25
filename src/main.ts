import { Engine } from './core/Engine';
import { GameScene } from './scenes/GameScene';
import { BulletHellScene } from './scenes/BulletHellScene';

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

    // Get game mode from URL params or default to bullet hell
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('game') || 'bulletHell';

    if (gameMode === 'snake') {
      // Create and register snake game scene
      const gameScene = new GameScene(engine);
      engine.addScene('game', gameScene);
      engine.switchScene('game');
      console.log('Snake game started successfully');
      console.log('Use Arrow Keys or WASD to control the snake');
    } else {
      // Create and register bullet hell game scene (default)
      const bulletHellScene = new BulletHellScene(engine);
      engine.addScene('bulletHell', bulletHellScene);
      engine.switchScene('bulletHell');
      console.log('Spirit Painter bullet hell game started successfully');
      console.log('Use WASD to move, Space or Z to shoot');
    }

    // Start the engine
    engine.start();
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
