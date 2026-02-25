import { Component } from './Component';

export enum CollisionLayer {
  PLAYER = 'player',
  ENEMY = 'enemy',
  PLAYER_BULLET = 'player_bullet',
  ENEMY_BULLET = 'enemy_bullet',
  PICKUP = 'pickup',
}

// Define which layers can collide with each other
export const COLLISION_MATRIX: Record<CollisionLayer, CollisionLayer[]> = {
  [CollisionLayer.PLAYER]: [CollisionLayer.ENEMY, CollisionLayer.ENEMY_BULLET, CollisionLayer.PICKUP],
  [CollisionLayer.ENEMY]: [CollisionLayer.PLAYER, CollisionLayer.PLAYER_BULLET],
  [CollisionLayer.PLAYER_BULLET]: [CollisionLayer.ENEMY],
  [CollisionLayer.ENEMY_BULLET]: [CollisionLayer.PLAYER],
  [CollisionLayer.PICKUP]: [CollisionLayer.PLAYER],
};

export class ColliderComponent extends Component {
  constructor(
    public radius: number = 10,
    public layer: CollisionLayer = CollisionLayer.ENEMY
  ) {
    super();
  }

  update(_deltaTime: number): void {
    // Colliders don't need per-frame updates
  }

  canCollideWith(other: ColliderComponent): boolean {
    const validTargets = COLLISION_MATRIX[this.layer];
    return validTargets.includes(other.layer);
  }

  checkCollision(other: ColliderComponent): boolean {
    if (!this.canCollideWith(other)) return false;
    if (!this.entity || !other.entity) return false;

    const dx = this.entity.x - other.entity.x;
    const dy = this.entity.y - other.entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadius = this.radius + other.radius;

    return distance < combinedRadius;
  }
}
