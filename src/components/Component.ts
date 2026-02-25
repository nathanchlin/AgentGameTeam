import type { Entity } from '../entities/Entity';

export abstract class Component {
  protected entity: Entity | null = null;

  setEntity(entity: Entity): void {
    this.entity = entity;
  }

  getEntity(): Entity | null {
    return this.entity;
  }

  abstract update(deltaTime: number): void;

  render(_ctx: CanvasRenderingContext2D): void {
    // Override in subclasses that need to render
  }
}
