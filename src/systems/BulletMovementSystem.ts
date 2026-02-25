import type { Entity } from '../entities/Entity';
import { VelocityComponent } from '../components/VelocityComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';
import type { EventBus } from '../core/EventBus';

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class BulletMovementSystem {
  private bullets: Entity[] = [];
  private eventBus: EventBus;
  private bounds: Bounds;
  private margin: number = 50; // Extra margin before removing off-screen bullets

  constructor(eventBus: EventBus, canvasWidth: number, canvasHeight: number) {
    this.eventBus = eventBus;
    this.bounds = {
      left: -this.margin,
      right: canvasWidth + this.margin,
      top: -this.margin,
      bottom: canvasHeight + this.margin,
    };
  }

  addBullet(bullet: Entity): void {
    if (!this.bullets.includes(bullet)) {
      this.bullets.push(bullet);
    }
  }

  removeBullet(bullet: Entity): void {
    const index = this.bullets.indexOf(bullet);
    if (index !== -1) {
      this.bullets.splice(index, 1);
    }
  }

  clearBullets(): void {
    this.bullets = [];
  }

  update(_deltaTime: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      if (!bullet.isActive) {
        this.bullets.splice(i, 1);
        continue;
      }

      const velocity = bullet.getComponent(VelocityComponent);
      const projectile = bullet.getComponent(ProjectileComponent);

      if (!velocity || !projectile) {
        continue;
      }

      // Check if bullet is expired
      if (projectile.isExpired() || !projectile.isActive) {
        bullet.isActive = false;
        this.bullets.splice(i, 1);
        this.eventBus.emit('bullet:expired', { bullet });
        continue;
      }

      // Check if bullet is out of bounds
      if (this.isOutOfBounds(bullet)) {
        bullet.isActive = false;
        this.bullets.splice(i, 1);
        this.eventBus.emit('bullet:outOfBounds', { bullet });
        continue;
      }

      // Bullet movement is handled by VelocityComponent.update()
      // Just emit trail particle event occasionally
      if (Math.random() < 0.1) {
        const owner = projectile.owner;
        const color = owner === 'player' ? '#1a1a1a' : '#4a0000';
        this.eventBus.emit('bullet:trail', {
          x: bullet.x,
          y: bullet.y,
          color,
        });
      }
    }
  }

  private isOutOfBounds(bullet: Entity): boolean {
    return (
      bullet.x < this.bounds.left ||
      bullet.x > this.bounds.right ||
      bullet.y < this.bounds.top ||
      bullet.y > this.bounds.bottom
    );
  }

  getBulletCount(): number {
    return this.bullets.length;
  }

  getActiveBullets(): Entity[] {
    return this.bullets.filter((b) => b.isActive);
  }

  updateBounds(width: number, height: number): void {
    this.bounds = {
      left: -this.margin,
      right: width + this.margin,
      top: -this.margin,
      bottom: height + this.margin,
    };
  }
}
