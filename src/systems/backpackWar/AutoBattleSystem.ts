import type { Entity } from '../../entities/Entity';
import { HeroComponent } from '../../components/backpackWar/HeroComponent';
import { EnemyComponent } from '../../components/backpackWar/EnemyComponent';

/**
 * System for managing real-time auto-battle.
 * Handles combat between heroes and enemies.
 */
export class AutoBattleSystem {
  // Battle entities
  private heroes: Entity[] = [];
  private enemies: Entity[] = [];

  // Battle state
  private isBattleActive: boolean = false;

  // Damage numbers to display
  private damageNumbers: DamageNumber[] = [];

  // Battle area bounds
  readonly battleAreaLeft = 340;
  readonly battleAreaTop = 80;
  readonly battleAreaWidth = 540;
  readonly battleAreaHeight = 440;

  constructor() {
    // No eventBus needed for this system
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.heroes = [];
    this.enemies = [];
    this.damageNumbers = [];
    this.isBattleActive = false;
  }

  /**
   * Add hero to battle
   */
  addHero(entity: Entity): void {
    this.heroes.push(entity);
  }

  /**
   * Add enemy to battle
   */
  addEnemy(entity: Entity): void {
    this.enemies.push(entity);
  }

  /**
   * Remove enemy
   */
  removeEnemy(entity: Entity): void {
    const index = this.enemies.indexOf(entity);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  /**
   * Start battle
   */
  startBattle(): void {
    this.isBattleActive = true;

    // Reset hero states
    for (const hero of this.heroes) {
      const heroComp = hero.getComponent(HeroComponent);
      if (heroComp) {
        heroComp.state = 'idle';
        heroComp.target = null;
        heroComp.hp = heroComp.maxHp; // Full heal at battle start
      }
    }

    // Reset enemy states
    for (const enemy of this.enemies) {
      const enemyComp = enemy.getComponent(EnemyComponent);
      if (enemyComp) {
        enemyComp.state = 'idle';
        enemyComp.target = null;
      }
    }
  }

  /**
   * Stop battle
   */
  stopBattle(): void {
    this.isBattleActive = false;
  }

  /**
   * Check if battle is active
   */
  isActive(): boolean {
    return this.isBattleActive;
  }

  /**
   * Check if all heroes are dead
   */
  isDefeat(): boolean {
    return this.heroes.every(h => {
      const hero = h.getComponent(HeroComponent);
      return hero && hero.state === 'dead';
    });
  }

  /**
   * Check if all enemies are dead
   */
  isVictory(): boolean {
    return this.enemies.length === 0 || this.enemies.every(e => {
      const enemy = e.getComponent(EnemyComponent);
      return enemy && enemy.state === 'dead';
    });
  }

  /**
   * Get alive heroes
   */
  getAliveHeroes(): Entity[] {
    return this.heroes.filter(h => {
      const hero = h.getComponent(HeroComponent);
      return hero && hero.state !== 'dead';
    });
  }

  /**
   * Get alive enemies
   */
  getAliveEnemies(): Entity[] {
    return this.enemies.filter(e => {
      const enemy = e.getComponent(EnemyComponent);
      return enemy && enemy.state !== 'dead';
    });
  }

  /**
   * Find nearest target for an entity
   */
  private findNearestTarget(
    x: number,
    y: number,
    targets: Entity[],
    isHero: boolean
  ): Entity | null {
    let nearest: Entity | null = null;
    let nearestDist = Infinity;

    for (const target of targets) {
      const comp = isHero
        ? target.getComponent(HeroComponent)
        : target.getComponent(EnemyComponent);
      if (!comp || comp.state === 'dead') continue;

      const dx = (target.x || 0) - x;
      const dy = (target.y || 0) - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = target;
      }
    }

    return nearest;
  }

  /**
   * Move entity towards target
   */
  private moveTowards(entity: Entity, targetX: number, targetY: number, speed: number, range: number, deltaTime: number): boolean {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= range) {
      return true; // In range
    }

    // Move towards target
    const moveSpeed = speed * (deltaTime / 1000);
    const ratio = moveSpeed / dist;
    entity.x += dx * ratio;
    entity.y += dy * ratio;

    return false;
  }

  /**
   * Add damage number
   */
  private addDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
    this.damageNumbers.push({
      x,
      y,
      damage: Math.floor(damage),
      isCrit,
      lifetime: 1000,
      maxLifetime: 1000,
    });
  }

  /**
   * Get damage numbers for rendering
   */
  getDamageNumbers(): DamageNumber[] {
    return this.damageNumbers;
  }

  /**
   * Main update loop
   */
  update(deltaTime: number): void {
    if (!this.isBattleActive) return;

    // Update damage numbers
    this.damageNumbers = this.damageNumbers.filter(dn => {
      dn.lifetime -= deltaTime;
      dn.y -= 30 * (deltaTime / 1000); // Float up
      return dn.lifetime > 0;
    });

    const aliveHeroes = this.getAliveHeroes();
    const aliveEnemies = this.getAliveEnemies();

    // Update heroes
    for (const heroEntity of this.heroes) {
      const hero = heroEntity.getComponent(HeroComponent);
      if (!hero || hero.state === 'dead') continue;

      // Find target
      const target = this.findNearestTarget(heroEntity.x, heroEntity.y, aliveEnemies, false);

      if (target) {
        hero.target = target.id;
        const targetEnemy = target.getComponent(EnemyComponent)!;

        // Move towards target
        const inRange = this.moveTowards(
          heroEntity,
          target.x,
          target.y,
          hero.speed,
          hero.attackRange,
          deltaTime
        );

        if (inRange) {
          hero.state = 'attacking';

          // Attack if cooldown ready
          if (hero.canAttack(deltaTime)) {
            const { damage, isCrit } = hero.calculateDamage();
            const actualDamage = targetEnemy.takeDamage(damage);

            // Lifesteal
            if (hero.lifesteal > 0) {
              hero.heal(actualDamage * (hero.lifesteal / 100));
            }

            this.addDamageNumber(target.x, target.y - 20, actualDamage, isCrit);

            // Check if enemy died
            if (targetEnemy.state === 'dead') {
              hero.target = null;
              hero.state = 'idle';
            }
          }
        } else {
          hero.state = 'moving';
        }
      } else {
        hero.target = null;
        hero.state = 'idle';
      }

      hero.update(deltaTime);
    }

    // Update enemies
    for (const enemyEntity of this.enemies) {
      const enemy = enemyEntity.getComponent(EnemyComponent);
      if (!enemy || enemy.state === 'dead') continue;

      // Find target (nearest hero)
      const target = this.findNearestTarget(enemyEntity.x, enemyEntity.y, aliveHeroes, true);

      if (target) {
        enemy.target = target.id;
        const targetHero = target.getComponent(HeroComponent)!;

        // Move towards target
        const inRange = this.moveTowards(
          enemyEntity,
          target.x,
          target.y,
          enemy.speed,
          enemy.attackRange,
          deltaTime
        );

        if (inRange) {
          enemy.state = 'attacking';

          // Attack if cooldown ready
          if (enemy.canAttack(deltaTime)) {
            const damage = enemy.attack;
            const actualDamage = targetHero.takeDamage(damage);

            this.addDamageNumber(target.x, target.y - 30, actualDamage, false);

            // Check if hero died
            if (targetHero.state === 'dead') {
              enemy.target = null;
              enemy.state = 'idle';
            }
          }
        } else {
          enemy.state = 'moving';
        }
      } else {
        enemy.target = null;
        enemy.state = 'idle';
      }

      enemy.update(deltaTime);
    }
  }
}

interface DamageNumber {
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  lifetime: number;
  maxLifetime: number;
}
