import type { Entity } from '../entities/Entity';
import type { EventBus } from '../core/EventBus';
import { Entity as BaseEntity } from '../entities/Entity';
import { VelocityComponent } from '../components/VelocityComponent';
import { ProjectileComponent, ProjectileOwner } from '../components/ProjectileComponent';
import { ColliderComponent, CollisionLayer } from '../components/ColliderComponent';
import { SpriteComponent, SpriteShape } from '../components/SpriteComponent';
import {
  generateBulletPattern,
  PatternConfig,
  PatternType,
  BulletVelocity,
} from '../utils/BulletPatterns';
import { ObjectPool } from '../utils/ObjectPool';

export class BulletPatternSystem {
  private eventBus: EventBus;
  private bulletPool: ObjectPool<Entity>;
  private activeBullets: Set<Entity> = new Set();
  private nextBulletId: number = 0;

  constructor(eventBus: EventBus, private bulletMovementSystem: { addBullet: (e: Entity) => void }) {
    this.eventBus = eventBus;

    // Create bullet pool
    this.bulletPool = new ObjectPool<Entity>(
      () => this.createBulletEntity(),
      100, // Pre-warm 100 bullets
      (bullet) => this.resetBullet(bullet)
    );

    // Listen for shoot events
    this.eventBus.on('bullet:spawn', (data: PatternSpawnData) => {
      this.spawnPattern(data);
    });
  }

  private createBulletEntity(): Entity {
    const bullet = new BaseEntity(`bullet_${this.nextBulletId++}`, 0, 0);

    bullet.addComponent(new VelocityComponent(0, 0, 1));
    bullet.addComponent(
      new ProjectileComponent(10, 5.0, 'enemy')
    );
    bullet.addComponent(new ColliderComponent(5, CollisionLayer.ENEMY_BULLET));
    bullet.addComponent(
      new SpriteComponent(SpriteShape.INK_DOT, '#1a1a1a', 5)
    );

    return bullet;
  }

  private resetBullet(bullet: Entity): void {
    bullet.isActive = true;
    bullet.x = 0;
    bullet.y = 0;

    const velocity = bullet.getComponent(VelocityComponent);
    if (velocity) {
      velocity.vx = 0;
      velocity.vy = 0;
    }

    const projectile = bullet.getComponent(ProjectileComponent);
    if (projectile) {
      projectile.reset();
    }
  }

  spawnPattern(data: PatternSpawnData): Entity[] {
    const config: PatternConfig = {
      patternType: data.patternType,
      bulletCount: data.bulletCount,
      angle: data.angle,
      spreadAngle: data.spreadAngle,
      speed: data.speed,
      damage: data.damage,
      owner: data.owner,
      source: { x: data.x, y: data.y },
      target: data.target,
      spiral: data.spiral,
      burstDelay: data.burstDelay,
    };

    const bulletVelocities = generateBulletPattern(config);
    const spawnedBullets: Entity[] = [];

    for (const bv of bulletVelocities) {
      const bullet = this.spawnBullet(
        data.x,
        data.y,
        bv,
        data.owner as ProjectileOwner,
        data.damage
      );
      if (bullet) {
        spawnedBullets.push(bullet);
      }
    }

    return spawnedBullets;
  }

  private spawnBullet(
    x: number,
    y: number,
    velocity: BulletVelocity,
    owner: ProjectileOwner,
    damage: number
  ): Entity | null {
    const bullet = this.bulletPool.acquire();

    // Position
    bullet.x = x;
    bullet.y = y;
    bullet.isActive = true;

    // Velocity - store actual velocity values, speed is 1 since we're pre-multiplying
    const velComp = bullet.getComponent(VelocityComponent);
    if (velComp) {
      velComp.vx = velocity.vx;
      velComp.vy = velocity.vy;
      velComp.speed = 1; // Velocity is already calculated with speed
    }

    // Projectile
    const projComp = bullet.getComponent(ProjectileComponent);
    if (projComp) {
      projComp.damage = damage;
      projComp.owner = owner;
      projComp.reset();
    }

    // Collider - set layer based on owner
    const collider = bullet.getComponent(ColliderComponent);
    if (collider) {
      collider.layer = owner === 'player' ? CollisionLayer.PLAYER_BULLET : CollisionLayer.ENEMY_BULLET;
    }

    // Sprite - color based on owner (blue for player, red for enemy)
    const sprite = bullet.getComponent(SpriteComponent);
    if (sprite) {
      if (owner === 'player') {
        sprite.color = '#3b82f6'; // Blue for player bullets
        sprite.size = 8;
        sprite.style = { ...sprite.style, strokeStyle: '#1d4ed8', lineWidth: 2 };
      } else {
        sprite.color = '#dc2626'; // Bright red for enemy bullets
        sprite.size = 7;
        sprite.style = { ...sprite.style, strokeStyle: '#991b1b', lineWidth: 1 };
      }
    }

    // Track active bullet
    this.activeBullets.add(bullet);

    // Add to movement system
    this.bulletMovementSystem.addBullet(bullet);

    // Emit event
    this.eventBus.emit('bullet:created', { bullet, owner });

    return bullet;
  }

  releaseBullet(bullet: Entity): void {
    if (this.activeBullets.has(bullet)) {
      this.activeBullets.delete(bullet);
      this.bulletPool.release(bullet);
    }
  }

  update(_deltaTime: number): void {
    // Clean up inactive bullets
    for (const bullet of this.activeBullets) {
      if (!bullet.isActive) {
        this.releaseBullet(bullet);
      }
    }
  }

  getActiveBulletCount(): number {
    return this.activeBullets.size;
  }

  getPoolStats(): { active: number; available: number } {
    return {
      active: this.bulletPool.getActiveCount(),
      available: this.bulletPool.getAvailableCount(),
    };
  }
}

export interface PatternSpawnData {
  x: number;
  y: number;
  patternType: PatternType;
  bulletCount: number;
  angle: number;
  spreadAngle?: number;
  speed: number;
  damage: number;
  owner: string;
  target?: { x: number; y: number };
  spiral?: {
    angularSpeed?: number;
    arms?: number;
  };
  burstDelay?: number;
}
