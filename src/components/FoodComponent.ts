import { Component } from './Component';

export class FoodComponent extends Component {
  constructor(public value: number = 10) {
    super();
  }

  update(_deltaTime: number): void {}
}
