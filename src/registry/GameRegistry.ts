import type { Engine } from '../core/Engine';
import type { EventBus } from '../core/EventBus';
import type { GameMeta, RegisteredGame, SceneFactory } from './types';

/**
 * Central registry for all games in the system.
 * Manages game registration, launching, and navigation.
 */
export class GameRegistry {
  private games: Map<string, RegisteredGame> = new Map();
  private engine: Engine;
  private eventBus: EventBus;
  private currentGameId: string | null = null;

  constructor(engine: Engine) {
    this.engine = engine;
    this.eventBus = engine.getEventBus();
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for game navigation
   */
  private setupEventHandlers(): void {
    // Handle return to home event
    this.eventBus.on('game:return_home', () => {
      this.returnToHome();
    });
  }

  /**
   * Register a new game
   */
  register(meta: GameMeta, sceneFactory: SceneFactory, options?: { hasMenu?: boolean; menuFactory?: SceneFactory }): void {
    if (this.games.has(meta.id)) {
      console.warn(`Game "${meta.id}" is already registered. Overwriting.`);
    }

    this.games.set(meta.id, {
      meta,
      sceneFactory,
      hasMenu: options?.hasMenu,
      menuFactory: options?.menuFactory,
    });

    console.log(`Game registered: ${meta.nameZh} (${meta.id})`);
  }

  /**
   * Get all registered games metadata
   */
  getAllGames(): GameMeta[] {
    return Array.from(this.games.values()).map((game) => game.meta);
  }

  /**
   * Get a specific game by ID
   */
  getGame(id: string): RegisteredGame | undefined {
    return this.games.get(id);
  }

  /**
   * Get game metadata by ID
   */
  getGameMeta(id: string): GameMeta | undefined {
    return this.games.get(id)?.meta;
  }

  /**
   * Check if a game exists
   */
  hasGame(id: string): boolean {
    return this.games.has(id);
  }

  /**
   * Launch a game by ID
   */
  async launchGame(id: string): Promise<void> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error(`Game "${id}" not found`);
    }

    // If game has a menu, launch menu instead
    if (game.hasMenu && game.menuFactory) {
      await this.launchMenu(id);
      return;
    }

    try {
      this.currentGameId = id;
      const scene = await game.sceneFactory(this.engine);

      // Remove existing game scene if any
      if (this.engine.hasScene('game')) {
        this.engine.removeScene('game');
      }

      this.engine.addScene('game', scene);
      this.engine.switchScene('game');

      console.log(`Game launched: ${game.meta.nameZh}`);
    } catch (error) {
      console.error(`Failed to launch game "${id}":`, error);
      throw error;
    }
  }

  /**
   * Launch a game's menu (if available)
   */
  async launchMenu(id: string): Promise<void> {
    const game = this.games.get(id);
    if (!game) {
      throw new Error(`Game "${id}" not found`);
    }

    if (!game.hasMenu || !game.menuFactory) {
      // No menu, launch game directly
      await this.launchGame(id);
      return;
    }

    try {
      this.currentGameId = id;
      const scene = await game.menuFactory(this.engine);

      // Remove existing menu scene if any
      if (this.engine.hasScene('menu')) {
        this.engine.removeScene('menu');
      }

      this.engine.addScene('menu', scene);
      this.engine.switchScene('menu');

      console.log(`Menu launched: ${game.meta.nameZh}`);
    } catch (error) {
      console.error(`Failed to launch menu for "${id}":`, error);
      throw error;
    }
  }

  /**
   * Return to home page
   */
  returnToHome(): void {
    this.currentGameId = null;
    this.eventBus.emit('game:show_home');
  }

  /**
   * Get the currently running game ID
   */
  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  /**
   * Get count of registered games
   */
  getGameCount(): number {
    return this.games.size;
  }
}
