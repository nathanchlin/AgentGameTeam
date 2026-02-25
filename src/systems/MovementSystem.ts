import { PositionComponent, DirectionComponent, Direction } from '../components';
import type { Entity } from '../entities/Entity';

export class MovementSystem {
  private moveTimer = 0;
  private moveInterval: number;
  private gridSize: number;
  private snakeSegments: Entity[];

  constructor(snakeSegments: Entity[], moveInterval: number = 100, gridSize: number = 20) {
    this.snakeSegments = snakeSegments;
    this.moveInterval = moveInterval;
    this.gridSize = gridSize;
  }

  update(deltaTime: number): void {
    this.moveTimer += deltaTime * 1000;

    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.moveSnake();
    }
  }

  private moveSnake(): void {
    if (this.snakeSegments.length === 0) return;

    // Store previous positions
    const previousPositions: { x: number; y: number }[] = this.snakeSegments.map(segment => {
      const pos = segment.getComponent(PositionComponent)!;
      return { x: pos.x, y: pos.y };
    });

    // Move head
    const head = this.snakeSegments[0];
    const headPos = head.getComponent(PositionComponent)!;
    const headDir = head.getComponent(DirectionComponent)!;

    switch (headDir.current) {
      case Direction.UP:
        headPos.y -= this.gridSize;
        break;
      case Direction.DOWN:
        headPos.y += this.gridSize;
        break;
      case Direction.LEFT:
        headPos.x -= this.gridSize;
        break;
      case Direction.RIGHT:
        headPos.x += this.gridSize;
        break;
    }

    // Move body segments to previous positions
    for (let i = 1; i < this.snakeSegments.length; i++) {
      const pos = this.snakeSegments[i].getComponent(PositionComponent)!;
      pos.x = previousPositions[i - 1].x;
      pos.y = previousPositions[i - 1].y;
    }
  }

  setMoveInterval(interval: number): void {
    this.moveInterval = interval;
  }
}
