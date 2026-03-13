import { Component } from '../Component';
import { PatternType } from '../../utils/BulletPatterns';
import type { MovePattern } from '../EnemyComponent';

export interface BossPhase {
  healthThreshold: number;  // Trigger phase when health drops below this percentage (0-1)
  shootPattern: PatternType;
  movePattern: MovePattern;
  bulletSpeed: number;
  fireRate: number;  // Shots per second
  bulletCount: number;  // Bullets per shot
  spreadAngle?: number;
}

export interface BossConfig {
  name: string;
  maxHealth: number;
  phases: BossPhase[];
  points: number;
}

export class BossComponent extends Component {
  public name: string;
  public maxHealth: number;
  public currentHealth: number;
  public phases: BossPhase[];
  public currentPhaseIndex: number = 0;
  public points: number;
  public timeSinceLastShot: number = 0;
  public isEnraged: boolean = false;

  constructor(config: BossConfig) {
    super();
    this.name = config.name;
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.maxHealth;
    this.phases = config.phases;
    this.points = config.points;
  }

  updateHealth(healthPercent: number): void {
    // Check if we should advance to next phase
    for (let i = this.currentPhaseIndex + 1; i < this.phases.length; i++) {
      if (healthPercent <= this.phases[i].healthThreshold) {
        this.currentPhaseIndex = i;
        this.isEnraged = true;
        break;
      }
    }
  }

  getCurrentPhase(): BossPhase {
    return this.phases[this.currentPhaseIndex];
  }

  getHealthPercent(): number {
    return this.currentHealth / this.maxHealth;
  }

  takeDamage(damage: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - damage);
    this.updateHealth(this.getHealthPercent());
  }

  isDead(): boolean {
    return this.currentHealth <= 0;
  }

  canShoot(_currentTime: number): boolean {
    const phase = this.getCurrentPhase();
    const fireInterval = 1 / phase.fireRate;
    return this.timeSinceLastShot >= fireInterval;
  }

  recordShot(): void {
    this.timeSinceLastShot = 0;
  }

  update(deltaTime: number): void {
    this.timeSinceLastShot += deltaTime;
    // Reset enrage after a short time
    if (this.isEnraged && this.timeSinceLastShot > 0.5) {
      this.isEnraged = false;
    }
  }
}
