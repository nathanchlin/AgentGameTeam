import { Component } from '../Component';

/**
 * Represents a Tetris game board
 * Standard size is 10 columns x 24 rows (20 visible + 4 buffer)
 */
export class BoardComponent extends Component {
  public readonly width: number = 10;
  public readonly height: number = 24; // 20 visible + 4 hidden rows at top
  public readonly visibleRows: number = 20;

  // The board grid: stores the color of each cell (null = empty)
  public grid: (string | null)[][];

  // Player identification
  public readonly playerId: 'player' | 'ai';

  // Pending garbage lines to add
  public pendingGarbage: number = 0;

  // Game state
  public isGameOver: boolean = false;
  public isPaused: boolean = false;

  // Statistics
  public linesCleared: number = 0;
  public piecesPlaced: number = 0;
  public score: number = 0;

  constructor(playerId: 'player' | 'ai') {
    super();
    this.playerId = playerId;
    this.grid = this.createEmptyGrid();
  }

  /**
   * Create an empty board grid
   */
  private createEmptyGrid(): (string | null)[][] {
    const grid: (string | null)[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid.push(new Array(this.width).fill(null));
    }
    return grid;
  }

  /**
   * Reset the board to empty state
   */
  reset(): void {
    this.grid = this.createEmptyGrid();
    this.pendingGarbage = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.linesCleared = 0;
    this.piecesPlaced = 0;
    this.score = 0;
  }

  /**
   * Check if a cell is within bounds
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Check if a cell is empty
   */
  isCellEmpty(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.grid[y][x] === null;
  }

  /**
   * Check if a cell is occupied
   */
  isCellOccupied(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return true; // Out of bounds = occupied
    return this.grid[y][x] !== null;
  }

  /**
   * Place a cell on the board
   */
  setCell(x: number, y: number, color: string): void {
    if (this.isInBounds(x, y)) {
      this.grid[y][x] = color;
    }
  }

  /**
   * Get a cell's color
   */
  getCell(x: number, y: number): string | null {
    if (!this.isInBounds(x, y)) return null;
    return this.grid[y][x];
  }

  /**
   * Check if a row is complete
   */
  isRowComplete(y: number): boolean {
    if (y < 0 || y >= this.height) return false;
    return this.grid[y].every((cell) => cell !== null);
  }

  /**
   * Clear a specific row and shift rows above down
   */
  clearRow(y: number): void {
    if (y < 0 || y >= this.height) return;

    // Remove the row
    this.grid.splice(y, 1);

    // Add empty row at top
    this.grid.unshift(new Array(this.width).fill(null));
  }

  /**
   * Find all complete rows
   */
  getCompleteRows(): number[] {
    const completeRows: number[] = [];
    for (let y = 0; y < this.height; y++) {
      if (this.isRowComplete(y)) {
        completeRows.push(y);
      }
    }
    return completeRows;
  }

  /**
   * Get the highest occupied row
   */
  getHighestRow(): number {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] !== null) {
          return y;
        }
      }
    }
    return this.height;
  }

  /**
   * Check if the board is topped out
   */
  isToppedOut(): boolean {
    // Check if any blocks are in the hidden area (rows 0-3)
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] !== null) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Add garbage lines at the bottom
   */
  addGarbageLines(count: number, holePosition?: number): void {
    for (let i = 0; i < count; i++) {
      // Remove top row
      this.grid.shift();

      // Add garbage row at bottom with random hole
      const holeX = holePosition ?? Math.floor(Math.random() * this.width);
      const garbageRow: (string | null)[] = new Array(this.width).fill('#555555');
      garbageRow[holeX] = null;

      this.grid.push(garbageRow);
    }
  }

  update(_deltaTime: number): void {
    // Board state is updated by systems
  }
}
