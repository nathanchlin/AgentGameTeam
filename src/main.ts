import { Engine } from './core/Engine';
import { GameRegistry } from './registry/GameRegistry';
import { HomeScene } from './scenes/HomeScene';
import { GameScene } from './scenes/GameScene';
import { BulletHellScene } from './scenes/BulletHellScene';
import { TetrisMenuScene } from './scenes/TetrisMenuScene';
import { TetrisBattleScene } from './scenes/TetrisBattleScene';
import { TowerDefenseScene } from './scenes/TowerDefenseScene';
import { InkRunnerScene } from './scenes/InkRunnerScene';
import { CardBattleScene } from './scenes/CardBattleScene';
import { MatchThreeScene } from './scenes/MatchThreeScene';
import { BreakoutScene } from './scenes/BreakoutScene';
import { MinesweeperScene } from './scenes/MinesweeperScene';
import { BackpackWarScene } from './scenes/BackpackWarScene';
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

  // Tower Defense game
  registry.register(
    {
      id: 'towerDefense',
      name: 'Ink Tower Defense',
      nameZh: '墨韵塔防',
      description: 'Chinese calligraphy themed tower defense game with 5 tower types.',
      descriptionZh: '水墨书法主题塔防游戏，包含5种塔类型。',
      category: 'strategy',
      tags: ['tower-defense', 'strategy', 'ink-art'],
      difficulty: 'medium',
      estimatedPlayTime: '15-30 min',
      controls: ['Click: Place tower', '1-5: Select tower', 'Space: Start wave'],
    },
    () => new TowerDefenseScene(engine)
  );

  // Ink Runner game
  registry.register(
    {
      id: 'inkRunner',
      name: 'Ink Runner',
      nameZh: '水墨跑酷',
      description: 'Endless runner game with Chinese ink wash painting aesthetics.',
      descriptionZh: '水墨画风格无尽跑酷游戏。',
      category: 'action',
      tags: ['runner', 'endless', 'ink-art'],
      difficulty: 'easy',
      estimatedPlayTime: '5-15 min',
      controls: ['Space/W/Up: Jump', 'S/Down: Slide', 'ESC: Pause'],
    },
    () => new InkRunnerScene(engine)
  );

  // Card Battle game
  registry.register(
    {
      id: 'cardBattle',
      name: 'Ink Cards',
      nameZh: '水墨卡牌',
      description: 'Turn-based card battler with Chinese calligraphy theme, similar to Slay the Spire.',
      descriptionZh: '水墨书法主题回合制卡牌对战游戏，类似杀戮尖塔。',
      category: 'strategy',
      tags: ['card-game', 'roguelike', 'turn-based'],
      difficulty: 'medium',
      estimatedPlayTime: '15-30 min',
      controls: ['Click: Select card/target', 'E/Space: End turn', '1-9: Select card'],
    },
    () => new CardBattleScene(engine)
  );

  // Match-3 Puzzle game
  registry.register(
    {
      id: 'matchThree',
      name: 'Ink Match',
      nameZh: '水墨消消乐',
      description: 'Match-3 puzzle game with Chinese ink wash painting gems.',
      descriptionZh: '水墨画主题三消益智游戏。',
      category: 'puzzle',
      tags: ['match-3', 'puzzle', 'casual'],
      difficulty: 'easy',
      estimatedPlayTime: '5-15 min',
      controls: ['Click: Select/Swap gems'],
    },
    () => new MatchThreeScene(engine)
  );

  // Breakout game
  registry.register(
    {
      id: 'breakout',
      name: 'Ink Breakout',
      nameZh: '水墨弹球',
      description: 'Classic breakout game with Chinese ink wash painting style.',
      descriptionZh: '水墨画风格经典弹球游戏。',
      category: 'arcade',
      tags: ['breakout', 'arcade', 'casual'],
      difficulty: 'easy',
      estimatedPlayTime: '5-15 min',
      controls: ['Mouse: Move paddle', 'Click/Space: Launch ball'],
    },
    () => new BreakoutScene(engine)
  );

  // Minesweeper game
  registry.register(
    {
      id: 'minesweeper',
      name: 'Ink Minesweeper',
      nameZh: '水墨扫雷',
      description: 'Classic minesweeper with Chinese ink wash painting theme.',
      descriptionZh: '水墨画主题经典扫雷游戏。',
      category: 'puzzle',
      tags: ['minesweeper', 'puzzle', 'casual'],
      difficulty: 'easy',
      estimatedPlayTime: '5-15 min',
      controls: ['Click: Reveal cell', 'Right-click: Flag cell'],
    },
    () => new MinesweeperScene(engine)
  );

  // Backpack War game
  registry.register(
    {
      id: 'backpackWar',
      name: 'Backpack War',
      nameZh: '背包战争',
      description: 'Auto-battler with inventory management. Equip your heroes and watch them fight!',
      descriptionZh: '背包管理自动战斗游戏。装备你的英雄，观看他们战斗！',
      category: 'strategy',
      tags: ['auto-battler', 'inventory', 'strategy', 'cute'],
      difficulty: 'medium',
      estimatedPlayTime: '15-30 min',
      controls: ['Click/Drag: Place items', 'Space: Start battle', 'ESC: Cancel/Menu'],
    },
    () => new BackpackWarScene(engine)
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
