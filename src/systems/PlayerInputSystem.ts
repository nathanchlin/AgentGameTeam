import type { Entity } from '../entities/Entity';
import type { EventBus } from '../core/EventBus';
import { VelocityComponent } from '../components/VelocityComponent';
import { ShooterComponent } from '../components/ShooterComponent';

export interface PlayerInputConfig {
  moveUp: string[];
  moveDown: string[];
  moveLeft: string[];
  moveRight: string[];
  shoot: string[];
}

const DEFAULT_CONFIG: PlayerInputConfig = {
  moveUp: ['KeyW', 'ArrowUp'],
  moveDown: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  shoot: ['Space', 'KeyZ'],
};

export class PlayerInputSystem {
  private keysPressed: Set<string> = new Set();
  private player: Entity | null = null;
  private config: PlayerInputConfig;
  private eventBus: EventBus;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(eventBus: EventBus, config: Partial<PlayerInputConfig> = {}) {
    this.eventBus = eventBus;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  setPlayer(player: Entity): void {
    this.player = player;
  }

  initialize(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.code);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.code);
  }

  isKeyPressed(action: keyof PlayerInputConfig): boolean {
    return this.config[action].some((key) => this.keysPressed.has(key));
  }

  update(deltaTime: number): void {
    if (!this.player || !this.player.isActive) return;

    // Handle movement
    const velocity = this.player.getComponent(VelocityComponent);
    if (velocity) {
      let vx = 0;
      let vy = 0;

      if (this.isKeyPressed('moveUp')) vy -= 1;
      if (this.isKeyPressed('moveDown')) vy += 1;
      if (this.isKeyPressed('moveLeft')) vx -= 1;
      if (this.isKeyPressed('moveRight')) vx += 1;

      // Normalize diagonal movement
      if (vx !== 0 && vy !== 0) {
        const magnitude = Math.sqrt(vx * vx + vy * vy);
        vx /= magnitude;
        vy /= magnitude;
      }

      velocity.setVelocity(vx, vy);

      // Emit movement event
      if (vx !== 0 || vy !== 0) {
        this.eventBus.emit('player:move', { vx, vy, deltaTime });
      }
    }

    // Handle shooting
    const shooter = this.player.getComponent(ShooterComponent);
    if (shooter && this.isKeyPressed('shoot')) {
      this.eventBus.emit('player:shoot', { player: this.player });
    }
  }
}
