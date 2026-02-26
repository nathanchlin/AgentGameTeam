import { Engine } from './core/Engine';
import { GameRegistry } from './registry/GameRegistry';
import { HomeScene } from './scenes/HomeScene';
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

    // Create game registry
    const registry = new GameRegistry(engine);

    // Register all games
    registerGames(engine, registry);

    // Create home scene
    const homeScene = new HomeScene(engine, registry);
    engine.addScene('home', homeScene);

    // Handle return to home event
    engine.getEventBus().on('game:show_home', () => {
      engine.switchScene('home');
    });

    // Get game mode from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('game');

    if (gameMode && registry.hasGame(gameMode)) {
      // Launch specific game from URL
      await registry.launchGame(gameMode);
    } else {
      // Show home scene by default
      engine.switchScene('home');
    }

    // Start the engine
    engine.start();
    console.log('Agent Game Team engine started');
  } catch (error) {
    console.error('Failed to start game engine:', error);
  }
}

/**
 * Register all available games
 */
function registerGames(engine: Engine, registry: GameRegistry): void {
  // Snake game
  registry.register(
    {
      id: 'snake',
      name: 'Snake',
      nameZh: '贪吃蛇',
      description: 'Classic snake game. Eat food to grow, avoid hitting walls and yourself.',
      descriptionZh: '经典贪吃蛇游戏。吃食物成长，避免撞墙和咬到自己。',
      category: 'arcade',
      tags: ['classic', 'casual'],
      difficulty: 'easy',
      estimatedPlayTime: '5-10 min',
      controls: ['Arrow Keys / WASD'],
    },
    () => new GameScene(engine)
  );

  // Bullet Hell game
  registry.register(
    {
      id: 'bulletHell',
      name: 'Spirit Painter',
      nameZh: '水墨弹幕',
      description: 'Chinese ink painting themed bullet hell shooter.',
      descriptionZh: '水墨画主题弹幕射击游戏。',
      category: 'action',
      tags: ['shooter', 'bullet-hell'],
      difficulty: 'medium',
      estimatedPlayTime: '10-20 min',
      controls: ['WASD: Move', 'Space/Z: Shoot'],
    },
    () => new BulletHellScene(engine)
  );

  // Tetris Battle (with menu)
  registry.register(
    {
      id: 'tetris',
      name: 'Tetris Battle',
      nameZh: '俄罗斯方块对战',
      description: 'Battle against AI in classic Tetris with skill system.',
      descriptionZh: '与AI对战的经典俄罗斯方块，带技能系统。',
      category: 'puzzle',
      tags: ['puzzle', 'versus', 'strategy'],
      difficulty: 'medium',
      estimatedPlayTime: '10-30 min',
      controls: ['Arrows/WASD: Move', 'Z/X: Rotate', 'Space: Drop', '1-6: Skills'],
    },
    // Default scene factory (launches with normal difficulty)
    () => new TetrisBattleScene(engine, 'normal'),
    {
      hasMenu: true,
      menuFactory: () => {
        const menuScene = new TetrisMenuScene(engine);
        setupTetrisMenuEvents(engine, registry);
        return menuScene;
      },
    }
  );

  console.log(`Registered ${registry.getGameCount()} games`);
}

/**
 * Setup Tetris menu event handlers
 */
function setupTetrisMenuEvents(engine: Engine, _registry: GameRegistry): void {
  // Handle start game event from menu
  engine.getEventBus().on('tetris:start_game', (data: { difficulty: AIDifficulty }) => {
    const battleScene = new TetrisBattleScene(engine, data.difficulty);
    engine.addScene('tetrisBattle', battleScene);
    engine.switchScene('tetrisBattle');
    console.log(`Tetris Battle started with ${data.difficulty} difficulty`);
  });

  // Handle return to menu - now goes to home
  engine.getEventBus().on('tetris:return_to_menu', () => {
    engine.getEventBus().emit('game:return_home');
  });
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
