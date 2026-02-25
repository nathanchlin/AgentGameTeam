import { Component } from './Component';

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export class DirectionComponent extends Component {
  constructor(public current: Direction = Direction.RIGHT) {
    super();
  }

  update(_deltaTime: number): void {}

  setDirection(newDirection: Direction): void {
    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      [Direction.UP]: Direction.DOWN,
      [Direction.DOWN]: Direction.UP,
      [Direction.LEFT]: Direction.RIGHT,
      [Direction.RIGHT]: Direction.LEFT,
    };

    if (opposites[newDirection] !== this.current) {
      this.current = newDirection;
    }
  }
}
