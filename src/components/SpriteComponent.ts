import { Component } from './Component';

export enum SpriteShape {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  INK_DOT = 'ink_dot',
  INK_BRUSH = 'ink_brush',
  INK_SPLASH = 'ink_splash',
  PAPER_DEMON = 'paper_demon',
  SEAL_STAMP = 'seal_stamp',
}

export interface SpriteStyle {
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  opacity?: number;
}

export class SpriteComponent extends Component {
  public rotation: number = 0;
  public scale: number = 1;
  public opacity: number = 1;
  public flipX: boolean = false;

  constructor(
    public shape: SpriteShape = SpriteShape.CIRCLE,
    public color: string = '#1a1a1a', // Ink black
    public size: number = 20,
    public style: SpriteStyle = {}
  ) {
    super();
  }

  update(_deltaTime: number): void {
    // Sprites don't need per-frame updates unless animating
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.entity) return;

    ctx.save();

    // Apply opacity
    const opacity = this.style.opacity ?? this.opacity;
    ctx.globalAlpha = opacity;

    // Translate to entity position
    ctx.translate(this.entity.x, this.entity.y);

    // Apply rotation
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    // Apply scale
    if (this.scale !== 1) {
      ctx.scale(this.scale, this.scale);
    }

    // Apply flip
    if (this.flipX) {
      ctx.scale(-1, 1);
    }

    // Render based on shape
    switch (this.shape) {
      case SpriteShape.CIRCLE:
        this.renderCircle(ctx);
        break;
      case SpriteShape.RECTANGLE:
        this.renderRectangle(ctx);
        break;
      case SpriteShape.INK_DOT:
        this.renderInkDot(ctx);
        break;
      case SpriteShape.INK_BRUSH:
        this.renderInkBrush(ctx);
        break;
      case SpriteShape.INK_SPLASH:
        this.renderInkSplash(ctx);
        break;
      case SpriteShape.PAPER_DEMON:
        this.renderPaperDemon(ctx);
        break;
      case SpriteShape.SEAL_STAMP:
        this.renderSealStamp(ctx);
        break;
    }

    ctx.restore();
  }

  private renderCircle(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.style.fillStyle ?? this.color;
    ctx.fill();
    if (this.style.strokeStyle) {
      ctx.strokeStyle = this.style.strokeStyle;
      ctx.lineWidth = this.style.lineWidth ?? 1;
      ctx.stroke();
    }
  }

  private renderRectangle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.style.fillStyle ?? this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    if (this.style.strokeStyle) {
      ctx.strokeStyle = this.style.strokeStyle;
      ctx.lineWidth = this.style.lineWidth ?? 1;
      ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
    }
  }

  private renderInkDot(ctx: CanvasRenderingContext2D): void {
    // Ink dot with gradient for depth effect
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, this.style.fillStyle ?? this.color);
    gradient.addColorStop(0.7, this.style.fillStyle ?? this.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private renderInkBrush(ctx: CanvasRenderingContext2D): void {
    // Spirit painter brush - stylized brush shape
    ctx.fillStyle = this.style.fillStyle ?? this.color;
    ctx.strokeStyle = this.style.strokeStyle ?? '#2a2a2a';
    ctx.lineWidth = this.style.lineWidth ?? 2;

    // Brush handle
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.3, -this.size);
    ctx.lineTo(this.size * 0.3, -this.size);
    ctx.lineTo(this.size * 0.2, 0);
    ctx.lineTo(-this.size * 0.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Brush tip (ink-soaked)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.2, 0);
    ctx.quadraticCurveTo(0, this.size * 0.8, this.size * 0.2, 0);
    ctx.closePath();
    ctx.fill();
  }

  private renderInkSplash(ctx: CanvasRenderingContext2D): void {
    // Irregular ink splash shape
    ctx.fillStyle = this.style.fillStyle ?? this.color;
    ctx.beginPath();

    const points = 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const variance = 0.7 + Math.random() * 0.6;
      const r = this.size * variance;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderPaperDemon(ctx: CanvasRenderingContext2D): void {
    // Paper demon - origami-like spirit
    ctx.fillStyle = this.style.fillStyle ?? '#f5f5dc'; // Paper color
    ctx.strokeStyle = this.style.strokeStyle ?? '#8b4513'; // Aged paper outline
    ctx.lineWidth = this.style.lineWidth ?? 2;

    // Main body (folded paper look)
    ctx.beginPath();
    ctx.moveTo(0, -this.size);
    ctx.lineTo(this.size * 0.8, this.size * 0.3);
    ctx.lineTo(0, this.size);
    ctx.lineTo(-this.size * 0.8, this.size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(-this.size * 0.25, -this.size * 0.2, this.size * 0.1, 0, Math.PI * 2);
    ctx.arc(this.size * 0.25, -this.size * 0.2, this.size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSealStamp(ctx: CanvasRenderingContext2D): void {
    // Chinese seal stamp style
    ctx.fillStyle = this.style.fillStyle ?? '#c41e3a'; // Seal red
    ctx.strokeStyle = this.style.strokeStyle ?? '#8b0000';
    ctx.lineWidth = this.style.lineWidth ?? 1;

    // Square seal base
    const halfSize = this.size / 2;
    ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
    ctx.strokeRect(-halfSize, -halfSize, this.size, this.size);

    // Simple character stroke (representing seal character)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-halfSize * 0.5, -halfSize * 0.5);
    ctx.lineTo(halfSize * 0.5, -halfSize * 0.5);
    ctx.moveTo(0, -halfSize * 0.5);
    ctx.lineTo(0, halfSize * 0.5);
    ctx.stroke();
  }
}
