import type { Entity } from '../../entities/Entity';
import { TetrominoComponent } from '../../components/tetris/TetrominoComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { GravityComponent } from '../../components/tetris/GravityComponent';
import { getRotationState } from '../../data/tetrominoes';
import { getWallKicks, rotateClockwise, rotateCounterClockwise } from '../../utils/tetris/WallKicks';
import type { RotationState } from '../../utils/tetris/WallKicks';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';

/**
 * System for handling piece movement and rotation with SRS wall kicks
 */
export class PieceControlSystem {
  private boardEntity: Entity;
  private pieceEntity: Entity;

  constructor(_eventBus: unknown, boardEntity: Entity, pieceEntity: Entity) {
    this.boardEntity = boardEntity;
    this.pieceEntity = pieceEntity;
  }

  /**
   * Move piece left
   */
  moveLeft(): boolean {
    return this.move(-1, 0);
  }

  /**
   * Move piece right
   */
  moveRight(): boolean {
    return this.move(1, 0);
  }

  /**
   * Move piece down (not soft drop, just one cell)
   */
  moveDown(): boolean {
    return this.move(0, 1);
  }

  /**
   * Generic move function
   */
  move(dx: number, dy: number): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const gravity = this.pieceEntity.getComponent(GravityComponent);

    if (!board || !tetromino || tetromino.isLocked || board.isGameOver) return false;

    // Check if controls are reversed
    const skillPool = this.boardEntity.getComponent(SkillPoolComponent);
    if (skillPool?.hasEffect?.('reverse_controls')) {
      dx = -dx;
    }

    // Check if input is frozen
    if (skillPool?.hasEffect?.('input_freeze')) {
      return false;
    }

    if (this.canMoveTo(tetromino, board, dx, dy)) {
      tetromino.move(dx, dy);

      // Reset lock delay timer if moving horizontally while locking
      if (dy === 0 && gravity?.isLocking) {
        gravity.registerLockMove();
      }

      return true;
    }

    return false;
  }

  /**
   * Rotate clockwise
   */
  rotateClockwise(): boolean {
    return this.rotate(1);
  }

  /**
   * Rotate counter-clockwise
   */
  rotateCounterClockwise(): boolean {
    return this.rotate(-1);
  }

  /**
   * Generic rotate function with SRS wall kicks
   */
  private rotate(direction: number): boolean {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const gravity = this.pieceEntity.getComponent(GravityComponent);

    if (!board || !tetromino || tetromino.isLocked || board.isGameOver) return false;

    // Check if input is frozen
    const skillPool = this.boardEntity.getComponent(SkillPoolComponent);
    if (skillPool?.hasEffect?.('input_freeze')) {
      return false;
    }

    const currentRotation = tetromino.rotation;
    const newRotation =
      direction > 0 ? rotateClockwise(currentRotation) : rotateCounterClockwise(currentRotation);

    // Get wall kick offsets to try
    const kicks = getWallKicks(tetromino.type, currentRotation, newRotation);

    // Try each wall kick
    for (const [kickX, kickY] of kicks) {
      if (this.tryRotation(tetromino, board, newRotation, kickX, kickY)) {
        // Rotation successful
        tetromino.rotation = newRotation;
        tetromino.gridX += kickX;
        tetromino.gridY += kickY;

        // Reset lock delay if rotating while locking
        if (gravity?.isLocking) {
          gravity.registerLockMove();
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Try a rotation with a specific offset
   */
  private tryRotation(
    tetromino: TetrominoComponent,
    board: BoardComponent,
    newRotation: RotationState,
    offsetX: number,
    offsetY: number
  ): boolean {
    const newMatrix = getRotationState(tetromino.type, newRotation);

    // Check if all cells are valid
    for (let y = 0; y < newMatrix.length; y++) {
      for (let x = 0; x < newMatrix[y].length; x++) {
        if (newMatrix[y][x]) {
          const boardX = tetromino.gridX + x + offsetX;
          const boardY = tetromino.gridY + y + offsetY;

          if (!board.isInBounds(boardX, boardY)) return false;
          if (board.isCellOccupied(boardX, boardY)) return false;
        }
      }
    }

    return true;
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
   * Move piece to specific position (for AI)
   */
  moveTo(targetX: number, targetRotation: number): boolean {
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const board = this.boardEntity.getComponent(BoardComponent);

    if (!tetromino || !board || tetromino.isLocked) return false;

    // First rotate to target
    while (tetromino.rotation !== targetRotation) {
      if (!this.rotateClockwise()) {
        // Try counter-clockwise if clockwise fails
        if (!this.rotateCounterClockwise()) {
          break;
        }
      }
    }

    // Then move to target X
    while (tetromino.gridX !== targetX) {
      if (tetromino.gridX < targetX) {
        if (!this.moveRight()) break;
      } else {
        if (!this.moveLeft()) break;
      }
    }

    return true;
  }

  /**
   * Get ghost piece Y position (where piece would land)
   */
  getGhostY(): number {
    const board = this.boardEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino) return 0;

    let ghostY = tetromino.gridY;
    while (this.canMoveTo(tetromino, board, tetromino.gridX - tetromino.gridX, ghostY + 1 - tetromino.gridY)) {
      ghostY++;
    }
    return ghostY;
  }

  update(_deltaTime: number): void {
    // Control is handled by events and direct method calls
  }
}
