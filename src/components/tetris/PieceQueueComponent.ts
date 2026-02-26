import { Component } from '../Component';
import type { TetrominoType } from '../../data/tetrominoes';
import { ALL_TETROMINO_TYPES } from '../../data/tetrominoes';

/**
 * Manages the piece queue using 7-bag randomizer
 * Ensures fair distribution of pieces
 */
export class PieceQueueComponent extends Component {
  // Preview queue (typically 3-5 pieces shown)
  public readonly previewSize: number = 5;
  public queue: TetrominoType[] = [];

  // Currently held piece (null if empty or hold used this turn)
  public heldPiece: TetrominoType | null = null;
  public canHold: boolean = true;

  // Current bag for 7-bag randomizer
  private bag: TetrominoType[] = [];

  constructor() {
    super();
    this.initializeQueue();
  }

  /**
   * Initialize the queue with pieces
   */
  private initializeQueue(): void {
    // Fill the queue
    while (this.queue.length < this.previewSize + 1) {
      this.queue.push(this.getNextFromBag());
    }
  }

  /**
   * Get next piece from the 7-bag
   */
  private getNextFromBag(): TetrominoType {
    if (this.bag.length === 0) {
      // Create a new shuffled bag
      this.bag = [...ALL_TETROMINO_TYPES];
      this.shuffleBag();
    }

    return this.bag.pop()!;
  }

  /**
   * Shuffle the bag using Fisher-Yates algorithm
   */
  private shuffleBag(): void {
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }

  /**
   * Get the next piece and advance the queue
   */
  getNextPiece(): TetrominoType {
    const piece = this.queue.shift()!;
    this.queue.push(this.getNextFromBag());
    this.canHold = true;
    return piece;
  }

  /**
   * Peek at the next piece without advancing
   */
  peekNextPiece(): TetrominoType {
    return this.queue[0];
  }

  /**
   * Get the preview pieces (excluding the current piece)
   */
  getPreview(): TetrominoType[] {
    return this.queue.slice(1, this.previewSize + 1);
  }

  /**
   * Hold the current piece
   * @param currentPiece - The piece currently in play
   * @returns The piece to use next (from hold or queue)
   */
  holdPiece(currentPiece: TetrominoType): TetrominoType | null {
    if (!this.canHold) return null;

    this.canHold = false;

    if (this.heldPiece === null) {
      // First hold - get from queue
      this.heldPiece = currentPiece;
      return this.getNextPiece();
    } else {
      // Swap with held piece
      const temp = this.heldPiece;
      this.heldPiece = currentPiece;
      return temp;
    }
  }

  /**
   * Reset the queue
   */
  reset(): void {
    this.queue = [];
    this.bag = [];
    this.heldPiece = null;
    this.canHold = true;
    this.initializeQueue();
  }

  /**
   * Shuffle the preview queue (for AI chaos skill)
   */
  shufflePreview(): void {
    // Keep the first piece, shuffle the rest
    const first = this.queue[0];
    const rest = this.queue.slice(1);

    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    this.queue = [first, ...rest];
  }

  update(_deltaTime: number): void {
    // Queue is managed by systems
  }
}
