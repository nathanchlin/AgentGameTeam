import { PositionComponent } from '../components';
import type { Entity } from '../entities/Entity';

export class FoodSpawnSystem {
  private foods: Entity[];
  private snakeSegments: Entity[];
  private width: number;
  private height: number;
  private gridSize: number;
  private entityFactory: () => Entity;

  constructor(
    foods: Entity[],
    snakeSegments: Entity[],
    width: number,
    height: number,
    gridSize: number,
    entityFactory: () => Entity
  ) {
    this.foods = foods;
    this.snakeSegments = snakeSegments;
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;
    this.entityFactory = entityFactory;
  }

  update(_deltaTime: number): void {
    // Check if any food is inactive and respawn
    for (let i = 0; i < this.foods.length; i++) {
      if (!this.foods[i].isActive) {
        this.respawnFood(this.foods[i]);
      }
    }

    // Ensure at least one food exists
    if (this.foods.length === 0 || this.foods.every(f => !f.isActive)) {
      const newFood = this.entityFactory();
      this.foods.push(newFood);
    }
  }

  private respawnFood(food: Entity): void {
    const pos = food.getComponent(PositionComponent)!;
    const newPos = this.getRandomPosition();
    pos.x = newPos.x;
    pos.y = newPos.y;
    food.isActive = true;
  }

  private getRandomPosition(): { x: number; y: number } {
    const cols = Math.floor(this.width / this.gridSize);
    const rows = Math.floor(this.height / this.gridSize);

    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * cols) * this.gridSize;
      const y = Math.floor(Math.random() * rows) * this.gridSize;

      // Check if position overlaps with snake
      let overlaps = false;
      for (const segment of this.snakeSegments) {
        const segPos = segment.getComponent(PositionComponent)!;
        if (segPos.x === x && segPos.y === y) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        return { x, y };
      }

      attempts++;
    }

    // Fallback to random position
    return {
      x: Math.floor(Math.random() * cols) * this.gridSize,
      y: Math.floor(Math.random() * rows) * this.gridSize,
    };
  }
}
