import type { Entity } from '../../entities/Entity';
import type { Engine } from '../../core/Engine';
import { TetrominoComponent } from '../../components/tetris/TetrominoComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { PieceQueueComponent } from '../../components/tetris/PieceQueueComponent';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';
import { getRotationState, TETROMINO_COLORS } from '../../data/tetrominoes';
import { LineClearSystem } from './LineClearSystem';
import { PieceControlSystem } from './PieceControlSystem';

/**
 * Renders two Tetris boards side by side
 */
export class BoardRenderSystem {
  private engine: Engine;
  private playerBoardEntity: Entity;
  private aiBoardEntity: Entity;
  private playerPieceEntity: Entity;
  private aiPieceEntity: Entity;
  private playerControlSystem: PieceControlSystem;
  private aiControlSystem: PieceControlSystem;
  private playerLineClearSystem: LineClearSystem;
  private aiLineClearSystem: LineClearSystem;

  // Board display settings
  private readonly CELL_SIZE = 24;
  private readonly BOARD_PADDING = 20;
  private readonly BOARD_GAP = 40;
  private readonly PREVIEW_SIZE = 16;
  private readonly HOLD_SIZE = 16;

  // Colors
  private readonly BOARD_BG = '#1a1a2e';
  private readonly GRID_COLOR = '#2a2a3e';
  private readonly GHOST_ALPHA = 0.3;
  private readonly BORDER_COLOR = '#4a4a6e';

  constructor(
    engine: Engine,
    playerBoardEntity: Entity,
    aiBoardEntity: Entity,
    playerPieceEntity: Entity,
    aiPieceEntity: Entity,
    playerControlSystem: PieceControlSystem,
    aiControlSystem: PieceControlSystem,
    playerLineClearSystem: LineClearSystem,
    aiLineClearSystem: LineClearSystem
  ) {
    this.engine = engine;
    this.playerBoardEntity = playerBoardEntity;
    this.aiBoardEntity = aiBoardEntity;
    this.playerPieceEntity = playerPieceEntity;
    this.aiPieceEntity = aiPieceEntity;
    this.playerControlSystem = playerControlSystem;
    this.aiControlSystem = aiControlSystem;
    this.playerLineClearSystem = playerLineClearSystem;
    this.aiLineClearSystem = aiLineClearSystem;
  }

  /**
   * Render both boards
   */
  render(ctx: CanvasRenderingContext2D): void {
    const canvasWidth = this.engine.width;
    const boardWidth = this.CELL_SIZE * 10;
    const totalWidth = boardWidth * 2 + this.BOARD_GAP;
    const startX = (canvasWidth - totalWidth) / 2;

    // Player board (left)
    this.renderBoard(ctx, this.playerBoardEntity, this.playerPieceEntity, startX, this.playerControlSystem, this.playerLineClearSystem, true);

    // AI board (right)
    const aiStartX = startX + boardWidth + this.BOARD_GAP;
    this.renderBoard(ctx, this.aiBoardEntity, this.aiPieceEntity, aiStartX, this.aiControlSystem, this.aiLineClearSystem, false);

    // Render skill UI
    this.renderSkillUI(ctx, startX);
  }

  /**
   * Render a single board
   */
  private renderBoard(
    ctx: CanvasRenderingContext2D,
    boardEntity: Entity,
    pieceEntity: Entity,
    x: number,
    controlSystem: PieceControlSystem,
    lineClearSystem: LineClearSystem,
    isPlayer: boolean
  ): void {
    const board = boardEntity.getComponent(BoardComponent);
    const tetromino = pieceEntity.getComponent(TetrominoComponent);
    const queue = boardEntity.getComponent(PieceQueueComponent);
    const skillPool = boardEntity.getComponent(SkillPoolComponent);

    if (!board) return;

    const boardHeight = this.CELL_SIZE * board.visibleRows;
    const boardWidth = this.CELL_SIZE * board.width;

    // Check for visual effects
    const hideGhost = skillPool?.hasEffect('hide_ghost');
    const narrowVision = skillPool?.hasEffect('narrow_vision');
    const hidePreview = skillPool?.hasEffect('hide_preview');

    // Board background
    ctx.fillStyle = this.BOARD_BG;
    ctx.fillRect(x, this.BOARD_PADDING, boardWidth, boardHeight);

    // Grid lines
    ctx.strokeStyle = this.GRID_COLOR;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= board.width; gx++) {
      ctx.beginPath();
      ctx.moveTo(x + gx * this.CELL_SIZE, this.BOARD_PADDING);
      ctx.lineTo(x + gx * this.CELL_SIZE, this.BOARD_PADDING + boardHeight);
      ctx.stroke();
    }
    for (let gy = 0; gy <= board.visibleRows; gy++) {
      ctx.beginPath();
      ctx.moveTo(x, this.BOARD_PADDING + gy * this.CELL_SIZE);
      ctx.lineTo(x + boardWidth, this.BOARD_PADDING + gy * this.CELL_SIZE);
      ctx.stroke();
    }

    // Apply narrow vision mask
    if (narrowVision && isPlayer) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(x, this.BOARD_PADDING, boardWidth, boardHeight / 2);
    }

    // Render placed blocks (offset by 4 hidden rows)
    const hiddenRows = board.height - board.visibleRows;
    for (let by = hiddenRows; by < board.height; by++) {
      for (let bx = 0; bx < board.width; bx++) {
        const cell = board.grid[by][bx];
        if (cell) {
          this.renderCell(ctx, x + bx * this.CELL_SIZE, this.BOARD_PADDING + (by - hiddenRows) * this.CELL_SIZE, cell, this.CELL_SIZE);
        }
      }
    }

    // Render clearing lines animation
    if (lineClearSystem.getIsClearing()) {
      const progress = lineClearSystem.getClearProgress();
      const clearingRows = lineClearSystem.getClearingRows();

      for (const row of clearingRows) {
        const displayRow = row - hiddenRows;
        if (displayRow >= 0 && displayRow < board.visibleRows) {
          const flash = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
          ctx.fillRect(x, this.BOARD_PADDING + displayRow * this.CELL_SIZE, boardWidth, this.CELL_SIZE);
        }
      }
    }

    // Render ghost piece
    if (tetromino && !tetromino.isLocked && !hideGhost) {
      const ghostY = controlSystem.getGhostY();
      const hiddenRows = board.height - board.visibleRows;
      this.renderPiece(ctx, tetromino, x + tetromino.gridX * this.CELL_SIZE, this.BOARD_PADDING + (ghostY - hiddenRows) * this.CELL_SIZE, this.CELL_SIZE, true);
    }

    // Render current piece
    if (tetromino && !tetromino.isLocked) {
      const hiddenRows = board.height - board.visibleRows;
      const displayY = tetromino.gridY - hiddenRows;
      this.renderPiece(ctx, tetromino, x + tetromino.gridX * this.CELL_SIZE, this.BOARD_PADDING + displayY * this.CELL_SIZE, this.CELL_SIZE, false);
    }

    // Board border
    ctx.strokeStyle = this.BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, this.BOARD_PADDING, boardWidth, boardHeight);

    // Render hold piece
    if (queue && !hidePreview) {
      this.renderHold(ctx, queue, x - this.HOLD_SIZE * 5 - 10, this.BOARD_PADDING + 10, isPlayer);
    }

    // Render preview queue
    if (queue && !hidePreview) {
      this.renderPreview(ctx, queue, x + boardWidth + 10, this.BOARD_PADDING + 10);
    }

    // Render stats
    this.renderStats(ctx, board, skillPool, x, this.BOARD_PADDING + boardHeight + 10, isPlayer);
  }

  /**
   * Render a single cell
   */
  private renderCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number): void {
    // Main fill
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 2, y + 2, size - 6, 2);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 2, y + size - 4, size - 4, 2);
  }

  /**
   * Render a tetromino piece
   */
  private renderPiece(ctx: CanvasRenderingContext2D, tetromino: TetrominoComponent, x: number, y: number, cellSize: number, isGhost: boolean): void {
    const matrix = tetromino.getMatrix();
    const color = isGhost ? this.lightenColor(tetromino.color, 0.5) : tetromino.color;
    const borderColor = isGhost ? this.lightenColor(tetromino.borderColor, 0.5) : tetromino.borderColor;

    ctx.globalAlpha = isGhost ? this.GHOST_ALPHA : 1;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          const cellX = x + col * cellSize;
          const cellY = y + row * cellSize;

          if (!isGhost) {
            ctx.fillStyle = color;
            ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(cellX + 2, cellY + 2, cellSize - 6, 2);

            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
          } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
          }
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Render hold piece
   */
  private renderHold(ctx: CanvasRenderingContext2D, queue: PieceQueueComponent, x: number, y: number, _isPlayer: boolean): void {
    const canHold = queue.canHold;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, this.HOLD_SIZE * 4 + 10, this.HOLD_SIZE * 4 + 30);

    ctx.fillStyle = canHold ? '#888' : '#555';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD', x + (this.HOLD_SIZE * 4 + 10) / 2, y + 15);

    if (queue.heldPiece) {
      const colors = TETROMINO_COLORS[queue.heldPiece];
      const matrix = getRotationState(queue.heldPiece, 0);

      ctx.globalAlpha = canHold ? 1 : 0.4;

      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
          if (matrix[row][col]) {
            const cellX = x + 5 + col * this.HOLD_SIZE;
            const cellY = y + 22 + row * this.HOLD_SIZE;

            ctx.fillStyle = colors.fill;
            ctx.fillRect(cellX, cellY, this.HOLD_SIZE - 1, this.HOLD_SIZE - 1);
          }
        }
      }

      ctx.globalAlpha = 1;
    }
  }

  /**
   * Render preview queue
   */
  private renderPreview(ctx: CanvasRenderingContext2D, queue: PieceQueueComponent, x: number, y: number): void {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, this.PREVIEW_SIZE * 4 + 10, this.PREVIEW_SIZE * 4 * 5 + 30);

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', x + (this.PREVIEW_SIZE * 4 + 10) / 2, y + 15);

    const preview = queue.getPreview();
    for (let i = 0; i < Math.min(preview.length, 5); i++) {
      const pieceType = preview[i];
      const colors = TETROMINO_COLORS[pieceType];
      const matrix = getRotationState(pieceType, 0);

      const offsetY = y + 22 + i * (this.PREVIEW_SIZE * 3 + 5);

      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
          if (matrix[row][col]) {
            const cellX = x + 5 + col * this.PREVIEW_SIZE;
            const cellY = offsetY + row * this.PREVIEW_SIZE;

            ctx.fillStyle = colors.fill;
            ctx.fillRect(cellX, cellY, this.PREVIEW_SIZE - 1, this.PREVIEW_SIZE - 1);
          }
        }
      }
    }
  }

  /**
   * Render stats
   */
  private renderStats(ctx: CanvasRenderingContext2D, board: BoardComponent, skillPool: SkillPoolComponent | undefined, x: number, y: number, isPlayer: boolean): void {
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';

    const label = isPlayer ? 'PLAYER' : 'AI';
    ctx.fillStyle = isPlayer ? '#4af' : '#f44';
    ctx.fillText(label, x, y);

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Lines: ${board.linesCleared}`, x, y + 18);
    ctx.fillText(`Score: ${board.score}`, x, y + 34);

    if (skillPool) {
      ctx.fillStyle = '#ff0';
      ctx.fillText(`SP: ${skillPool.skillPoints}`, x, y + 50);
    }
  }

  /**
   * Render skill UI for player
   */
  private renderSkillUI(ctx: CanvasRenderingContext2D, startX: number): void {
    const skillPool = this.playerBoardEntity.getComponent(SkillPoolComponent);
    if (!skillPool) return;

    const y = this.engine.height - 60;
    const skillWidth = 50;
    const skillHeight = 40;
    const gap = 5;

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    skillPool.skills.forEach((skill, index) => {
      const x = startX + index * (skillWidth + gap);
      const canUse = skillPool.canUseSkill(skill.id);
      const cooldown = skillPool.getCooldown(skill.id);

      // Background
      ctx.fillStyle = canUse ? '#2a4a2a' : '#2a2a3e';
      ctx.fillRect(x, y, skillWidth, skillHeight);

      // Border
      ctx.strokeStyle = canUse ? '#4f4' : '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, skillWidth, skillHeight);

      // Skill name
      ctx.fillStyle = canUse ? '#fff' : '#666';
      ctx.fillText(skill.name, x + skillWidth / 2, y + 15);

      // Cost/Cooldown
      ctx.fillStyle = '#ff0';
      if (cooldown > 0) {
        ctx.fillText(`${cooldown.toFixed(0)}s`, x + skillWidth / 2, y + 30);
      } else {
        ctx.fillText(`${skill.cost}SP`, x + skillWidth / 2, y + 30);
      }

      // Key hint
      ctx.fillStyle = '#888';
      ctx.fillText(`[${index + 1}]`, x + skillWidth / 2, y + skillHeight - 3);
    });
  }

  /**
   * Lighten a color
   */
  private lightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 255 * amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 255 * amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 255 * amount);
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }
}
