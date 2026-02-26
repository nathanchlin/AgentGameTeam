import { Component } from '../Component';
import type { TetrominoType } from '../../data/tetrominoes';
import { getRotationState, getTetrominoColor, getTetrominoSize } from '../../data/tetrominoes';
import type { RotationState } from '../../utils/tetris/WallKicks';

/**
 * Component for an active tetromino piece
 */
export class TetrominoComponent extends Component {
  public type: TetrominoType;
  public rotation: RotationState;
  public color: string;
  public borderColor: string;
  public isLocked: boolean = false;

  // Grid position (top-left corner of piece matrix)
  public gridX: number;
  public gridY: number;

  constructor(type: TetrominoType, startX: number = 3, startY: number = 0) {
    super();
    this.type = type;
    this.rotation = 0;
    this.gridX = startX;
    this.gridY = startY;

    const colors = getTetrominoColor(type);
    this.color = colors.fill;
    this.borderColor = colors.border;
  }

  /**
   * Get the current rotation matrix
   */
  getMatrix(): number[][] {
    return getRotationState(this.type, this.rotation);
  }

  /**
   * Get the size of this tetromino
   */
  getSize(): number {
    return getTetrominoSize(this.type);
  }

  /**
   * Get all occupied cells in grid coordinates
   */
  getOccupiedCells(): { x: number; y: number }[] {
    const matrix = this.getMatrix();
    const cells: { x: number; y: number }[] = [];

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x]) {
          cells.push({
            x: this.gridX + x,
            y: this.gridY + y,
          });
        }
      }
    }

    return cells;
  }

  /**
   * Move the piece by delta
   */
  move(dx: number, dy: number): void {
    this.gridX += dx;
    this.gridY += dy;
  }

  /**
   * Set the grid position
   */
  setPosition(x: number, y: number): void {
    this.gridX = x;
    this.gridY = y;
  }

  /**
   * Rotate clockwise
   */
  rotateClockwise(): void {
    this.rotation = ((this.rotation + 1) % 4) as RotationState;
  }

  /**
   * Rotate counter-clockwise
   */
  rotateCounterClockwise(): void {
    this.rotation = ((this.rotation + 3) % 4) as RotationState;
  }

  update(_deltaTime: number): void {
    // No automatic updates - controlled by systems
  }
}
