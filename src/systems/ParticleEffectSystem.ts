import type { EventBus } from '../core/EventBus';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'ink_splash' | 'ink_trail' | 'death_burst' | 'hit_spark';
}

export class ParticleEffectSystem {
  private particles: Particle[] = [];
  private eventBus: EventBus;
  private unsubscribers: (() => void)[] = [];

  constructor(eventBus: EventBus, _canvas: HTMLCanvasElement) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for events that create particles
    const unsub1 = this.eventBus.on('bullet:hit', (data: { x: number; y: number; type: string }) => {
      this.createHitParticles(data.x, data.y, data.type);
    });

    const unsub2 = this.eventBus.on('enemy:death', (data: { x: number; y: number; enemyType: string }) => {
      this.createDeathParticles(data.x, data.y, data.enemyType);
    });

    const unsub3 = this.eventBus.on('player:damage', (data: { x: number; y: number }) => {
      this.createPlayerDamageParticles(data.x, data.y);
    });

    this.unsubscribers.push(unsub1, unsub2, unsub3);
  }

  destroy(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.particles = [];
  }

  createInkSplash(x: number, y: number, count: number = 10, color: string = '#1a1a1a'): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.3 + Math.random() * 0.5,
        size: 3 + Math.random() * 8,
        color,
        alpha: 0.8,
        type: 'ink_splash',
      });
    }
  }

  createHitParticles(x: number, y: number, _type: string): void {
    // Create ink splash effect on hit
    this.createInkSplash(x, y, 8, '#2a2a2a');

    // Add some smaller sparks
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.2 + Math.random() * 0.3,
        maxLife: 0.2 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: '#4a4a4a',
        alpha: 1,
        type: 'hit_spark',
      });
    }
  }

  createDeathParticles(x: number, y: number, enemyType: string): void {
    const color = enemyType === 'paper_demon' ? '#f5f5dc' : '#1a1a1a';
    const count = enemyType === 'paper_demon' ? 25 : 15;

    // Big ink splash on death
    this.createInkSplash(x, y, count, color);

    // Add expanding ring effect
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.4,
      maxLife: 0.4,
      size: 10,
      color: enemyType === 'paper_demon' ? '#8b4513' : '#1a1a1a',
      alpha: 0.6,
      type: 'death_burst',
    });
  }

  createPlayerDamageParticles(x: number, y: number): void {
    // Red seal-like particles when player is hit
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 4 + Math.random() * 6,
        color: '#c41e3a', // Seal red
        alpha: 0.9,
        type: 'ink_splash',
      });
    }
  }

  createTrailParticle(x: number, y: number, color: string = '#1a1a1a'): void {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      life: 0.15 + Math.random() * 0.1,
      maxLife: 0.15 + Math.random() * 0.1,
      size: 2 + Math.random() * 3,
      color,
      alpha: 0.5,
      type: 'ink_trail',
    });
  }

  update(deltaTime: number): void {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // Apply friction
      p.vx *= 0.95;
      p.vy *= 0.95;

      // Update life
      p.life -= deltaTime;

      // Update alpha based on life
      p.alpha = Math.max(0, (p.life / p.maxLife) * 0.8);

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'ink_splash':
        case 'hit_spark':
        case 'ink_trail':
          this.renderInkParticle(ctx, p);
          break;
        case 'death_burst':
          this.renderDeathBurst(ctx, p);
          break;
      }

      ctx.restore();
    }
  }

  private renderInkParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    // Gradient ink dot
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(0.7, p.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private renderDeathBurst(ctx: CanvasRenderingContext2D, p: Particle): void {
    // Expanding ring
    const progress = 1 - p.life / p.maxLife;
    const radius = p.size + progress * 40;
    const lineWidth = 3 * (1 - progress);

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
