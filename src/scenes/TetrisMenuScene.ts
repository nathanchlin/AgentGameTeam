import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import type { AIDifficulty } from '../components/tetris/AIConfigComponent';

/**
 * Menu scene for selecting AI difficulty
 */
export class TetrisMenuScene extends Scene {
  private engine: Engine;
  private selectedDifficulty: number = 1; // Default to "normal"
  private difficulties: AIDifficulty[] = ['easy', 'normal', 'hard', 'expert'];
  private difficultyLabels: string[] = ['简单', '中等', '困难', '专家'];
  private unsubscribeKeydown?: () => void;

  constructor(engine: Engine) {
    super('TetrisMenuScene');
    this.engine = engine;
  }

  enter(): void {
    super.enter();
    this.setupInputHandlers();
  }

  exit(): void {
    super.exit();
    if (this.unsubscribeKeydown) {
      this.unsubscribeKeydown();
    }
  }

  private setupInputHandlers(): void {
    this.unsubscribeKeydown = this.engine.getEventBus().on('keydown', (data: { key: string }) => {
      this.handleKeyDown(data.key);
    });
  }

  private handleKeyDown(key: string): void {
    switch (key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.selectedDifficulty = Math.max(0, this.selectedDifficulty - 1);
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        this.selectedDifficulty = Math.min(this.difficulties.length - 1, this.selectedDifficulty + 1);
        break;

      case 'Enter':
      case ' ':
        this.startGame();
        break;
    }
  }

  private startGame(): void {
    const difficulty = this.difficulties[this.selectedDifficulty];
    this.engine.getEventBus().emit('tetris:start_game', { difficulty });
  }

  update(_deltaTime: number): void {
    // Menu doesn't need continuous updates
  }

  render(ctx: CanvasRenderingContext2D): void {
    const width = this.engine.width;
    const height = this.engine.height;

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#00f0f0';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TETRIS BATTLE', width / 2, height / 3);

    // Subtitle
    ctx.fillStyle = '#888';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('Player vs AI', width / 2, height / 3 + 40);

    // Difficulty label
    ctx.fillStyle = '#aaa';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('选择AI难度:', width / 2, height / 2);

    // Difficulty options
    const buttonWidth = 80;
    const buttonHeight = 40;
    const gap = 15;
    const totalWidth = this.difficulties.length * buttonWidth + (this.difficulties.length - 1) * gap;
    const startX = (width - totalWidth) / 2;
    const buttonY = height / 2 + 40;

    for (let i = 0; i < this.difficulties.length; i++) {
      const x = startX + i * (buttonWidth + gap);
      const isSelected = i === this.selectedDifficulty;

      // Button background
      ctx.fillStyle = isSelected ? '#2a4a8a' : '#1a1a2e';
      ctx.fillRect(x, buttonY, buttonWidth, buttonHeight);

      // Button border
      ctx.strokeStyle = isSelected ? '#4a8aff' : '#3a3a5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, buttonY, buttonWidth, buttonHeight);

      // Button text
      ctx.fillStyle = isSelected ? '#fff' : '#888';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.difficultyLabels[i], x + buttonWidth / 2, buttonY + buttonHeight / 2);
    }

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('使用 ← → 选择难度，按 Enter 开始游戏', width / 2, height - 80);

    // Controls info
    ctx.fillStyle = '#555';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('控制: ← → 移动 | ↑ 旋转 | ↓ 软降 | Space 硬降 | C 暂存 | 1-6 技能', width / 2, height - 50);
  }
}
