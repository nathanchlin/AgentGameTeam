import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import type { EventBus } from '../core/EventBus';
import type { GameMeta } from '../registry/types';
import type { GameRegistry } from '../registry/GameRegistry';

interface CardPosition {
  col: number;
  row: number;
}

/**
 * Home scene displaying all available games as a card grid.
 * Supports keyboard navigation and mouse selection.
 */
export class HomeScene extends Scene {
  private engine: Engine;
  private eventBus: EventBus;
  private registry: GameRegistry;
  private games: GameMeta[] = [];

  // Layout
  private cardWidth = 200;
  private cardHeight = 280;
  private cardPadding = 20;
  private gridStartY = 120;

  // Navigation
  private selectedIndex = 0;
  private gridCols = 3;
  private hoveredIndex: number = -1;

  // Animation
  private animationTime = 0;
  private decorationParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

  constructor(engine: Engine, registry: GameRegistry) {
    super('HomeScene');
    this.engine = engine;
    this.eventBus = engine.getEventBus();
    this.registry = registry;
  }

  enter(): void {
    super.enter();
    this.games = this.registry.getAllGames();
    this.selectedIndex = 0;
    this.hoveredIndex = -1;
    this.animationTime = 0;
    this.calculateGrid();
    this.setupEventHandlers();
    this.initDecorationParticles();
    console.log('Home scene loaded. Use arrow keys or click to select a game.');
  }

  exit(): void {
    super.exit();
    this.eventBus.off('keydown', this.handleKeyDown);
    this.eventBus.off('click', this.handleClick);
    this.eventBus.off('mousemove', this.handleMouseMove);
  }

  private calculateGrid(): void {
    const totalWidth = this.engine.width - this.cardPadding * 2;
    this.gridCols = Math.max(1, Math.floor(totalWidth / (this.cardWidth + this.cardPadding)));
  }

  private initDecorationParticles(): void {
    this.decorationParticles = [];
    for (let i = 0; i < 15; i++) {
      this.decorationParticles.push({
        x: Math.random() * this.engine.width,
        y: Math.random() * this.engine.height,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: Math.random() * 4 + 2,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }
  }

  private setupEventHandlers(): void {
    this.eventBus.on('keydown', this.handleKeyDown);
    this.eventBus.on('click', this.handleClick);
    this.eventBus.on('mousemove', this.handleMouseMove);
  }

  private handleKeyDown = (data: { key: string }): void => {
    const key = data.key;

    switch (key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.moveSelection(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.moveSelection(1, 0);
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.moveSelection(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.moveSelection(0, 1);
        break;
      case 'Enter':
      case ' ':
        this.selectCurrentGame();
        break;
    }
  };

  private handleClick = (data: { x: number; y: number }): void => {
    const index = this.getCardAtPosition(data.x, data.y);
    if (index >= 0) {
      this.selectedIndex = index;
      this.selectCurrentGame();
    }
  };

  private handleMouseMove = (data: { x: number; y: number }): void => {
    this.hoveredIndex = this.getCardAtPosition(data.x, data.y);
  };

  private getCardAtPosition(x: number, y: number): number {
    for (let i = 0; i < this.games.length; i++) {
      const pos = this.getCardPosition(i);
      const cardX = pos.col * (this.cardWidth + this.cardPadding) + this.cardPadding;
      const cardY = pos.row * (this.cardHeight + this.cardPadding) + this.gridStartY;

      if (x >= cardX && x <= cardX + this.cardWidth && y >= cardY && y <= cardY + this.cardHeight) {
        return i;
      }
    }
    return -1;
  }

  private getCardPosition(index: number): CardPosition {
    return {
      col: index % this.gridCols,
      row: Math.floor(index / this.gridCols),
    };
  }

  private moveSelection(dx: number, dy: number): void {
    const pos = this.getCardPosition(this.selectedIndex);
    let newCol = pos.col + dx;
    let newRow = pos.row + dy;

    // Wrap horizontally
    if (newCol < 0) {
      newCol = this.gridCols - 1;
      newRow--;
    } else if (newCol >= this.gridCols) {
      newCol = 0;
      newRow++;
    }

    // Clamp vertically
    const maxRow = Math.floor((this.games.length - 1) / this.gridCols);
    newRow = Math.max(0, Math.min(maxRow, newRow));

    const newIndex = newRow * this.gridCols + newCol;
    if (newIndex >= 0 && newIndex < this.games.length) {
      this.selectedIndex = newIndex;
    }
  }

  private selectCurrentGame(): void {
    const game = this.games[this.selectedIndex];
    if (game) {
      console.log(`Launching game: ${game.nameZh}`);
      this.registry.launchGame(game.id);
    }
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    // Update decoration particles
    for (const particle of this.decorationParticles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Wrap around screen
      if (particle.x < 0) particle.x = this.engine.width;
      if (particle.x > this.engine.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.engine.height;
      if (particle.y > this.engine.height) particle.y = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw gradient background
    this.drawBackground(ctx);

    // Draw decoration particles
    this.drawDecorations(ctx);

    // Draw title
    this.drawTitle(ctx);

    // Draw game cards
    this.drawCards(ctx);

    // Draw navigation hints
    this.drawHints(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.engine.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);
  }

  private drawDecorations(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const particle of this.decorationParticles) {
      ctx.fillStyle = `rgba(56, 189, 248, ${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTitle(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Main title with glow effect
    const glowIntensity = Math.sin(this.animationTime * 2) * 0.2 + 0.8;
    ctx.shadowColor = `rgba(56, 189, 248, ${glowIntensity})`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 42px "Segoe UI", sans-serif';
    ctx.fillText('AGENT GAME TEAM', this.engine.width / 2, 50);

    // Subtitle
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Select a game to play', this.engine.width / 2, 85);

    ctx.restore();
  }

  private drawCards(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.games.length; i++) {
      const pos = this.getCardPosition(i);
      const x = pos.col * (this.cardWidth + this.cardPadding) + this.cardPadding;
      const y = pos.row * (this.cardHeight + this.cardPadding) + this.gridStartY;
      const isSelected = i === this.selectedIndex;
      const isHovered = i === this.hoveredIndex;

      this.drawCard(ctx, x, y, this.games[i], isSelected, isHovered);
    }
  }

  private drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, game: GameMeta, isSelected: boolean, isHovered: boolean): void {
    ctx.save();

    // Card background with rounded corners
    const radius = 12;
    ctx.beginPath();
    ctx.roundRect(x, y, this.cardWidth, this.cardHeight, radius);

    // Background gradient
    const bgGradient = ctx.createLinearGradient(x, y, x, y + this.cardHeight);
    if (isSelected || isHovered) {
      bgGradient.addColorStop(0, '#1e3a5f');
      bgGradient.addColorStop(1, '#0f2744');
    } else {
      bgGradient.addColorStop(0, '#1e293b');
      bgGradient.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Selection border glow
    if (isSelected) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (isHovered) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Game icon/thumbnail area
    const iconY = y + 15;
    const iconSize = 60;
    const iconX = x + (this.cardWidth - iconSize) / 2;
    this.drawGameIcon(ctx, iconX, iconY, iconSize, game);

    // Game name (Chinese)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(game.nameZh, x + this.cardWidth / 2, y + 90);

    // Game name (English)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(game.name, x + this.cardWidth / 2, y + 115);

    // Difficulty indicator
    this.drawDifficultyIndicator(ctx, x + this.cardWidth / 2, y + 145, game.difficulty);

    // Category tag
    this.drawCategoryTag(ctx, x + 10, y + 170, game.category);

    // Estimated play time
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${game.estimatedPlayTime}`, x + 15, y + 200);

    // Controls hint
    ctx.fillStyle = '#475569';
    ctx.font = '10px "Segoe UI", sans-serif';
    const controlText = game.controls[0] || '';
    ctx.fillText(controlText, x + 15, y + 220);

    // Tags
    ctx.textAlign = 'left';
    let tagX = x + 15;
    const tagY = y + 245;
    for (const tag of game.tags.slice(0, 2)) {
      ctx.fillStyle = '#334155';
      const tagWidth = ctx.measureText(tag).width + 10;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY - 10, tagWidth, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(tag, tagX + 5, tagY);
      tagX += tagWidth + 5;
    }

    ctx.restore();
  }

  private drawGameIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, game: GameMeta): void {
    ctx.save();

    // Draw icon based on game category/id
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    switch (game.id) {
      case 'snake':
        this.drawSnakeIcon(ctx, centerX, centerY, size);
        break;
      case 'bulletHell':
        this.drawBulletHellIcon(ctx, centerX, centerY, size);
        break;
      case 'tetris':
        this.drawTetrisIcon(ctx, centerX, centerY, size);
        break;
      default:
        this.drawDefaultIcon(ctx, centerX, centerY, size, game.category);
    }

    ctx.restore();
  }

  private drawSnakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const unit = size / 8;

    // Snake body
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;

    // Draw snake segments in an S pattern
    const segments = [
      { x: cx - unit * 2, y: cy },
      { x: cx - unit, y: cy },
      { x: cx, y: cy },
      { x: cx, y: cy - unit },
      { x: cx, y: cy - unit * 2 },
      { x: cx + unit, y: cy - unit * 2 },
    ];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, unit * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Eye on head
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(segments[0].x - unit * 0.3, segments[0].y - unit * 0.2, unit * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBulletHellIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const unit = size / 8;

    // Player (ink brush shape)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, unit * 1.5, unit * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bullets around
    ctx.fillStyle = '#c41e3a';
    const bulletPositions = [
      { x: cx - unit * 2.5, y: cy - unit },
      { x: cx + unit * 2.5, y: cy - unit },
      { x: cx - unit * 2, y: cy + unit * 2 },
      { x: cx + unit * 2, y: cy + unit * 2 },
      { x: cx, y: cy - unit * 3 },
    ];

    for (const pos of bulletPositions) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, unit * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTetrisIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const unit = size / 10;

    // Draw Tetris blocks
    const colors = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];
    const pieces = [
      // T piece
      { x: cx - unit, y: cy - unit * 1.5, color: colors[2] },
      { x: cx, y: cy - unit * 1.5, color: colors[2] },
      { x: cx + unit, y: cy - unit * 1.5, color: colors[2] },
      { x: cx, y: cy - unit * 0.5, color: colors[2] },
      // L piece
      { x: cx - unit * 2, y: cy + unit * 0.5, color: colors[4] },
      { x: cx - unit * 2, y: cy + unit * 1.5, color: colors[4] },
      { x: cx - unit, y: cy + unit * 1.5, color: colors[4] },
      { x: cx, y: cy + unit * 1.5, color: colors[4] },
    ];

    for (const piece of pieces) {
      ctx.fillStyle = piece.color;
      ctx.fillRect(piece.x - unit * 0.45, piece.y - unit * 0.45, unit * 0.9, unit * 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(piece.x - unit * 0.45, piece.y - unit * 0.45, unit * 0.9, unit * 0.9);
    }
  }

  private drawDefaultIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, category: string): void {
    const colors: Record<string, string> = {
      arcade: '#f59e0b',
      puzzle: '#8b5cf6',
      action: '#ef4444',
      strategy: '#10b981',
    };

    ctx.fillStyle = colors[category] || '#64748b';
    ctx.beginPath();
    ctx.arc(cx, cy, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Play symbol
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - size / 10, cy - size / 6);
    ctx.lineTo(cx - size / 10, cy + size / 6);
    ctx.lineTo(cx + size / 6, cy);
    ctx.closePath();
    ctx.fill();
  }

  private drawDifficultyIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, difficulty: string): void {
    const levels: Record<string, { stars: number; color: string }> = {
      easy: { stars: 1, color: '#22c55e' },
      medium: { stars: 2, color: '#f59e0b' },
      hard: { stars: 3, color: '#ef4444' },
    };

    const config = levels[difficulty] || levels.medium;

    ctx.textAlign = 'center';
    ctx.font = '12px "Segoe UI", sans-serif';

    for (let i = 0; i < 3; i++) {
      const starX = x + (i - 1) * 18;
      ctx.fillStyle = i < config.stars ? config.color : '#334155';
      ctx.fillText('★', starX, y);
    }
  }

  private drawCategoryTag(ctx: CanvasRenderingContext2D, x: number, y: number, category: string): void {
    const labels: Record<string, string> = {
      arcade: '街机',
      puzzle: '益智',
      action: '动作',
      strategy: '策略',
    };

    const colors: Record<string, string> = {
      arcade: '#f59e0b',
      puzzle: '#8b5cf6',
      action: '#ef4444',
      strategy: '#10b981',
    };

    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '11px "Segoe UI", sans-serif';

    const label = labels[category] || category;
    const width = ctx.measureText(label).width + 10;

    ctx.fillStyle = colors[category] || '#64748b';
    ctx.beginPath();
    ctx.roundRect(x, y - 12, width, 18, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 5, y);

    ctx.restore();
  }

  private drawHints(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('↑↓←→ / WASD: Navigate  |  Enter / Click: Select  |  Escape: Return to Home', this.engine.width / 2, this.engine.height - 20);
    ctx.restore();
  }
}
