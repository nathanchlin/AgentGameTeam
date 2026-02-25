import type { EventBus } from '../core/EventBus';
import { Direction, DirectionComponent } from '../components';
import type { Entity } from '../entities/Entity';

export class InputSystem {
  private keyMap: Record<string, Direction> = {
    ArrowUp: Direction.UP,
    ArrowDown: Direction.DOWN,
    ArrowLeft: Direction.LEFT,
    ArrowRight: Direction.RIGHT,
    KeyW: Direction.UP,
    KeyS: Direction.DOWN,
    KeyA: Direction.LEFT,
    KeyD: Direction.RIGHT,
  };

  constructor(private eventBus: EventBus, private snakeHead: Entity) {
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    this.eventBus.on('keydown', (data: { code: string }) => {
      const newDirection = this.keyMap[data.code];
      if (newDirection) {
        const direction = this.snakeHead.getComponent(DirectionComponent);
        if (direction) {
          direction.setDirection(newDirection);
        }
      }
    });
  }

  update(_deltaTime: number): void {
    // Input is event-driven
  }
}
