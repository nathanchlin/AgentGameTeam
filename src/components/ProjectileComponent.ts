import { Component } from './Component';

export type ProjectileOwner = 'player' | 'enemy';

export class ProjectileComponent extends Component {
  public age: number = 0;
  public isActive: boolean = true;

  constructor(
    public damage: number = 10,
    public lifetime: number = 5.0, // seconds
    public owner: ProjectileOwner = 'player'
  ) {
    super();
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    this.age += deltaTime;
    if (this.age >= this.lifetime) {
      this.isActive = false;
      if (this.entity) {
        this.entity.isActive = false;
      }
    }
  }

  isExpired(): boolean {
    return this.age >= this.lifetime;
  }

  reset(): void {
    this.age = 0;
    this.isActive = true;
    if (this.entity) {
      this.entity.isActive = true;
    }
  }
}
