import type { Entity } from '../../entities/Entity';
import type { Engine } from '../../core/Engine';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';

/**
 * Particle for visual effects
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

/**
 * System for rendering visual effects
 */
export class EffectRenderSystem {
  private engine: Engine;
  private playerEntity: Entity;
  private aiEntity: Entity;
  private particles: Particle[] = [];

  constructor(engine: Engine, playerEntity: Entity, aiEntity: Entity) {
    this.engine = engine;
    this.playerEntity = playerEntity;
    this.aiEntity = aiEntity;
  }

  /**
   * Add particles for an effect
   */
  addParticles(x: number, y: number, count: number, color: string, spread: number = 5): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  /**
   * Update particles
   */
  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render all effects
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Render active effect indicators
    this.renderEffectIndicators(ctx);
  }

  /**
   * Render effect status indicators
   */
  private renderEffectIndicators(ctx: CanvasRenderingContext2D): void {
    // Player effects
    const playerSkills = this.playerEntity.getComponent(SkillPoolComponent);
    if (playerSkills) {
      this.renderEntityEffects(ctx, playerSkills, 10, this.engine.height - 100, 'PLAYER');
    }

    // AI effects
    const aiSkills = this.aiEntity.getComponent(SkillPoolComponent);
    if (aiSkills) {
      this.renderEntityEffects(ctx, aiSkills, this.engine.width - 150, this.engine.height - 100, 'AI');
    }
  }

  /**
   * Render effects for an entity
   */
  private renderEntityEffects(ctx: CanvasRenderingContext2D, skillPool: SkillPoolComponent, x: number, y: number, _label: string): void {
    const effects = skillPool.activeEffects;
    if (effects.length === 0) return;

    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';

    effects.forEach((effect, index) => {
      const effectY = y + index * 18;

      // Effect name
      const names: Record<string, string> = {
        speed_increase: '加速中',
        hide_preview: '致盲中',
        input_freeze: '冻结中',
        reverse_controls: '混乱中',
        disable_hold: '无法暂存',
        hide_ghost: '无幽灵',
        narrow_vision: '视野缩小',
      };

      const name = names[effect.effectType] || effect.effectType;
      const remaining = Math.ceil(effect.remainingTime);

      // Background
      ctx.fillStyle = 'rgba(100, 0, 0, 0.7)';
      ctx.fillRect(x, effectY, 130, 16);

      // Text
      ctx.fillStyle = '#f44';
      ctx.fillText(`${name} ${remaining}s`, x + 4, effectY + 12);
    });
  }

  /**
   * Create line clear effect
   */
  createLineClearEffect(x: number, y: number, width: number): void {
    const colors = ['#fff', '#ff0', '#f80', '#f00'];
    for (let i = 0; i < 30; i++) {
      const px = x + Math.random() * width;
      const py = y;
      this.addParticles(px, py, 1, colors[Math.floor(Math.random() * colors.length)], 8);
    }
  }

  /**
   * Create skill use effect
   */
  createSkillEffect(centerX: number, centerY: number, color: string): void {
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = 3 + Math.random() * 3;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  /**
   * Create garbage added effect
   */
  createGarbageEffect(x: number, y: number, height: number): void {
    for (let i = 0; i < 20; i++) {
      const py = y + Math.random() * height;
      this.addParticles(x + Math.random() * 240, py, 1, '#555', 3);
    }
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.particles = [];
  }
}
