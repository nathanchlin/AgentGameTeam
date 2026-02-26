import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { TetrominoComponent } from '../../components/tetris/TetrominoComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { GravityComponent } from '../../components/tetris/GravityComponent';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';

/**
 * System for handling piece falling and locking
 */
export class GravitySystem {
  private eventBus: EventBus;
  private boardEntity: Entity;
  private pieceEntity: Entity;

  constructor(eventBus: EventBus, boardEntity: Entity, pieceEntity: Entity) {
    this.eventBus = eventBus;
    this.boardEntity = boardEntity;
    this.pieceEntity = pieceEntity;
  }

  /**
   * Update gravity and check for locking
   */
  update(deltaTime: number): void {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const gravity = this.pieceEntity.getComponent(GravityComponent);

    if (!board || !tetromino || !gravity || tetromino.isLocked || board.isGameOver) return;

    // Check if input is frozen
    const skillPool = this.boardEntity.getComponent(SkillPoolComponent);
    if (skillPool?.hasEffect?.('input_freeze')) {
      return; // Can't drop while frozen
    }

    // Check if piece is on ground
    const isOnGround = this.isOnGround(tetromino, board);

    if (isOnGround) {
      // Start or continue lock delay
      if (!gravity.isLocking) {
        gravity.startLocking();
      }

      // Check if lock delay expired
      if (gravity.shouldLock(deltaTime)) {
        this.lockPiece(tetromino, board, gravity);
      }
    } else {
      // Not on ground - stop locking and apply gravity
      if (gravity.isLocking) {
        gravity.stopLocking();
      }

      // Check if it's time to drop
      if (gravity.shouldDrop(deltaTime)) {
        this.dropPiece(tetromino, board, gravity);
      }
    }

    // Update gravity component
    gravity.update(deltaTime);
  }

  /**
   * Check if piece is on the ground (can't move down)
   */
  private isOnGround(tetromino: TetrominoComponent, board: BoardComponent): boolean {
    return !this.canMoveTo(tetromino, board, 0, 1);
  }

  /**
   * Check if piece can move to a position
   */
  private canMoveTo(tetromino: TetrominoComponent, board: BoardComponent, dx: number, dy: number): boolean {
    const cells = tetromino.getOccupiedCells();
    for (const cell of cells) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (!board.isInBounds(newX, newY)) return false;
      if (board.isCellOccupied(newX, newY)) return false;
    }
    return true;
  }

  /**
   * Drop piece by one row
   */
  private dropPiece(tetromino: TetrominoComponent, board: BoardComponent, _gravity: GravityComponent): void {
    if (this.canMoveTo(tetromino, board, 0, 1)) {
      tetromino.move(0, 1);
    }
  }

  /**
   * Lock piece in place
   */
  private lockPiece(tetromino: TetrominoComponent, board: BoardComponent, gravity: GravityComponent): void {
    tetromino.isLocked = true;

    // Place piece on board
    const cells = tetromino.getOccupiedCells();
    for (const cell of cells) {
      board.setCell(cell.x, cell.y, tetromino.color);
    }

    board.piecesPlaced++;

    // Emit lock event
    this.eventBus.emit('tetris:piece_locked', {
      playerId: board.playerId,
      pieceType: tetromino.type,
    });

    // Reset gravity for next piece
    gravity.reset();
  }

  /**
   * Perform a soft drop
   */
  softDrop(): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const gravity = this.pieceEntity.getComponent(GravityComponent);

    if (!board || !tetromino || !gravity || tetromino.isLocked || board.isGameOver) return false;

    gravity.startSoftDrop();
    return true;
  }

  /**
   * Stop soft drop
   */
  stopSoftDrop(): void {
    const gravity = this.pieceEntity.getComponent(GravityComponent);
    if (gravity) {
      gravity.stopSoftDrop();
    }
  }

  /**
   * Perform a hard drop (instant drop and lock)
   */
  hardDrop(): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const gravity = this.pieceEntity.getComponent(GravityComponent);

    if (!board || !tetromino || !gravity || tetromino.isLocked || board.isGameOver) return false;

    // Drop until can't go further
    let dropDistance = 0;
    while (this.canMoveTo(tetromino, board, 0, 1)) {
      tetromino.move(0, 1);
      dropDistance++;
    }

    // Add bonus score for hard drop
    board.score += dropDistance * 2;

    // Lock immediately
    this.lockPiece(tetromino, board, gravity);

    return true;
  }

  /**
   * Check if can move to position (public for collision system)
   */
  canMove(dx: number, dy: number): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino || tetromino.isLocked) return false;
    return this.canMoveTo(tetromino, board, dx, dy);
  }
}
