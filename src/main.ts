import { Engine } from './core/Engine';
import { GameScene } from './scenes/GameScene';
import { BulletHellScene } from './scenes/BulletHellScene';
import { TetrisMenuScene } from './scenes/TetrisMenuScene';
import { TetrisBattleScene } from './scenes/TetrisBattleScene';
import type { AIDifficulty } from './components/tetris/AIConfigComponent';

// Game configuration
const config = {
  width: 900,
  height: 640,
  canvasId: 'game-canvas',
  targetFPS: 60,
};

// Initialize and start the game engine
async function main() {
  const engine = new Engine(config);

  try {
    await engine.initialize();

    // Get game mode from URL params or default to menu
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('game') || 'menu';

    if (gameMode === 'snake') {
      // Create and register snake game scene
      const gameScene = new GameScene(engine);
      engine.addScene('game', gameScene);
      engine.switchScene('game');
      console.log('Snake game started successfully');
      console.log('Use Arrow Keys or WASD to control the snake');
    } else if (gameMode === 'bulletHell') {
      // Create and register bullet hell game scene
      const bulletHellScene = new BulletHellScene(engine);
      engine.addScene('bulletHell', bulletHellScene);
      engine.switchScene('bulletHell');
      console.log('Spirit Painter bullet hell game started successfully');
      console.log('Use WASD to move, Space or Z to shoot');
    } else if (gameMode === 'tetris') {
      // Start Tetris directly with default difficulty
      const battleScene = new TetrisBattleScene(engine, 'normal');
      engine.addScene('tetrisBattle', battleScene);
      engine.switchScene('tetrisBattle');
      console.log('Tetris Battle started successfully');
    } else {
      // Default: show Tetris menu
      setupTetrisMenu(engine);
    }

    // Start the engine
    engine.start();
  } catch (error) {
    console.error('Failed to start game engine:', error);
  }
}

/**
 * Setup Tetris menu and scene transitions
 */
function setupTetrisMenu(engine: Engine): void {
  const menuScene = new TetrisMenuScene(engine);
  engine.addScene('tetrisMenu', menuScene);

  // Handle start game event from menu
  engine.getEventBus().on('tetris:start_game', (data: { difficulty: AIDifficulty }) => {
    const battleScene = new TetrisBattleScene(engine, data.difficulty);
    engine.addScene('tetrisBattle', battleScene);
    engine.switchScene('tetrisBattle');
    console.log(`Tetris Battle started with ${data.difficulty} difficulty`);
  });

  // Handle return to menu
  engine.getEventBus().on('tetris:return_to_menu', () => {
    engine.switchScene('tetrisMenu');
  });

  engine.switchScene('tetrisMenu');
  console.log('Tetris Battle menu loaded');
  console.log('Use Arrow Keys to select difficulty, Enter to start');
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
