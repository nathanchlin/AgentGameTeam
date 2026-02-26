import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { BoardComponent } from '../../components/tetris/BoardComponent';

/**
 * System for handling garbage lines
 */
export class GarbageSystem {
  private eventBus: EventBus;
  private playerEntity: Entity;
  private aiEntity: Entity;

  constructor(eventBus: EventBus, playerEntity: Entity, aiEntity: Entity) {
    this.eventBus = eventBus;
    this.playerEntity = playerEntity;
    this.aiEntity = aiEntity;
  }

  /**
   * Add garbage lines to a player
   */
  addGarbageLines(targetId: 'player' | 'ai', count: number): void {
    const targetEntity = targetId === 'player' ? this.playerEntity : this.aiEntity;
    const board = targetEntity.getComponent(BoardComponent);

    if (!board) return;

    // Add to pending garbage
    board.pendingGarbage += count;

    this.eventBus.emit('garbage:added', {
      targetId,
      lines: count,
    });
  }

  /**
   * Process pending garbage lines
   * Called after a piece locks
   */
  processPendingGarbage(targetId: 'player' | 'ai'): void {
    const targetEntity = targetId === 'player' ? this.playerEntity : this.aiEntity;
    const board = targetEntity.getComponent(BoardComponent);

    if (!board || board.pendingGarbage <= 0) return;

    const lines = board.pendingGarbage;
    board.pendingGarbage = 0;

    // Add garbage lines to the board
    board.addGarbageLines(lines);

    this.eventBus.emit('garbage:processed', {
      targetId,
      lines,
    });

    // Check for game over after garbage
    if (board.isToppedOut()) {
      board.isGameOver = true;
      this.eventBus.emit('game:over', {
        playerId: board.playerId,
        reason: 'garbage_out',
      });
    }
  }

  /**
   * Generate garbage row with random hole
   */
  generateGarbageRow(width: number = 10, guaranteedHole: boolean = true): (string | null)[] {
    const row: (string | null)[] = new Array(width).fill('#555555');

    if (guaranteedHole) {
      // At least one random hole
      const holeX = Math.floor(Math.random() * width);
      row[holeX] = null;
    }

    return row;
  }

  /**
   * Generate garbage row with specific hole position
   */
  generateGarbageRowWithHole(width: number, holeX: number): (string | null)[] {
    const row: (string | null)[] = new Array(width).fill('#555555');
    if (holeX >= 0 && holeX < width) {
      row[holeX] = null;
    }
    return row;
  }

  /**
   * Get pending garbage count
   */
  getPendingGarbage(targetId: 'player' | 'ai'): number {
    const targetEntity = targetId === 'player' ? this.playerEntity : this.aiEntity;
    const board = targetEntity.getComponent(BoardComponent);
    return board?.pendingGarbage || 0;
  }

  update(_deltaTime: number): void {
    // Garbage is processed on piece lock, not continuously
  }
}
