import { Component } from '../Component';
import type { ItemEffect, HeroClass } from '../../data/backpackWarConfigs';

/**
 * Component for hero characters in Backpack War.
 * Stores hero stats, equipment, and battle state.
 */
export class HeroComponent extends Component {
  heroId: string;
  heroClass: HeroClass;

  // Stats
  hp: number;
  maxHp: number;
  baseHp: number;
  attack: number;
  baseAttack: number;
  defense: number;
  baseDefense: number;
  speed: number;
  baseSpeed: number;
  critChance: number = 5;
  lifesteal: number = 0;

  // Battle state
  battleX: number = 0;
  battleY: number = 0;
  target: string | null = null;
  state: 'idle' | 'moving' | 'attacking' | 'dead' | 'healing' = 'idle';

  // Combat stats
  attackRange: number;
  attackSpeed: number;
  timeSinceAttack: number = 0;

  // Equipment - items equipped to this hero (based on backpack position)
  equippedItems: Map<string, number> = new Map(); // itemId -> gridIndex

  // Visual
  color: string;
  nameZh: string;

  // Animation
  animationTime: number = 0;
  bounceOffset: number = 0;

  constructor(
    heroId: string,
    heroClass: HeroClass,
    stats: {
      hp: number;
      attack: number;
      defense: number;
      speed: number;
    },
    color: string,
    nameZh: string,
    attackRange: number,
    attackSpeed: number
  ) {
    super();
    this.heroId = heroId;
    this.heroClass = heroClass;
    this.baseHp = stats.hp;
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.baseAttack = stats.attack;
    this.attack = stats.attack;
    this.baseDefense = stats.defense;
    this.defense = stats.defense;
    this.baseSpeed = stats.speed;
    this.speed = stats.speed;
    this.color = color;
    this.nameZh = nameZh;
    this.attackRange = attackRange;
    this.attackSpeed = attackSpeed;
  }

  /**
   * Apply item effects to hero
   */
  applyEffects(effects: ItemEffect[]): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'hp':
          this.maxHp += effect.value;
          this.hp += effect.value;
          break;
        case 'attack':
          this.attack += effect.value;
          break;
        case 'defense':
          this.defense += effect.value;
          break;
        case 'speed':
          this.speed += effect.value;
          break;
        case 'crit':
          this.critChance += effect.value;
          break;
        case 'lifesteal':
          this.lifesteal += effect.value;
          break;
      }
    }
  }

  /**
   * Remove item effects from hero
   */
  removeEffects(effects: ItemEffect[]): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'hp':
          this.maxHp -= effect.value;
          this.hp = Math.min(this.hp, this.maxHp);
          break;
        case 'attack':
          this.attack -= effect.value;
          break;
        case 'defense':
          this.defense -= effect.value;
          break;
        case 'speed':
          this.speed -= effect.value;
          break;
        case 'crit':
          this.critChance -= effect.value;
          break;
        case 'lifesteal':
          this.lifesteal -= effect.value;
          break;
      }
    }
  }

  /**
   * Reset stats to base values
   */
  resetToBase(): void {
    this.maxHp = this.baseHp;
    this.hp = this.baseHp;
    this.attack = this.baseAttack;
    this.defense = this.baseDefense;
    this.speed = this.baseSpeed;
    this.critChance = 5;
    this.lifesteal = 0;
    this.equippedItems.clear();
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.defense * 0.5);
    this.hp -= actualDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
    }
    return actualDamage;
  }

  /**
   * Heal HP
   */
  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Check if hero can attack
   */
  canAttack(deltaTime: number): boolean {
    this.timeSinceAttack += deltaTime;
    const cooldown = 1000 / this.attackSpeed;
    if (this.timeSinceAttack >= cooldown) {
      this.timeSinceAttack = 0;
      return true;
    }
    return false;
  }

  /**
   * Calculate attack damage
   */
  calculateDamage(): { damage: number; isCrit: boolean } {
    const isCrit = Math.random() * 100 < this.critChance;
    const damage = isCrit ? this.attack * 1.5 : this.attack;
    return { damage, isCrit };
  }

  update(deltaTime: number): void {
    // Update animation
    this.animationTime += deltaTime;
    this.bounceOffset = Math.sin(this.animationTime / 200) * 3;

    if (this.state === 'dead') return;

    // Reset state to idle if no target
    if (!this.target) {
      this.state = 'idle';
    }
  }
}
