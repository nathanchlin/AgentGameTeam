import { Component } from './Component';

export class SnakeSegmentComponent extends Component {
  constructor(public isHead: boolean = false, public index: number = 0) {
    super();
  }

  update(_deltaTime: number): void {}
}
