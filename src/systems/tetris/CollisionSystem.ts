import type { Entity } from '../../entities/Entity';
import { TetrominoComponent } from '../../components/tetris/TetrominoComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';

/**
 * System for detecting collisions on the Tetris board
 */
export class CollisionSystem {
  private boardEntity: Entity;
  private pieceEntity: Entity;

  constructor(boardEntity: Entity, pieceEntity: Entity) {
    this.boardEntity = boardEntity;
    this.pieceEntity = pieceEntity;
  }

  /**
   * Check if piece can move in a direction
   */
  canMove(dx: number, dy: number): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino || tetromino.isLocked) return false;

    return this.isValidPosition(tetromino, board, tetromino.gridX + dx, tetromino.gridY + dy);
  }

  /**
   * Check if a position is valid for the current piece
   */
  isValidPosition(tetromino: TetrominoComponent, board: BoardComponent, x: number, y: number): boolean {
    const matrix = tetromino.getMatrix();

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          const boardX = x + col;
          const boardY = y + row;

          // Check bounds
          if (boardX < 0 || boardX >= board.width) return false;
          if (boardY < 0 || boardY >= board.height) return false;

          // Check collision with placed pieces
          if (board.isCellOccupied(boardX, boardY)) return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if piece is on ground
   */
  isOnGround(): boolean {
    return !this.canMove(0, 1);
  }

  /**
   * Check if piece would collide at a specific position
   */
  wouldCollideAt(x: number, y: number): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino) return true;

    return !this.isValidPosition(tetromino, board, x, y);
  }

  /**
   * Check if spawn position is blocked (game over condition)
   */
  isSpawnBlocked(): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino) return true;

    return !this.isValidPosition(tetromino, board, tetromino.gridX, tetromino.gridY);
  }

  /**
   * Get the landing position (hard drop target)
   */
  getLandingY(): number {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino) return 0;

    let y = tetromino.gridY;
    while (this.isValidPosition(tetromino, board, tetromino.gridX, y + 1)) {
      y++;
    }
    return y;
  }

  /**
   * Check if a rotation is possible at current position
   */
  canRotate(_clockwise: boolean): boolean {
    // Rotation checks are handled by PieceControlSystem with wall kicks
    // This is a simplified check
    return true;
  }

  /**
   * Get all cells that would be occupied at a position
   */
  getOccupiedCellsAt(x: number, y: number, _rotation: number): { x: number; y: number }[] {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino) return [];

    const cells: { x: number; y: number }[] = [];
    const matrix = tetromino.getMatrix();

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          cells.push({
            x: x + col,
            y: y + row,
          });
        }
      }
    }

    return cells;
  }

  update(_deltaTime: number): void {
    // Collision checks are done on demand
  }
}
