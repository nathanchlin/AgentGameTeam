import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { TetrominoComponent } from '../../components/tetris/TetrominoComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { PieceQueueComponent } from '../../components/tetris/PieceQueueComponent';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';
import type { TetrominoType } from '../../data/tetrominoes';
import { getTetrominoSize } from '../../data/tetrominoes';

/**
 * System for spawning and managing tetromino pieces
 */
export class PieceSpawnSystem {
  private eventBus: EventBus;
  private boardEntity: Entity;

  constructor(eventBus: EventBus, boardEntity: Entity) {
    this.eventBus = eventBus;
    this.boardEntity = boardEntity;
  }

  /**
   * Spawn a new piece at the top of the board
   */
  spawnPiece(queue: PieceQueueComponent, pieceEntity: Entity): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    if (!board || board.isGameOver) return false;

    const tetromino = pieceEntity.getComponent(TetrominoComponent);
    if (!tetromino) return false;

    // Get next piece from queue
    const nextType = queue.getNextPiece();
    const spawnX = Math.floor((board.width - getTetrominoSize(nextType)) / 2);
    const spawnY = 0; // Spawn in the buffer zone

    // Update tetromino component with new piece
    tetromino.type = nextType;
    tetromino.rotation = 0;
    tetromino.gridX = spawnX;
    tetromino.gridY = spawnY;
    tetromino.isLocked = false;

    const colors = getTetrominoSize(nextType) ? this.getColors(nextType) : { fill: '#fff', border: '#aaa' };
    tetromino.color = colors.fill;
    tetromino.borderColor = colors.border;

    // Check for game over (spawn position blocked)
    if (!this.canSpawn(tetromino, board)) {
      board.isGameOver = true;
      this.eventBus.emit('game:over', {
        playerId: board.playerId,
        reason: 'top_out',
      });
      return false;
    }

    // Emit spawn event
    this.eventBus.emit('tetris:piece_spawned', {
      playerId: board.playerId,
      pieceType: nextType,
    });

    return true;
  }

  /**
   * Check if a piece can spawn
   */
  private canSpawn(tetromino: TetrominoComponent, board: BoardComponent): boolean {
    const cells = tetromino.getOccupiedCells();
    for (const cell of cells) {
      if (!board.isCellEmpty(cell.x, cell.y)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Handle hold piece
   */
  holdPiece(queue: PieceQueueComponent, pieceEntity: Entity): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino || tetromino.isLocked) return false;

    // Check if hold is disabled by skill effect
    const skillPool = this.boardEntity.getComponent(SkillPoolComponent);
    if (skillPool?.hasEffect?.('disable_hold')) return false;

    const currentType = tetromino.type;
    const result = queue.holdPiece(currentType);

    if (result !== null) {
      // Update current piece to the held/returned piece
      tetromino.type = result;
      tetromino.rotation = 0;
      tetromino.gridX = Math.floor((board.width - getTetrominoSize(result)) / 2);
      tetromino.gridY = 0;
      tetromino.isLocked = false;

      const colors = this.getColors(result);
      tetromino.color = colors.fill;
      tetromino.borderColor = colors.border;

      this.eventBus.emit('tetris:hold_used', {
        playerId: board.playerId,
        heldType: currentType,
        newType: result,
      });

      return true;
    }

    return false;
  }

  /**
   * Get colors for a tetromino type
   */
  private getColors(type: TetrominoType): { fill: string; border: string } {
    const colorMap: Record<TetrominoType, { fill: string; border: string }> = {
      I: { fill: '#00f0f0', border: '#00a0a0' },
      O: { fill: '#f0f000', border: '#a0a000' },
      T: { fill: '#a000f0', border: '#7000a0' },
      S: { fill: '#00f000', border: '#00a000' },
      Z: { fill: '#f00000', border: '#a00000' },
      J: { fill: '#0000f0', border: '#0000a0' },
      L: { fill: '#f0a000', border: '#a07000' },
    };
    return colorMap[type];
  }

  update(_deltaTime: number): void {
    // Spawning is triggered by events, not continuous updates
  }
}
