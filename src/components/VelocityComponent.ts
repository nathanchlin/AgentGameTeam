import { Component } from './Component';

export class VelocityComponent extends Component {
  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public speed: number = 100
  ) {
    super();
  }

  update(_deltaTime: number): void {
    if (!this.entity) return;
    this.entity.x += this.vx * this.speed * _deltaTime;
    this.entity.y += this.vy * this.speed * _deltaTime;
  }

  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  normalize(): void {
    const magnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (magnitude > 0) {
      this.vx /= magnitude;
      this.vy /= magnitude;
    }
  }
}
