import { Component } from '../Component';

/**
 * Handles falling mechanics for a Tetris piece
 */
export class GravityComponent extends Component {
  // Base fall interval in seconds (time between auto-drops)
  public baseInterval: number = 1.0; // Level 1 speed

  // Current fall interval (can be modified by effects)
  public currentInterval: number = 1.0;

  // Time accumulator for gravity
  public accumulator: number = 0;

  // Soft drop state
  public isSoftDropping: boolean = false;
  public softDropMultiplier: number = 20; // 20x faster

  // Lock delay system
  public lockDelayEnabled: boolean = true;
  public lockDelay: number = 0.5; // 0.5 seconds
  public lockTimer: number = 0;
  public lockMoves: number = 0;
  public maxLockMoves: number = 15; // Max moves before forced lock

  // Current lock state
  public isLocking: boolean = false;

  // Level-based speed curve
  private static readonly SPEED_CURVE = [
    1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02,
  ];

  constructor(startLevel: number = 1) {
    super();
    this.setLevel(startLevel);
  }

  /**
   * Set the level and update speed accordingly
   */
  setLevel(level: number): void {
    const index = Math.min(Math.max(level - 1, 0), GravityComponent.SPEED_CURVE.length - 1);
    this.baseInterval = GravityComponent.SPEED_CURVE[index];
    this.currentInterval = this.baseInterval;
  }

  /**
   * Get the effective interval considering soft drop
   */
  getEffectiveInterval(): number {
    if (this.isSoftDropping) {
      return this.currentInterval / this.softDropMultiplier;
    }
    return this.currentInterval;
  }

  /**
   * Check if it's time to drop
   */
  shouldDrop(deltaTime: number): boolean {
    this.accumulator += deltaTime;

    const interval = this.getEffectiveInterval();
    if (this.accumulator >= interval) {
      this.accumulator -= interval;
      return true;
    }
    return false;
  }

  /**
   * Start soft drop
   */
  startSoftDrop(): void {
    this.isSoftDropping = true;
    // Immediately trigger a drop
    this.accumulator = this.getEffectiveInterval();
  }

  /**
   * Stop soft drop
   */
  stopSoftDrop(): void {
    this.isSoftDropping = false;
  }

  /**
   * Reset accumulator (called when piece moves)
   */
  resetAccumulator(): void {
    this.accumulator = 0;
  }

  /**
   * Start lock delay
   */
  startLocking(): void {
    if (this.lockDelayEnabled && !this.isLocking) {
      this.isLocking = true;
      this.lockTimer = 0;
      this.lockMoves = 0;
    }
  }

  /**
   * Stop locking (called when piece moves up or sideways)
   */
  stopLocking(): void {
    this.isLocking = false;
    this.lockTimer = 0;
  }

  /**
   * Register a move during lock delay
   */
  registerLockMove(): void {
    if (this.isLocking) {
      this.lockMoves++;
      this.lockTimer = 0; // Reset timer on move

      if (this.lockMoves >= this.maxLockMoves) {
        // Force lock after max moves
        this.lockTimer = this.lockDelay;
      }
    }
  }

  /**
   * Check if lock delay has expired
   */
  shouldLock(deltaTime: number): boolean {
    if (!this.isLocking) return false;

    this.lockTimer += deltaTime;
    return this.lockTimer >= this.lockDelay;
  }

  /**
   * Modify speed (for skill effects)
   */
  modifySpeed(multiplier: number): void {
    this.currentInterval = this.baseInterval * (1 / multiplier);
  }

  /**
   * Reset speed to normal
   */
  resetSpeed(): void {
    this.currentInterval = this.baseInterval;
  }

  /**
   * Force lock immediately (for hard drop)
   */
  forceLock(): void {
    this.lockTimer = this.lockDelay;
    this.isLocking = true;
  }

  /**
   * Reset gravity state
   */
  reset(): void {
    this.accumulator = 0;
    this.isSoftDropping = false;
    this.isLocking = false;
    this.lockTimer = 0;
    this.lockMoves = 0;
    this.currentInterval = this.baseInterval;
  }

  update(_deltaTime: number): void {
    // Gravity is handled by GravitySystem
  }
}
