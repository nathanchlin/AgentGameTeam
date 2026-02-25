import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import { Entity } from '../entities/Entity';
import {
  PositionComponent,
  DirectionComponent,
  Direction,
  SnakeSegmentComponent,
  FoodComponent,
  ScoreComponent,
} from '../components';
import {
  InputSystem,
  MovementSystem,
  CollisionSystem,
  RenderSystem,
  FoodSpawnSystem,
} from '../systems';

export class GameScene extends Scene {
  private engine: Engine;
  private snakeSegments: Entity[] = [];
  private foods: Entity[] = [];
  private scoreEntity!: Entity;

  private inputSystem!: InputSystem;
  private movementSystem!: MovementSystem;
  private collisionSystem!: CollisionSystem;
  private renderSystem!: RenderSystem;
  private foodSpawnSystem!: FoodSpawnSystem;

  private gridSize = 20;
  private isGameOver = false;
  private restartHandler?: () => void;

  constructor(engine: Engine) {
    super('GameScene');
    this.engine = engine;
  }

  enter(): void {
    super.enter();
    this.isGameOver = false;
    this.snakeSegments = [];
    this.foods = [];

    this.createScoreEntity();
    this.createSnake();
    this.createFood();
    this.setupSystems();
    this.setupEventHandlers();
  }

  exit(): void {
    super.exit();
    if (this.restartHandler) {
      this.engine.getEventBus().off('keydown', this.restartHandler);
    }
  }

  private createScoreEntity(): void {
    this.scoreEntity = new Entity('Score', 0, 0);
    this.scoreEntity.addComponent(new ScoreComponent(0));
  }

  private createSnake(): void {
    // Create snake head at center
    const startX = Math.floor(this.engine.width / 2 / this.gridSize) * this.gridSize;
    const startY = Math.floor(this.engine.height / 2 / this.gridSize) * this.gridSize;

    // Head
    const head = new Entity('SnakeHead', startX, startY);
    head.width = this.gridSize;
    head.height = this.gridSize;
    head.addComponent(new PositionComponent(startX, startY));
    head.addComponent(new DirectionComponent(Direction.RIGHT));
    head.addComponent(new SnakeSegmentComponent(true, 0));
    this.snakeSegments.push(head);

    // Initial body segments
    for (let i = 1; i <= 3; i++) {
      const segment = new Entity(`SnakeSegment_${i}`, startX - i * this.gridSize, startY);
      segment.width = this.gridSize;
      segment.height = this.gridSize;
      segment.addComponent(new PositionComponent(startX - i * this.gridSize, startY));
      segment.addComponent(new SnakeSegmentComponent(false, i));
      this.snakeSegments.push(segment);
    }
  }

  private createFood(): void {
    const food = this.createFoodEntity();
    this.foods.push(food);
  }

  private createFoodEntity(): Entity {
    const cols = Math.floor(this.engine.width / this.gridSize);
    const rows = Math.floor(this.engine.height / this.gridSize);
    const x = Math.floor(Math.random() * cols) * this.gridSize;
    const y = Math.floor(Math.random() * rows) * this.gridSize;

    const food = new Entity('Food', x, y);
    food.width = this.gridSize;
    food.height = this.gridSize;
    food.addComponent(new PositionComponent(x, y));
    food.addComponent(new FoodComponent(10));
    return food;
  }

  private setupSystems(): void {
    const head = this.snakeSegments[0];

    this.inputSystem = new InputSystem(this.engine.getEventBus(), head);
    this.movementSystem = new MovementSystem(this.snakeSegments, 100, this.gridSize);
    this.collisionSystem = new CollisionSystem(
      this.snakeSegments,
      this.foods,
      this.scoreEntity,
      this.engine.width,
      this.engine.height,
      this.gridSize,
      this.engine.getEventBus()
    );
    this.renderSystem = new RenderSystem(
      this.snakeSegments,
      this.foods,
      this.scoreEntity,
      this.gridSize
    );
    this.foodSpawnSystem = new FoodSpawnSystem(
      this.foods,
      this.snakeSegments,
      this.engine.width,
      this.engine.height,
      this.gridSize,
      () => this.createFoodEntity()
    );
  }

  private setupEventHandlers(): void {
    this.engine.getEventBus().on('foodEaten', () => {
      this.growSnake();
    });

    this.engine.getEventBus().on('gameOver', (data: { reason: string }) => {
      this.handleGameOver(data.reason);
    });
  }

  private growSnake(): void {
    const tail = this.snakeSegments[this.snakeSegments.length - 1];
    const tailPos = tail.getComponent(PositionComponent)!;

    const newSegment = new Entity(
      `SnakeSegment_${this.snakeSegments.length}`,
      tailPos.x,
      tailPos.y
    );
    newSegment.width = this.gridSize;
    newSegment.height = this.gridSize;
    newSegment.addComponent(new PositionComponent(tailPos.x, tailPos.y));
    newSegment.addComponent(new SnakeSegmentComponent(false, this.snakeSegments.length));
    this.snakeSegments.push(newSegment);

    // Update render system with new segment
    this.renderSystem = new RenderSystem(
      this.snakeSegments,
      this.foods,
      this.scoreEntity,
      this.gridSize
    );
  }

  private handleGameOver(reason: string): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.movementSystem.setMoveInterval(Infinity);

    console.log(`Game Over: ${reason}`);

    // Show game over overlay
    this.showGameOverOverlay();

    // Setup restart handler
    this.restartHandler = () => {
      this.engine.getEventBus().emit('restart');
    };
    this.engine.getEventBus().on('keydown', this.restartHandler);
    this.engine.getEventBus().once('restart', () => {
      this.hideGameOverOverlay();
      this.enter();
    });
  }

  private showGameOverOverlay(): void {
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      const score = this.scoreEntity.getComponent(ScoreComponent)!;
      const scoreDisplay = document.getElementById('final-score');
      if (scoreDisplay) {
        scoreDisplay.textContent = score.score.toString();
      }
    }
  }

  private hideGameOverOverlay(): void {
    const overlay = document.getElementById('game-over-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  update(deltaTime: number): void {
    if (this.isGameOver) return;

    this.inputSystem.update(deltaTime);
    this.movementSystem.update(deltaTime);
    this.collisionSystem.update(deltaTime);
    this.foodSpawnSystem.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas with background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    this.renderSystem.render(ctx);

    // Render game over overlay if needed
    if (this.isGameOver) {
      this.renderGameOver(ctx);
    }
  }

  private renderGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Game Over!', this.engine.width / 2, this.engine.height / 2 - 30);

    const score = this.scoreEntity.getComponent(ScoreComponent)!;
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(`Score: ${score.score}`, this.engine.width / 2, this.engine.height / 2 + 20);

    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Press any key to restart', this.engine.width / 2, this.engine.height / 2 + 60);
  }
}
