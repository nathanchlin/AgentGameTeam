import { Component } from './Component';

export class ScoreComponent extends Component {
  constructor(public score: number = 0) {
    super();
  }

  update(_deltaTime: number): void {}

  add(points: number): void {
    this.score += points;
  }

  reset(): void {
    this.score = 0;
  }
}
