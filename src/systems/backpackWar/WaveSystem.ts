import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { getWaveConfig, getTotalWaves } from '../../data/backpackWarConfigs';

/**
 * System for managing enemy waves in Backpack War.
 */
export class WaveSystem {
  private eventBus: EventBus;

  // Wave state
  private currentWave: number = 0;
  private totalWaves: number;
  private isWaveActive: boolean = false;

  // Spawn queue
  private spawnQueue: { enemyId: string; delay: number; spawned: boolean }[] = [];
  private spawnTimer: number = 0;

  // Callback to create enemy
  private createEnemyCallback: ((enemyId: string) => Entity | null) | null = null;

  // Battle area bounds for spawning
  private battleAreaLeft: number;
  private battleAreaTop: number;
  private battleAreaWidth: number;
  private battleAreaHeight: number;

  constructor(
    eventBus: EventBus,
    battleAreaLeft: number,
    battleAreaTop: number,
    battleAreaWidth: number,
    battleAreaHeight: number
  ) {
    this.eventBus = eventBus;
    this.totalWaves = getTotalWaves();
    this.battleAreaLeft = battleAreaLeft;
    this.battleAreaTop = battleAreaTop;
    this.battleAreaWidth = battleAreaWidth;
    this.battleAreaHeight = battleAreaHeight;
  }

  /**
   * Set callback for creating enemies
   */
  setCreateEnemyCallback(callback: (enemyId: string) => Entity | null): void {
    this.createEnemyCallback = callback;
  }

  /**
   * Reset wave system
   */
  reset(): void {
    this.currentWave = 0;
    this.isWaveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;
  }

  /**
   * Get current wave number
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Get total waves
   */
  getTotalWaves(): number {
    return this.totalWaves;
  }

  /**
   * Check if wave is active
   */
  isActive(): boolean {
    return this.isWaveActive;
  }

  /**
   * Start next wave
   */
  startNextWave(): boolean {
    console.log('startNextWave called, currentWave:', this.currentWave, 'totalWaves:', this.totalWaves, 'isWaveActive:', this.isWaveActive);
    if (this.isWaveActive) return false;
    if (this.currentWave >= this.totalWaves) return false;

    this.currentWave++;
    this.isWaveActive = true;
    this.spawnTimer = 0;

    // Build spawn queue
    this.buildSpawnQueue();
    console.log('Spawn queue built:', this.spawnQueue.length, 'enemies');

    this.eventBus.emit('wave:started', { wave: this.currentWave });
    return true;
  }

  /**
   * Build spawn queue for current wave
   */
  private buildSpawnQueue(): void {
    const waveConfig = getWaveConfig(this.currentWave);
    if (!waveConfig) return;

    this.spawnQueue = [];
    let delay = 0;

    for (const enemyGroup of waveConfig.enemies) {
      for (let i = 0; i < enemyGroup.count; i++) {
        this.spawnQueue.push({
          enemyId: enemyGroup.enemyId,
          delay: delay,
          spawned: false,
        });
        delay += 800; // 800ms between each enemy
      }
    }
  }

  /**
   * Get random spawn position (right side of battle area)
   */
  private getSpawnPosition(): { x: number; y: number } {
    const x = this.battleAreaLeft + this.battleAreaWidth - 50;
    const y = this.battleAreaTop + 50 + Math.random() * (this.battleAreaHeight - 100);
    return { x, y };
  }

  /**
   * Check if all enemies have been spawned
   */
  private allSpawned(): boolean {
    return this.spawnQueue.every(e => e.spawned);
  }

  /**
   * Get wave reward
   */
  getWaveReward(): number {
    const waveConfig = getWaveConfig(this.currentWave);
    return waveConfig?.reward || 0;
  }

  /**
   * Update wave system
   */
  update(deltaTime: number): void {
    if (!this.isWaveActive) {
      console.log('WaveSystem update: not active');
      return;
    }

    this.spawnTimer += deltaTime;
    console.log('WaveSystem update: timer=', this.spawnTimer, 'queue=', this.spawnQueue.length);

    // Spawn enemies from queue
    for (const spawn of this.spawnQueue) {
      if (!spawn.spawned && this.spawnTimer >= spawn.delay) {
        spawn.spawned = true;
        console.log(`Spawning enemy ${spawn.enemyId} at timer ${this.spawnTimer}`);

        if (this.createEnemyCallback) {
          const enemy = this.createEnemyCallback(spawn.enemyId);
          if (enemy) {
            const pos = this.getSpawnPosition();
            enemy.x = pos.x;
            enemy.y = pos.y;
            console.log(`Enemy spawned at (${pos.x}, ${pos.y})`);
          }
        } else {
          console.log('No createEnemyCallback!');
        }
      }
    }
  }

  /**
   * Notify that all enemies in wave are defeated
   */
  onWaveComplete(): void {
    this.isWaveActive = false;
    const reward = this.getWaveReward();

    this.eventBus.emit('wave:complete', {
      wave: this.currentWave,
      reward: reward,
    });

    // Check if all waves completed
    if (this.currentWave >= this.totalWaves) {
      this.eventBus.emit('game:all_waves_complete', {});
    }
  }

  /**
   * Check if spawn queue is complete and no enemies remain
   */
  isWaveComplete(enemyCount: number): boolean {
    return this.allSpawned() && enemyCount === 0;
  }
}
