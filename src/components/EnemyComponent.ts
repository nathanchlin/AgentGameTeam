import { Component } from './Component';
import { PatternType } from '../utils/BulletPatterns';

export type EnemyType = 'ink_blob' | 'paper_demon' | 'ink_spirit' | 'scroll_dragon';

export type MovePattern = 'stationary' | 'horizontal' | 'vertical' | 'diagonal' | 'sine_wave' | 'chase';

export class EnemyComponent extends Component {
  public timeAlive: number = 0;
  public movePhase: number = 0;
  public initialX: number = 0;
  public initialY: number = 0;

  constructor(
    public enemyType: EnemyType = 'ink_blob',
    public movePattern: MovePattern = 'horizontal',
    public shootPattern: PatternType = PatternType.STRAIGHT,
    public points: number = 100,
    public moveSpeed: number = 50,
    public moveAmplitude: number = 50, // for sine wave movement
    public moveFrequency: number = 1 // for sine wave movement
  ) {
    super();
  }

  update(deltaTime: number): void {
    this.timeAlive += deltaTime;

    // Store initial position for movement patterns
    if (this.initialX === 0 && this.initialY === 0 && this.entity) {
      this.initialX = this.entity.x;
      this.initialY = this.entity.y;
    }
  }

  getMoveOffset(): { x: number; y: number } {
    const t = this.timeAlive;

    switch (this.movePattern) {
      case 'stationary':
        return { x: 0, y: 0 };

      case 'horizontal':
        return { x: Math.sin(t * this.moveFrequency) * this.moveAmplitude, y: 0 };

      case 'vertical':
        return { x: 0, y: Math.sin(t * this.moveFrequency) * this.moveAmplitude };

      case 'diagonal':
        return {
          x: Math.sin(t * this.moveFrequency) * this.moveAmplitude,
          y: Math.cos(t * this.moveFrequency) * this.moveAmplitude,
        };

      case 'sine_wave':
        return { x: t * this.moveSpeed, y: Math.sin(t * this.moveFrequency) * this.moveAmplitude };

      case 'chase':
        // Chase movement is handled by EnemyAISystem
        return { x: 0, y: 0 };

      default:
        return { x: 0, y: 0 };
    }
  }
}
