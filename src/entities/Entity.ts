import type { Component } from '../components/Component';
import { generateId } from '../utils/id';

export class Entity {
  public readonly id: string;
  public name: string;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public isActive: boolean = true;

  private components: Map<string, Component> = new Map();

  constructor(name: string = 'Entity', x: number = 0, y: number = 0) {
    this.id = generateId();
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = 0;
    this.height = 0;
  }

  addComponent(component: Component): void {
    component.setEntity(this);
    this.components.set(component.constructor.name, component);
  }

  getComponent<T extends Component>(componentClass: new (...args: unknown[]) => T): T | undefined {
    return this.components.get(componentClass.name) as T | undefined;
  }

  hasComponent(componentClass: new (...args: unknown[]) => Component): boolean {
    return this.components.has(componentClass.name);
  }

  removeComponent(componentClass: new (...args: unknown[]) => Component): void {
    this.components.delete(componentClass.name);
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    for (const component of this.components.values()) {
      component.update(deltaTime);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    for (const component of this.components.values()) {
      component.render(ctx);
    }
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
