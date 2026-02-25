import type { Entity } from '../entities/Entity';

export class Scene {
  protected entities: Entity[] = [];
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  enter(): void {
    console.log(`Entering scene: ${this.name}`);
  }

  exit(): void {
    console.log(`Exiting scene: ${this.name}`);
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    for (const entity of this.entities) {
      entity.update(deltaTime);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const entity of this.entities) {
      entity.render(ctx);
    }
  }

  getName(): string {
    return this.name;
  }
}
