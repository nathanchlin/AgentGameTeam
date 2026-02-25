import { PositionComponent, SnakeSegmentComponent, ScoreComponent } from '../components';
import type { Entity } from '../entities/Entity';

export class RenderSystem {
  private snakeSegments: Entity[];
  private foods: Entity[];
  private scoreEntity: Entity;
  private gridSize: number;
  private headColor: string;
  private bodyColor: string;
  private foodColor: string;

  constructor(
    snakeSegments: Entity[],
    foods: Entity[],
    scoreEntity: Entity,
    gridSize: number = 20
  ) {
    this.snakeSegments = snakeSegments;
    this.foods = foods;
    this.scoreEntity = scoreEntity;
    this.gridSize = gridSize;
    this.headColor = '#4ade80';
    this.bodyColor = '#22c55e';
    this.foodColor = '#ef4444';
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderGrid(ctx);
    this.renderFood(ctx);
    this.renderSnake(ctx);
    this.renderScore(ctx);
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let x = 0; x <= canvasWidth; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= canvasHeight; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  }

  private renderSnake(ctx: CanvasRenderingContext2D): void {
    for (let i = this.snakeSegments.length - 1; i >= 0; i--) {
      const segment = this.snakeSegments[i];
      if (!segment.isActive) continue;

      const pos = segment.getComponent(PositionComponent)!;
      const snakeSeg = segment.getComponent(SnakeSegmentComponent)!;

      const padding = 1;
      const x = pos.x + padding;
      const y = pos.y + padding;
      const size = this.gridSize - padding * 2;

      ctx.fillStyle = snakeSeg.isHead ? this.headColor : this.bodyColor;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 4);
      ctx.fill();

      // Draw eyes on head
      if (snakeSeg.isHead) {
        ctx.fillStyle = '#fff';
        const eyeSize = 4;
        const eyeOffset = 5;
        ctx.beginPath();
        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderFood(ctx: CanvasRenderingContext2D): void {
    for (const food of this.foods) {
      if (!food.isActive) continue;

      const pos = food.getComponent(PositionComponent)!;

      const padding = 2;
      const x = pos.x + padding;
      const y = pos.y + padding;
      const size = this.gridSize - padding * 2;

      ctx.fillStyle = this.foodColor;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(x + size / 2 - 3, y + size / 2 - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderScore(ctx: CanvasRenderingContext2D): void {
    const score = this.scoreEntity.getComponent(ScoreComponent)!;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score.score}`, 10, 10);
  }
}
