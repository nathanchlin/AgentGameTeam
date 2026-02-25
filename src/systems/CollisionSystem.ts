import type { EventBus } from '../core/EventBus';
import { PositionComponent, FoodComponent, ScoreComponent } from '../components';
import type { Entity } from '../entities/Entity';

export interface CollisionEvents {
  foodEaten: { food: Entity; snake: Entity };
  gameOver: { reason: string };
}

export class CollisionSystem {
  private snakeSegments: Entity[];
  private foods: Entity[];
  private scoreEntity: Entity;
  private width: number;
  private height: number;
  private eventBus: EventBus;

  constructor(
    snakeSegments: Entity[],
    foods: Entity[],
    scoreEntity: Entity,
    width: number,
    height: number,
    _gridSize: number,
    eventBus: EventBus
  ) {
    this.snakeSegments = snakeSegments;
    this.foods = foods;
    this.scoreEntity = scoreEntity;
    this.width = width;
    this.height = height;
    this.eventBus = eventBus;
  }

  update(_deltaTime: number): void {
    this.checkCollisions();
  }

  private checkCollisions(): void {
    if (this.snakeSegments.length === 0) return;

    const head = this.snakeSegments[0];
    const headPos = head.getComponent(PositionComponent)!;

    // Check wall collision
    if (headPos.x < 0 || headPos.x >= this.width || headPos.y < 0 || headPos.y >= this.height) {
      this.eventBus.emit('gameOver', { reason: 'Wall collision' });
      return;
    }

    // Check self collision
    for (let i = 1; i < this.snakeSegments.length; i++) {
      const segment = this.snakeSegments[i];
      const segmentPos = segment.getComponent(PositionComponent)!;

      if (headPos.x === segmentPos.x && headPos.y === segmentPos.y) {
        this.eventBus.emit('gameOver', { reason: 'Self collision' });
        return;
      }
    }

    // Check food collision
    for (const food of this.foods) {
      if (!food.isActive) continue;
      const foodPos = food.getComponent(PositionComponent)!;

      if (headPos.x === foodPos.x && headPos.y === foodPos.y) {
        const foodComp = food.getComponent(FoodComponent)!;
        const score = this.scoreEntity.getComponent(ScoreComponent)!;

        score.add(foodComp.value);
        food.isActive = false;

        this.eventBus.emit('foodEaten', { food, snake: head });
      }
    }
  }
}
