import { GameLoop } from './GameLoop';
import { Scene } from './Scene';
import { EventBus } from './EventBus';

export interface EngineConfig {
  width: number;
  height: number;
  canvasId: string;
  targetFPS: number;
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameLoop: GameLoop;
  private eventBus: EventBus;
  private currentScene: Scene | null = null;
  private scenes: Map<string, Scene> = new Map();
  private isRunning = false;

  public readonly width: number;
  public readonly height: number;

  constructor(config: EngineConfig) {
    this.width = config.width;
    this.height = config.height;

    const canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${config.canvasId}" not found`);
    }
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    this.canvas.width = config.width;
    this.canvas.height = config.height;

    this.eventBus = new EventBus();
    this.gameLoop = new GameLoop(config.targetFPS, this.update.bind(this), this.render.bind(this));
  }

  async initialize(): Promise<void> {
    // Initialize engine systems
    this.setupInputHandlers();
    await this.loadAssets();
    console.log('Engine initialized');
  }

  private setupInputHandlers(): void {
    window.addEventListener('keydown', (e) => {
      this.eventBus.emit('keydown', { key: e.key, code: e.code });
    });

    window.addEventListener('keyup', (e) => {
      this.eventBus.emit('keyup', { key: e.key, code: e.code });
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.eventBus.emit('click', { x, y });
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.eventBus.emit('mousemove', { x, y });
    });
  }

  private async loadAssets(): Promise<void> {
    // Asset loading placeholder
    console.log('Assets loaded');
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.gameLoop.start();
  }

  stop(): void {
    this.isRunning = false;
    this.gameLoop.stop();
  }

  private update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#0f0f1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render current scene
    if (this.currentScene) {
      this.currentScene.render(this.ctx);
    }
  }

  addScene(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  switchScene(name: string): void {
    const scene = this.scenes.get(name);
    if (!scene) {
      throw new Error(`Scene "${name}" not found`);
    }
    // Exit current scene before switching
    if (this.currentScene) {
      this.currentScene.exit();
    }
    this.currentScene = scene;
    this.currentScene.enter();
  }

  hasScene(name: string): boolean {
    return this.scenes.has(name);
  }

  removeScene(name: string): boolean {
    if (this.currentScene && this.scenes.get(name) === this.currentScene) {
      this.currentScene.exit();
      this.currentScene = null;
    }
    return this.scenes.delete(name);
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getConfig(): EngineConfig {
    return {
      width: this.width,
      height: this.height,
      canvasId: this.canvas.id,
      targetFPS: 60,
    };
  }
}
