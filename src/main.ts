import { Engine } from './core/Engine';

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
    engine.start();
    console.log('Game engine started successfully');
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
