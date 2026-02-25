import { Component } from './Component';

export class PositionComponent extends Component {
  constructor(public x: number = 0, public y: number = 0) {
    super();
  }

  update(_deltaTime: number): void {
    // Position is updated by other systems
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
