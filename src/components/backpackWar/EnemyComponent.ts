import { Component } from '../Component';

/**
 * Component for enemies in Backpack War battles.
 * Stores enemy stats and battle state.
 */
export class EnemyComponent extends Component {
  enemyId: string;
  enemyName: string;
  enemyNameZh: string;

  // Stats
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  reward: number;

  // Visual
  color: string;
  size: number;

  // Battle state
  target: string | null = null;
  state: 'idle' | 'moving' | 'attacking' | 'dead' = 'idle';

  // Combat
  timeSinceAttack: number = 0;
  attackSpeed: number = 0.8; // Default attacks per second
  attackRange: number = 40;

  // Animation
  animationTime: number = 0;
  bounceOffset: number = 0;

  constructor(
    enemyId: string,
    name: string,
    nameZh: string,
    hp: number,
    attack: number,
    defense: number,
    speed: number,
    reward: number,
    color: string,
    size: number
  ) {
    super();
    this.enemyId = enemyId;
    this.enemyName = name;
    this.enemyNameZh = nameZh;
    this.hp = hp;
    this.maxHp = hp;
    this.attack = attack;
    this.defense = defense;
    this.speed = speed;
    this.reward = reward;
    this.color = color;
    this.size = size;
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.defense * 0.3);
    this.hp -= actualDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
    }
    return actualDamage;
  }

  /**
   * Check if enemy can attack
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

  update(deltaTime: number): void {
    // Update animation
    this.animationTime += deltaTime;
    this.bounceOffset = Math.sin(this.animationTime / 150) * 2;

    if (this.state === 'dead') return;

    // Reset state to idle if no target
    if (!this.target) {
      this.state = 'idle';
    }
  }
}
