import type { Entity } from '../entities/Entity';
import type { EventBus } from '../core/EventBus';
import { ColliderComponent } from '../components/ColliderComponent';
import { HealthComponent } from '../components/HealthComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { SpriteComponent } from '../components/SpriteComponent';

export interface CollisionResult {
  bullet: Entity;
  target: Entity;
  bulletX: number;
  bulletY: number;
  targetX: number;
  targetY: number;
}

export class BulletCollisionSystem {
  private eventBus: EventBus;
  private players: Entity[] = [];
  private enemies: Entity[] = [];
  private playerBullets: Entity[] = [];
  private enemyBullets: Entity[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  registerPlayer(player: Entity): void {
    if (!this.players.includes(player)) {
      this.players.push(player);
    }
  }

  unregisterPlayer(player: Entity): void {
    const index = this.players.indexOf(player);
    if (index !== -1) {
      this.players.splice(index, 1);
    }
  }

  registerEnemy(enemy: Entity): void {
    if (!this.enemies.includes(enemy)) {
      this.enemies.push(enemy);
    }
  }

  unregisterEnemy(enemy: Entity): void {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  registerBullet(bullet: Entity): void {
    const collider = bullet.getComponent(ColliderComponent);
    if (!collider) return;

    if (collider.layer === 'player_bullet') {
      if (!this.playerBullets.includes(bullet)) {
        this.playerBullets.push(bullet);
      }
    } else if (collider.layer === 'enemy_bullet') {
      if (!this.enemyBullets.includes(bullet)) {
        this.enemyBullets.push(bullet);
      }
    }
  }

  unregisterBullet(bullet: Entity): void {
    let index = this.playerBullets.indexOf(bullet);
    if (index !== -1) {
      this.playerBullets.splice(index, 1);
    }
    index = this.enemyBullets.indexOf(bullet);
    if (index !== -1) {
      this.enemyBullets.splice(index, 1);
    }
  }

  update(_deltaTime: number): void {
    // Check player bullets vs enemies
    this.checkBulletCollisions(this.playerBullets, this.enemies, 'enemy');

    // Check enemy bullets vs players
    this.checkBulletCollisions(this.enemyBullets, this.players, 'player');
  }

  private checkBulletCollisions(bullets: Entity[], targets: Entity[], _targetType: string): void {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (!bullet.isActive) {
        bullets.splice(i, 1);
        continue;
      }

      const bulletCollider = bullet.getComponent(ColliderComponent);
      const bulletProjectile = bullet.getComponent(ProjectileComponent);

      if (!bulletCollider || !bulletProjectile) continue;

      for (let j = targets.length - 1; j >= 0; j--) {
        const target = targets[j];
        if (!target.isActive) continue;

        const targetCollider = target.getComponent(ColliderComponent);
        const targetHealth = target.getComponent(HealthComponent);

        if (!targetCollider || !targetHealth) continue;

        // Check collision using collider component
        if (bulletCollider.checkCollision(targetCollider)) {
          // Apply damage
          const died = targetHealth.damage(bulletProjectile.damage);

          // Deactivate bullet
          bullet.isActive = false;

          // Get collision position
          const hitX = bullet.x;
          const hitY = bullet.y;

          // Emit collision event
          this.eventBus.emit('bullet:hit', {
            bullet,
            target,
            x: hitX,
            y: hitY,
            damage: bulletProjectile.damage,
            type: bulletProjectile.owner,
          });

          // Remove bullet from list
          bullets.splice(i, 1);

          // Check if target died
          if (died) {
            target.isActive = false;

            // Get enemy info for scoring
            const enemyComp = target.getComponent(EnemyComponent);
            const points = enemyComp?.points || 100;
            const enemyType = enemyComp?.enemyType || 'ink_blob';

            this.eventBus.emit('enemy:death', {
              enemy: target,
              x: target.x,
              y: target.y,
              enemyType,
              points,
            });

            // Remove from targets
            targets.splice(j, 1);
          }

          // Flash sprite on hit
          const sprite = target.getComponent(SpriteComponent);
          if (sprite) {
            this.flashSprite(sprite);
          }

          break; // Bullet can only hit one target
        }
      }
    }
  }

  private flashSprite(sprite: SpriteComponent): void {
    const originalOpacity = sprite.opacity;
    sprite.opacity = 0.3;
    setTimeout(() => {
      sprite.opacity = originalOpacity;
    }, 50);
  }

  clear(): void {
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
  }

  getStats(): { playerBullets: number; enemyBullets: number; enemies: number } {
    return {
      playerBullets: this.playerBullets.length,
      enemyBullets: this.enemyBullets.length,
      enemies: this.enemies.length,
    };
  }
}
