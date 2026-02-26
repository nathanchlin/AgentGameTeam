import type { Entity } from '../entities/Entity';
import type { EventBus } from '../core/EventBus';
import { VelocityComponent } from '../components/VelocityComponent';
import { ShooterComponent } from '../components/ShooterComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { HealthComponent } from '../components/HealthComponent';
import { PatternType } from '../utils/BulletPatterns';

export class EnemyAISystem {
  private eventBus: EventBus;
  private enemies: Entity[] = [];
  private player: Entity | null = null;
  private gameTime: number = 0;
  private currentWave: number = 1;
  private difficultyMultiplier: number = 1.0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  setPlayer(player: Entity): void {
    this.player = player;
  }

  setWave(wave: number): void {
    this.currentWave = wave;
    // Difficulty increases each wave: 1.0 -> 1.2 -> 1.4 -> 1.6...
    this.difficultyMultiplier = 1.0 + (wave - 1) * 0.2;
  }

  addEnemy(enemy: Entity): void {
    if (!this.enemies.includes(enemy)) {
      this.enemies.push(enemy);
    }
  }

  removeEnemy(enemy: Entity): void {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  clearEnemies(): void {
    this.enemies = [];
  }

  update(deltaTime: number): void {
    this.gameTime += deltaTime;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy.isActive) {
        this.enemies.splice(i, 1);
        continue;
      }

      const enemyComp = enemy.getComponent(EnemyComponent);
      const velocity = enemy.getComponent(VelocityComponent);
      const shooter = enemy.getComponent(ShooterComponent);
      const health = enemy.getComponent(HealthComponent);

      if (!enemyComp) continue;

      // Update enemy component time
      enemyComp.update(deltaTime);

      // Handle movement
      if (velocity) {
        this.updateMovement(enemy, enemyComp, velocity, deltaTime);
      }

      // Handle shooting
      if (shooter && health && !health.isDead()) {
        this.updateShooting(enemy, enemyComp, shooter);
      }
    }
  }

  private updateMovement(
    enemy: Entity,
    enemyComp: EnemyComponent,
    velocity: VelocityComponent,
    _deltaTime: number
  ): void {
    const pattern = enemyComp.movePattern;
    const t = enemyComp.timeAlive;

    switch (pattern) {
      case 'stationary':
        velocity.vx = 0;
        velocity.vy = 0;
        break;

      case 'horizontal':
        velocity.vx = Math.sin(t * enemyComp.moveFrequency) * enemyComp.moveAmplitude * 0.01;
        velocity.vy = 0;
        break;

      case 'vertical':
        velocity.vx = 0;
        velocity.vy = Math.sin(t * enemyComp.moveFrequency) * enemyComp.moveAmplitude * 0.01;
        break;

      case 'diagonal':
        velocity.vx = Math.sin(t * enemyComp.moveFrequency) * enemyComp.moveAmplitude * 0.01;
        velocity.vy = Math.cos(t * enemyComp.moveFrequency) * enemyComp.moveAmplitude * 0.01;
        break;

      case 'sine_wave':
        velocity.vx = enemyComp.moveSpeed * 0.01;
        velocity.vy = Math.sin(t * enemyComp.moveFrequency) * enemyComp.moveAmplitude * 0.02;
        break;

      case 'chase':
        this.updateChaseMovement(enemy, velocity, enemyComp);
        break;
    }
  }

  private updateChaseMovement(
    enemy: Entity,
    velocity: VelocityComponent,
    enemyComp: EnemyComponent
  ): void {
    if (!this.player || !this.player.isActive) {
      velocity.vx = 0;
      velocity.vy = 0;
      return;
    }

    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 50) {
      // Move towards player
      velocity.vx = (dx / distance) * enemyComp.moveSpeed * 0.01;
      velocity.vy = (dy / distance) * enemyComp.moveSpeed * 0.01;
    } else {
      // Stop when close enough
      velocity.vx = 0;
      velocity.vy = 0;
    }
  }

  private updateShooting(
    enemy: Entity,
    enemyComp: EnemyComponent,
    shooter: ShooterComponent
  ): void {
    if (!shooter.canShoot(this.gameTime)) return;

    // Get angle to player for aimed patterns
    let angle = Math.PI / 2; // Default: shoot downward
    if (this.player && this.player.isActive) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      angle = Math.atan2(dy, dx);
    }

    // Determine bullet parameters based on enemy type
    const bulletCount = this.getBulletCount(enemyComp.enemyType, enemyComp.shootPattern);
    const spreadAngle = this.getSpreadAngle(enemyComp.shootPattern);

    // Emit shoot event
    this.eventBus.emit('enemy:shoot', {
      x: enemy.x,
      y: enemy.y,
      patternType: enemyComp.shootPattern,
      bulletCount,
      angle,
      spreadAngle,
      speed: shooter.bulletSpeed,
      damage: shooter.bulletDamage,
      owner: 'enemy',
      target: this.player ? { x: this.player.x, y: this.player.y } : undefined,
    });

    shooter.recordShot(this.gameTime);
  }

  private getBulletCount(enemyType: string, pattern: PatternType): number {
    const baseCount = this.getBaseBulletCount(enemyType, pattern);
    // Scale with wave difficulty, cap at 3x
    return Math.floor(baseCount * Math.min(this.difficultyMultiplier, 3.0));
  }

  private getBaseBulletCount(enemyType: string, pattern: PatternType): number {
    switch (pattern) {
      case PatternType.SPREAD:
        return enemyType === 'paper_demon' ? 7 : 5;
      case PatternType.SPIRAL:
        return 12;
      case PatternType.BURST:
        return 6;
      case PatternType.AIMED:
        return 3;
      default:
        return 2;
    }
  }

  private getSpreadAngle(pattern: PatternType): number {
    switch (pattern) {
      case PatternType.SPREAD:
        return Math.PI / 3; // 60 degrees
      default:
        return 0;
    }
  }

  getEnemyCount(): number {
    return this.enemies.length;
  }

  getActiveEnemies(): Entity[] {
    return this.enemies.filter((e) => e.isActive);
  }
}
