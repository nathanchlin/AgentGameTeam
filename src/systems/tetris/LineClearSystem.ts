import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';
import { calculateSkillPoints } from '../../data/skills';

/**
 * Line clear animation state
 */
interface LineClearAnimation {
  rows: number[];
  timer: number;
  duration: number;
}

/**
 * System for detecting and clearing complete lines
 */
export class LineClearSystem {
  private eventBus: EventBus;
  private boardEntity: Entity;
  private clearingAnimation: LineClearAnimation | null = null;
  private isClearing: boolean = false;

  // Animation duration in seconds
  private readonly CLEAR_DURATION = 0.3;

  constructor(eventBus: EventBus, boardEntity: Entity) {
    this.eventBus = eventBus;
    this.boardEntity = boardEntity;
  }

  /**
   * Check for and clear complete lines
   */
  checkAndClear(): number {
    if (this.isClearing) return 0;

    const board = this.boardEntity.getComponent(BoardComponent);
    if (!board) return 0;

    const completeRows = board.getCompleteRows();
    if (completeRows.length === 0) return 0;

    // Start clear animation
    this.isClearing = true;
    this.clearingAnimation = {
      rows: completeRows,
      timer: 0,
      duration: this.CLEAR_DURATION,
    };

    return completeRows.length;
  }

  /**
   * Update line clear animation and finish clearing
   */
  update(deltaTime: number): void {
    if (!this.isClearing || !this.clearingAnimation) return;

    this.clearingAnimation.timer += deltaTime;

    if (this.clearingAnimation.timer >= this.clearingAnimation.duration) {
      this.finishClear();
    }
  }

  /**
   * Complete the line clear
   */
  private finishClear(): void {
    const board = this.boardEntity.getComponent(BoardComponent);
    const skillPool = this.boardEntity.getComponent(SkillPoolComponent);

    if (!board || !this.clearingAnimation) {
      this.isClearing = false;
      this.clearingAnimation = null;
      return;
    }

    const linesCleared = this.clearingAnimation.rows.length;

    // Clear rows (from bottom to top to maintain indices)
    const sortedRows = [...this.clearingAnimation.rows].sort((a, b) => b - a);
    for (const row of sortedRows) {
      board.clearRow(row);
    }

    // Update stats
    board.linesCleared += linesCleared;

    // Calculate score
    const lineScore = this.calculateLineScore(linesCleared);
    board.score += lineScore;

    // Calculate and award skill points
    if (skillPool) {
      const combo = linesCleared > 0 ? skillPool.combo : 0;
      const sp = calculateSkillPoints(linesCleared, combo);

      if (sp > 0) {
        skillPool.addSkillPoints(sp);
        this.eventBus.emit('skill:points_earned', {
          playerId: board.playerId,
          amount: sp,
          linesCleared,
          combo,
        });

        // Increment combo
        skillPool.incrementCombo();
      } else if (linesCleared === 0) {
        // Reset combo on no clear
        skillPool.resetCombo();
      }
    }

    // Emit line clear event
    this.eventBus.emit('tetris:lines_cleared', {
      playerId: board.playerId,
      count: linesCleared,
      totalLines: board.linesCleared,
      score: board.score,
    });

    this.isClearing = false;
    this.clearingAnimation = null;
  }

  /**
   * Calculate score for line clears
   */
  private calculateLineScore(lines: number): number {
    const baseScores: Record<number, number> = {
      1: 100,
      2: 300,
      3: 500,
      4: 800, // Tetris
    };
    return baseScores[lines] || 0;
  }

  /**
   * Check if currently clearing lines
   */
  getIsClearing(): boolean {
    return this.isClearing;
  }

  /**
   * Get rows being cleared (for rendering)
   */
  getClearingRows(): number[] {
    return this.clearingAnimation?.rows || [];
  }

  /**
   * Get clear animation progress (0-1)
   */
  getClearProgress(): number {
    if (!this.clearingAnimation) return 1;
    return this.clearingAnimation.timer / this.clearingAnimation.duration;
  }

  /**
   * Force clear all complete lines without animation
   */
  forceClear(): number {
    const board = this.boardEntity.getComponent(BoardComponent);
    if (!board) return 0;

    const completeRows = board.getCompleteRows();
    const sortedRows = [...completeRows].sort((a, b) => b - a);

    for (const row of sortedRows) {
      board.clearRow(row);
    }

    return completeRows.length;
  }
}
