import { Component } from './Component';

export class HealthComponent extends Component {
  public currentHealth: number;
  public isInvulnerable: boolean = false;
  public invulnerabilityTimer: number = 0;

  constructor(
    public maxHealth: number = 100,
    public lives: number = 3
  ) {
    super();
    this.currentHealth = maxHealth;
  }

  update(deltaTime: number): void {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= deltaTime;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
      }
    }
  }

  damage(amount: number): boolean {
    if (this.isInvulnerable || this.isDead()) return false;

    this.currentHealth -= amount;
    if (this.currentHealth <= 0) {
      this.lives--;
      if (this.lives > 0) {
        this.currentHealth = this.maxHealth;
        this.setInvulnerable(2.0); // 2 seconds of invulnerability after respawn
      } else {
        this.currentHealth = 0;
      }
      return true;
    }
    return false;
  }

  heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  isDead(): boolean {
    return this.lives <= 0 && this.currentHealth <= 0;
  }

  setInvulnerable(duration: number): void {
    this.isInvulnerable = true;
    this.invulnerabilityTimer = duration;
  }

  getHealthPercent(): number {
    return this.currentHealth / this.maxHealth;
  }
}
