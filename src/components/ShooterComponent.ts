import { Component } from './Component';
import { PatternType } from '../utils/BulletPatterns';

export class ShooterComponent extends Component {
  public lastFireTime: number = 0;
  public burstCount: number = 0;
  public burstTimer: number = 0;

  constructor(
    public fireRate: number = 0.2, // seconds between shots
    public patternType: PatternType = PatternType.STRAIGHT,
    public bulletSpeed: number = 300,
    public bulletDamage: number = 10,
    public burstSize: number = 1, // for burst patterns
    public burstDelay: number = 0.05 // delay between burst shots
  ) {
    super();
  }

  update(_deltaTime: number): void {
    // Update burst timer if in burst mode
    if (this.burstCount > 0) {
      this.burstTimer += _deltaTime;
    }
  }

  canShoot(currentTime: number): boolean {
    // Check if enough time has passed since last shot
    if (currentTime - this.lastFireTime < this.fireRate) {
      return false;
    }

    // Check if burst is complete
    if (this.burstCount > 0 && this.burstTimer < this.burstDelay) {
      return false;
    }

    return true;
  }

  recordShot(currentTime: number): void {
    this.lastFireTime = currentTime;

    // Handle burst fire
    if (this.burstSize > 1) {
      this.burstCount++;
      if (this.burstCount >= this.burstSize) {
        this.burstCount = 0;
        this.burstTimer = 0;
      } else {
        this.burstTimer = 0;
      }
    }
  }

  resetFireRate(newFireRate: number): void {
    this.fireRate = newFireRate;
  }
}
