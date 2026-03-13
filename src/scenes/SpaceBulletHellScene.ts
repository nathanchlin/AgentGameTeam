import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import type { EventBus } from '../core/EventBus';
import { Entity } from '../entities/Entity';
import { VelocityComponent } from '../components/VelocityComponent';
import { HealthComponent } from '../components/HealthComponent';
import { ColliderComponent, CollisionLayer } from '../components/ColliderComponent';
import { SpriteComponent, SpriteShape } from '../components/SpriteComponent';
import { ShooterComponent } from '../components/ShooterComponent';
import { EnemyComponent, MovePattern } from '../components/EnemyComponent';
import { BossComponent, BossConfig } from '../components/spaceBulletHell/BossComponent';
import { PlayerInputSystem } from '../systems/PlayerInputSystem';
import { BulletMovementSystem } from '../systems/BulletMovementSystem';
import { BulletPatternSystem } from '../systems/BulletPatternSystem';
import { BulletCollisionSystem } from '../systems/BulletCollisionSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { ParticleEffectSystem } from '../systems/ParticleEffectSystem';
import { PatternType } from '../utils/BulletPatterns';
import { SpacePatternType } from '../utils/SpaceBulletPatterns';

// Star background configuration
interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

// Boss configuration
interface BossDefinition {
  id: string;
  name: string;
  nameZh: string;
  config: BossConfig;
  x: number;
  y: number;
}

// Wave configuration
interface WaveConfig {
  enemies: {
    type: 'scout' | 'fighter' | 'bomber';
    count: number;
    movePattern: MovePattern;
    shootPattern: PatternType | SpacePatternType;
    x: number;
    y: number;
  }[];
}

export class SpaceBulletHellScene extends Scene {
  private engine: Engine;
  private eventBus: EventBus;
  private canvas: HTMLCanvasElement;
  private keysPressed: Set<string> = new Set();

  // Systems
  private playerInputSystem!: PlayerInputSystem;
  private bulletMovementSystem!: BulletMovementSystem;
  private bulletPatternSystem!: BulletPatternSystem;
  private bulletCollisionSystem!: BulletCollisionSystem;
  private enemyAISystem!: EnemyAISystem;
  private particleEffectSystem!: ParticleEffectSystem;

  // Entities
  private player!: Entity;
  private currentBoss: Entity | null = null;

  // Game state
  private score: number = 0;
  private lives: number = 3;
  private currentWave: number = 0;
  private currentBossIndex: number = 0;
  private waveTimer: number = 0;
  private waveDelay: number = 3.0;
  private isGameOver: boolean = false;
  private gameTime: number = 0;
  private gameStarted: boolean = false;
  private isVictory: boolean = false;
  private retryCount: number = 0;
  private gameOverTime: number = 0;

  // Stars for background
  private stars: Star[] = [];
  private nebulaPhase: number = 0;

  // Player glow
  private playerGlowPhase: number = 0;

  // Boss definitions
  private bossDefinitions: BossDefinition[] = [
    {
      id: 'nebula_guardian',
      name: 'Nebula Guardian',
      nameZh: '星云守护者',
      x: 450,
      y: 100,
      config: {
        name: 'Nebula Guardian',
        maxHealth: 800,
        points: 5000,
        phases: [
          {
            healthThreshold: 1.0,
            shootPattern: PatternType.SPREAD,
            movePattern: 'horizontal',
            bulletSpeed: 180,
            fireRate: 1.5,
            bulletCount: 5,
            spreadAngle: Math.PI / 3
          },
          {
            healthThreshold: 0.5,
            shootPattern: PatternType.SPIRAL,
            movePattern: 'diagonal',
            bulletSpeed: 200,
            fireRate: 2.0,
            bulletCount: 8,
            spreadAngle: Math.PI / 2
          }
        ]
      }
    },
    {
      id: 'void_beast',
      name: 'Void Beast',
      nameZh: '虚空巨兽',
      x: 450,
      y: 100,
      config: {
        name: 'Void Beast',
        maxHealth: 1200,
        points: 8000,
        phases: [
          {
            healthThreshold: 1.0,
            shootPattern: PatternType.AIMED,
            movePattern: 'horizontal',
            bulletSpeed: 200,
            fireRate: 1.2,
            bulletCount: 3,
            spreadAngle: Math.PI / 6
          },
          {
            healthThreshold: 0.66,
            shootPattern: SpacePatternType.RING as unknown as PatternType,
            movePattern: 'diagonal',
            bulletSpeed: 160,
            fireRate: 0.8,
            bulletCount: 12
          },
          {
            healthThreshold: 0.33,
            shootPattern: SpacePatternType.HOMING as unknown as PatternType,
            movePattern: 'sine_wave',
            bulletSpeed: 140,
            fireRate: 0.6,
            bulletCount: 4
          }
        ]
      }
    },
    {
      id: 'final_core',
      name: 'Final Core',
      nameZh: '终极核心',
      x: 450,
      y: 80,
      config: {
        name: 'Final Core',
        maxHealth: 2000,
        points: 15000,
        phases: [
          {
            healthThreshold: 1.0,
            shootPattern: PatternType.SPIRAL,
            movePattern: 'stationary',
            bulletSpeed: 180,
            fireRate: 1.5,
            bulletCount: 6
          },
          {
            healthThreshold: 0.75,
            shootPattern: PatternType.SPREAD,
            movePattern: 'horizontal',
            bulletSpeed: 200,
            fireRate: 2.0,
            bulletCount: 8,
            spreadAngle: Math.PI / 2
          },
          {
            healthThreshold: 0.5,
            shootPattern: SpacePatternType.RING as unknown as PatternType,
            movePattern: 'diagonal',
            bulletSpeed: 220,
            fireRate: 1.0,
            bulletCount: 16
          },
          {
            healthThreshold: 0.25,
            shootPattern: PatternType.BURST,
            movePattern: 'sine_wave',
            bulletSpeed: 250,
            fireRate: 3.0,
            bulletCount: 4
          }
        ]
      }
    }
  ];

  // Waves configuration - 3 waves before each boss
  private waves: WaveConfig[] = [
    // Wave 1: Introduction
    {
      enemies: [
        { type: 'scout', count: 4, movePattern: 'horizontal', shootPattern: PatternType.STRAIGHT, x: 450, y: 80 }
      ]
    },
    // Wave 2: More scouts
    {
      enemies: [
        { type: 'scout', count: 3, movePattern: 'horizontal', shootPattern: PatternType.SPREAD, x: 250, y: 80 },
        { type: 'scout', count: 3, movePattern: 'horizontal', shootPattern: PatternType.SPREAD, x: 650, y: 80 }
      ]
    },
    // Wave 3: Introduction of fighters
    {
      enemies: [
        { type: 'fighter', count: 2, movePattern: 'diagonal', shootPattern: PatternType.AIMED, x: 300, y: 100 },
        { type: 'fighter', count: 2, movePattern: 'diagonal', shootPattern: PatternType.AIMED, x: 600, y: 100 }
      ]
    },
    // Wave 4-6 (after first boss)
    {
      enemies: [
        { type: 'fighter', count: 3, movePattern: 'sine_wave', shootPattern: PatternType.SPIRAL, x: 450, y: 60 },
        { type: 'scout', count: 4, movePattern: 'horizontal', shootPattern: PatternType.SPREAD, x: 450, y: 100 }
      ]
    },
    {
      enemies: [
        { type: 'bomber', count: 2, movePattern: 'vertical', shootPattern: SpacePatternType.RING as unknown as PatternType, x: 300, y: 80 },
        { type: 'bomber', count: 2, movePattern: 'vertical', shootPattern: SpacePatternType.RING as unknown as PatternType, x: 600, y: 80 }
      ]
    },
    {
      enemies: [
        { type: 'fighter', count: 4, movePattern: 'diagonal', shootPattern: PatternType.AIMED, x: 450, y: 60 },
        { type: 'bomber', count: 2, movePattern: 'vertical', shootPattern: SpacePatternType.RING as unknown as PatternType, x: 450, y: 120 }
      ]
    },
    // Wave 7-9 (after second boss)
    {
      enemies: [
        { type: 'bomber', count: 3, movePattern: 'horizontal', shootPattern: SpacePatternType.HOMING as unknown as PatternType, x: 450, y: 80 }
      ]
    },
    {
      enemies: [
        { type: 'fighter', count: 5, movePattern: 'sine_wave', shootPattern: PatternType.SPIRAL, x: 300, y: 50 },
        { type: 'fighter', count: 5, movePattern: 'sine_wave', shootPattern: PatternType.SPIRAL, x: 600, y: 50 }
      ]
    },
    {
      enemies: [
        { type: 'bomber', count: 4, movePattern: 'diagonal', shootPattern: SpacePatternType.RING as unknown as PatternType, x: 450, y: 60 },
        { type: 'fighter', count: 4, movePattern: 'horizontal', shootPattern: PatternType.AIMED, x: 450, y: 120 }
      ]
    }
  ];

  // Track which wave sets have been completed (0-2, 3-5, 6-8)
  private get waveInSet(): number {
    return this.currentWave % 3;
  }

  constructor(engine: Engine) {
    super('SpaceBulletHell');
    this.engine = engine;
    this.eventBus = engine.getEventBus();
    this.canvas = engine.getCanvas();
  }

  enter(): void {
    super.enter();

    // Initialize systems
    this.initializeSystems();

    // Create player
    this.createPlayer();

    // Generate stars
    this.generateStars();

    // Set up event listeners
    this.setupEventListeners();

    // Set up keyboard tracking
    window.addEventListener('keydown', (e) => this.keysPressed.add(e.code));
    window.addEventListener('keyup', (e) => this.keysPressed.delete(e.code));

    // Reset state
    this.currentWave = 0;
    this.currentBossIndex = 0;
    this.waveTimer = 0;

    console.log('Cosmic Barrage started!');
    console.log('Controls: WASD to move, Space or Z to shoot');
  }

  exit(): void {
    super.exit();

    // Clean up systems
    this.playerInputSystem.destroy();
    this.particleEffectSystem.destroy();
    this.bulletMovementSystem.clearBullets();
    this.bulletCollisionSystem.clear();
    this.enemyAISystem.clearEnemies();

    // Clear entities
    this.entities = [];

    // Reset state
    this.retryCount = 0;
    this.score = 0;
    this.lives = 3;
    this.currentWave = 0;
    this.currentBossIndex = 0;
    this.gameStarted = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.currentBoss = null;
  }

  private initializeSystems(): void {
    const { width, height } = this.engine.getConfig();

    this.playerInputSystem = new PlayerInputSystem(this.eventBus);
    this.bulletMovementSystem = new BulletMovementSystem(this.eventBus, width, height);
    this.bulletPatternSystem = new BulletPatternSystem(this.eventBus, this.bulletMovementSystem);
    this.bulletCollisionSystem = new BulletCollisionSystem(this.eventBus);
    this.enemyAISystem = new EnemyAISystem(this.eventBus);
    this.particleEffectSystem = new ParticleEffectSystem(this.eventBus, this.canvas);

    this.playerInputSystem.initialize();
  }

  private createPlayer(): void {
    this.player = new Entity('player', 450, 520);

    this.player.addComponent(new VelocityComponent(0, 0, 280));
    this.player.addComponent(new HealthComponent(100, this.lives));
    this.player.addComponent(new ColliderComponent(12, CollisionLayer.PLAYER));
    this.player.addComponent(
      new SpriteComponent(SpriteShape.INK_BRUSH, '#00ffff', 22, {
        strokeStyle: '#00ccff',
        lineWidth: 2
      })
    );
    this.player.addComponent(new ShooterComponent(0.12, PatternType.STRAIGHT, 450, 20, 1));

    this.playerInputSystem.setPlayer(this.player);
    this.bulletCollisionSystem.registerPlayer(this.player);
    this.enemyAISystem.setPlayer(this.player);

    this.addEntity(this.player);
  }

  private generateStars(): void {
    const { width, height } = this.engine.getConfig();
    this.stars = [];

    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  private setupEventListeners(): void {
    // Player shooting
    this.eventBus.on('player:shoot', () => {
      if (this.isGameOver || this.isVictory) return;

      const shooter = this.player.getComponent(ShooterComponent);
      if (!shooter) return;

      const now = this.gameTime;
      if (!shooter.canShoot(now)) return;

      this.eventBus.emit('bullet:spawn', {
        x: this.player.x,
        y: this.player.y - 15,
        patternType: PatternType.STRAIGHT,
        bulletCount: 1,
        angle: -Math.PI / 2,
        speed: shooter.bulletSpeed,
        damage: shooter.bulletDamage,
        owner: 'player'
      });

      shooter.recordShot(now);

      this.eventBus.once('bullet:created', (data: { bullet: Entity }) => {
        if (data.bullet) {
          this.bulletCollisionSystem.registerBullet(data.bullet);
          this.addEntity(data.bullet);
        }
      });
    });

    // Enemy shooting
    this.eventBus.on('enemy:shoot', (data) => {
      this.eventBus.emit('bullet:spawn', data);
      this.eventBus.once('bullet:created', (data: { bullet: Entity }) => {
        if (data.bullet) {
          this.bulletCollisionSystem.registerBullet(data.bullet);
          this.addEntity(data.bullet);
        }
      });
    });

    // Bullet trail
    this.eventBus.on('bullet:trail', (data: { x: number; y: number; color: string }) => {
      this.particleEffectSystem.createTrailParticle(data.x, data.y, data.color);
    });

    // Enemy death
    this.eventBus.on('enemy:death', (data: { points: number }) => {
      this.score += data.points;
      this.eventBus.emit('score:updated', { score: this.score });
    });

    // Player damage
    this.eventBus.on('player:damage', () => {
      const health = this.player.getComponent(HealthComponent);
      if (health) {
        this.lives = health.lives;
        if (health.isDead()) {
          this.gameOver();
        }
      }
    });

    // Bullet hit
    this.eventBus.on('bullet:hit', (data: { target: Entity; x: number; y: number }) => {
      if (data.target === this.player) {
        this.eventBus.emit('player:damage', { x: data.x, y: data.y });
      }
    });
  }

  private spawnWave(waveIndex: number): void {
    if (waveIndex >= this.waves.length) {
      return;
    }

    this.enemyAISystem.setWave(waveIndex + 1);
    const wave = this.waves[waveIndex];

    for (const enemyConfig of wave.enemies) {
      for (let i = 0; i < enemyConfig.count; i++) {
        const offsetX = (i - (enemyConfig.count - 1) / 2) * 70;
        this.spawnEnemy(
          enemyConfig.type,
          enemyConfig.x + offsetX,
          enemyConfig.y,
          enemyConfig.movePattern,
          enemyConfig.shootPattern
        );
      }
    }
  }

  private spawnEnemy(
    type: 'scout' | 'fighter' | 'bomber',
    x: number,
    y: number,
    movePattern: MovePattern,
    shootPattern: PatternType | SpacePatternType
  ): Entity {
    const enemy = new Entity(`enemy_${type}_${Date.now()}`, x, y);

    // Configure based on type
    const configs = {
      scout: { health: 15, points: 100, speed: 60, size: 12, color: '#ff6b6b' },
      fighter: { health: 30, points: 200, speed: 45, size: 16, color: '#ffa500' },
      bomber: { health: 50, points: 300, speed: 35, size: 20, color: '#ff4444' }
    };

    const config = configs[type];

    enemy.addComponent(new VelocityComponent(0, 0, config.speed));
    enemy.addComponent(new HealthComponent(config.health, 1));
    enemy.addComponent(new ColliderComponent(config.size - 2, CollisionLayer.ENEMY));
    enemy.addComponent(
      new SpriteComponent(SpriteShape.INK_SPLASH, config.color, config.size, {
        strokeStyle: '#ffffff',
        lineWidth: 1
      })
    );
    enemy.addComponent(
      new ShooterComponent(
        type === 'bomber' ? 1.5 : 1.0,
        shootPattern as PatternType,
        type === 'bomber' ? 150 : 180,
        type === 'bomber' ? 15 : 10,
        type === 'bomber' ? 8 : 3
      )
    );
    enemy.addComponent(
      new EnemyComponent('ink_blob', movePattern, shootPattern as PatternType, config.points, config.speed, 50, 1)
    );

    this.enemyAISystem.addEnemy(enemy);
    this.bulletCollisionSystem.registerEnemy(enemy);
    this.addEntity(enemy);

    return enemy;
  }

  private spawnBoss(bossIndex: number): void {
    if (bossIndex >= this.bossDefinitions.length) {
      return;
    }

    const bossDef = this.bossDefinitions[bossIndex];
    const boss = new Entity(`boss_${bossDef.id}`, bossDef.x, bossDef.y);

    boss.addComponent(new VelocityComponent(0, 0, 40));
    boss.addComponent(new HealthComponent(bossDef.config.maxHealth, 1));
    boss.addComponent(new ColliderComponent(35, CollisionLayer.ENEMY));
    boss.addComponent(
      new SpriteComponent(SpriteShape.PAPER_DEMON, '#9933ff', 50, {
        strokeStyle: '#cc66ff',
        lineWidth: 3
      })
    );
    boss.addComponent(new BossComponent(bossDef.config));

    this.enemyAISystem.addEnemy(boss);
    this.bulletCollisionSystem.registerEnemy(boss);
    this.addEntity(boss);

    this.currentBoss = boss;
    console.log(`Boss spawned: ${bossDef.nameZh}`);
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.gameOverTime = this.gameTime;
    this.eventBus.emit('game:over', { score: this.score, wave: this.currentWave + 1 });
    console.log(`Game Over! Final Score: ${this.score}`);
  }

  private victory(): void {
    this.isVictory = true;
    this.gameOverTime = this.gameTime;
    console.log(`Victory! Final Score: ${this.score}`);
  }

  private restart(): void {
    this.retryCount++;

    this.score = 0;
    this.lives = 3;
    this.currentWave = 0;
    this.currentBossIndex = 0;
    this.waveTimer = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.gameTime = 0;
    this.gameStarted = true;
    this.currentBoss = null;

    this.entities = this.entities.filter(e => e === this.player);

    this.bulletMovementSystem.clearBullets();
    this.bulletCollisionSystem.clear();
    this.enemyAISystem.clearEnemies();

    const health = this.player.getComponent(HealthComponent);
    if (health) {
      health.currentHealth = health.maxHealth;
      health.lives = 3;
      health.isInvulnerable = false;
    }
    this.player.x = 450;
    this.player.y = 520;
    this.player.isActive = true;

    this.eventBus.emit('score:updated', { score: this.score });
    this.spawnWave(this.currentWave);
    this.eventBus.emit('wave:started', { wave: this.currentWave + 1 });

    console.log(`Retry #${this.retryCount}`);
  }

  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    this.playerGlowPhase += deltaTime * 3;
    this.nebulaPhase += deltaTime * 0.5;

    // Update stars twinkling
    for (const star of this.stars) {
      star.twinklePhase += deltaTime * star.twinkleSpeed;
    }

    // Start screen
    if (!this.gameStarted) {
      if (this.keysPressed.size > 0) {
        this.gameStarted = true;
        this.keysPressed.clear();
        this.currentWave = 0;
        this.spawnWave(this.currentWave);
        this.waveTimer = 0;
        this.eventBus.emit('wave:started', { wave: this.currentWave + 1 });
      }
      return;
    }

    if (this.isGameOver || this.isVictory) {
      if (this.keysPressed.has('Escape')) {
        this.keysPressed.delete('Escape');
        this.eventBus.emit('game:return_home');
        return;
      }
      const timeSinceGameOver = this.gameTime - this.gameOverTime;
      if (this.keysPressed.size > 0 && timeSinceGameOver > 0.5) {
        this.keysPressed.clear();
        this.restart();
      }
      return;
    }

    // Update wave timer
    this.waveTimer += deltaTime;

    // Check if boss is dead
    if (this.currentBoss) {
      const bossComp = this.currentBoss.getComponent(BossComponent);
      if (bossComp && bossComp.isDead()) {
        this.score += bossComp.points;
        this.currentBoss.isActive = false;
        this.currentBoss = null;
        this.currentBossIndex++;
        this.waveTimer = 0;

        // Check for victory
        if (this.currentBossIndex >= this.bossDefinitions.length) {
          this.victory();
          return;
        }

        // Continue to next wave set
        this.currentWave = this.currentBossIndex * 3;
        this.eventBus.emit('boss:defeated', { bossIndex: this.currentBossIndex - 1 });
      }
    }

    // Check if all enemies are dead
    const enemyCount = this.enemyAISystem.getEnemyCount();

    if (enemyCount === 0 && this.waveTimer >= this.waveDelay) {
      // Check if we should spawn boss (every 3 waves)
      if (this.waveInSet === 2 && !this.currentBoss) {
        // Spawn boss
        this.spawnBoss(this.currentBossIndex);
        this.waveTimer = 0;
      } else if (!this.currentBoss) {
        // Spawn next wave
        this.currentWave++;
        if (this.currentWave < this.waves.length) {
          this.spawnWave(this.currentWave);
          this.waveTimer = 0;
          this.eventBus.emit('wave:started', { wave: this.currentWave + 1 });
        }
      }
    }

    // Update boss shooting
    if (this.currentBoss && this.currentBoss.isActive) {
      const bossComp = this.currentBoss.getComponent(BossComponent);
      if (bossComp && bossComp.canShoot(this.gameTime)) {
        const phase = bossComp.getCurrentPhase();
        this.eventBus.emit('enemy:shoot', {
          x: this.currentBoss.x,
          y: this.currentBoss.y + 30,
          patternType: phase.shootPattern,
          bulletCount: phase.bulletCount,
          angle: Math.PI / 2,
          speed: phase.bulletSpeed,
          damage: 15,
          owner: 'enemy',
          spreadAngle: phase.spreadAngle,
          target: { x: this.player.x, y: this.player.y }
        });
        bossComp.recordShot();
      }
    }

    // Update systems
    this.playerInputSystem.update(deltaTime);
    this.bulletMovementSystem.update(deltaTime);
    this.bulletPatternSystem.update(deltaTime);
    this.bulletCollisionSystem.update(deltaTime);
    this.enemyAISystem.update(deltaTime);
    this.particleEffectSystem.update(deltaTime);

    // Keep player in bounds
    this.clampPlayerToBounds();

    super.update(deltaTime);
  }

  private clampPlayerToBounds(): void {
    const { width, height } = this.engine.getConfig();
    const margin = 15;

    this.player.x = Math.max(margin, Math.min(width - margin, this.player.x));
    this.player.y = Math.max(margin, Math.min(height - margin, this.player.y));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.getConfig();

    // Space background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw nebula effect
    this.drawNebula(ctx, width, height);

    // Draw stars
    this.drawStars(ctx);

    // Render entities
    super.render(ctx);

    // Player glow
    if (this.player && this.player.isActive && this.gameStarted) {
      this.drawPlayerGlow(ctx);
    }

    // Particles
    this.particleEffectSystem.render(ctx);

    // UI
    this.renderUI(ctx);

    // Start screen
    if (!this.gameStarted) {
      this.renderStartScreen(ctx);
    }
  }

  private drawNebula(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();

    // Subtle nebula clouds
    const gradient = ctx.createRadialGradient(
      width / 2 + Math.sin(this.nebulaPhase) * 100,
      height / 3,
      0,
      width / 2,
      height / 3,
      300
    );
    gradient.addColorStop(0, 'rgba(100, 50, 150, 0.1)');
    gradient.addColorStop(0.5, 'rgba(50, 50, 100, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const star of this.stars) {
      const twinkle = 0.5 + Math.sin(star.twinklePhase) * 0.5;
      const alpha = star.brightness * twinkle;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPlayerGlow(ctx: CanvasRenderingContext2D): void {
    const glowIntensity = 0.3 + Math.sin(this.playerGlowPhase) * 0.15;
    const glowSize = 25 + Math.sin(this.playerGlowPhase) * 5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${glowIntensity})`;
    ctx.fill();
    ctx.restore();
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Score
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 35);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4444';
    for (let i = 0; i < this.lives; i++) {
      ctx.fillText('♦', 870 - i * 25, 35);
    }

    // Wave indicator
    ctx.textAlign = 'center';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`WAVE ${this.currentWave + 1}`, 450, 35);

    // Boss health bar
    if (this.currentBoss && this.currentBoss.isActive) {
      this.renderBossHealthBar(ctx);
    }

    // Control hints
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | SPACE/Z: Shoot | Dodge enemy bullets!', 450, 620);

    // Game Over / Victory screen
    if (this.isGameOver) {
      this.renderGameOver(ctx);
    } else if (this.isVictory) {
      this.renderVictory(ctx);
    }

    ctx.restore();
  }

  private renderBossHealthBar(ctx: CanvasRenderingContext2D): void {
    const bossComp = this.currentBoss!.getComponent(BossComponent);
    if (!bossComp) return;

    const { width } = this.engine.getConfig();
    const barWidth = 400;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = 55;

    // Boss name
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = '#cc66ff';
    ctx.textAlign = 'center';
    ctx.fillText(bossComp.name, width / 2, barY - 5);

    // Background
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = bossComp.getHealthPercent();

    // Gradient health bar
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * healthPercent, barY);
    gradient.addColorStop(0, '#ff4444');
    gradient.addColorStop(1, '#ff8800');

    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Phase markers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 1; i < bossComp.phases.length; i++) {
      const markerX = barX + barWidth * bossComp.phases[i].healthThreshold;
      ctx.beginPath();
      ctx.moveTo(markerX, barY);
      ctx.lineTo(markerX, barY + barHeight);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#cc66ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Phase indicator
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`PHASE ${bossComp.currentPhaseIndex + 1}/${bossComp.phases.length}`, width / 2, barY + 15);
  }

  private renderGameOver(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.getConfig();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 60);

    ctx.font = '26px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${this.score}`, width / 2, height / 2);

    ctx.font = '22px Arial, sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`Wave Reached: ${this.currentWave + 1}`, width / 2, height / 2 + 40);

    if (this.retryCount > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(`Retries: ${this.retryCount}`, width / 2, height / 2 + 75);
    }

    const timeSinceGameOver = this.gameTime - this.gameOverTime;
    if (timeSinceGameOver > 0.5) {
      const blinkAlpha = 0.5 + Math.sin(this.gameTime * 5) * 0.5;
      ctx.font = '24px Arial, sans-serif';
      ctx.fillStyle = `rgba(0, 255, 255, ${blinkAlpha})`;
      ctx.fillText('Press any key to retry', width / 2, height / 2 + 130);
    }

    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('Press ESC to return home', width / 2, height / 2 + 170);
  }

  private renderVictory(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.getConfig();

    ctx.fillStyle = 'rgba(0, 0, 30, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', width / 2, height / 2 - 80);

    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('All bosses defeated!', width / 2, height / 2 - 30);

    ctx.font = '26px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${this.score}`, width / 2, height / 2 + 20);

    if (this.retryCount > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(`Total Retries: ${this.retryCount}`, width / 2, height / 2 + 60);
    }

    const blinkAlpha = 0.5 + Math.sin(this.gameTime * 5) * 0.5;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = `rgba(0, 255, 255, ${blinkAlpha})`;
    ctx.fillText('Press any key to play again', width / 2, height / 2 + 120);

    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('Press ESC to return home', width / 2, height / 2 + 160);
  }

  private renderStartScreen(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.getConfig();

    ctx.fillStyle = 'rgba(10, 10, 26, 0.95)';
    ctx.fillRect(0, 0, width, height);

    // Title with glow effect
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';

    // Glow
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00ffff';
    ctx.fillText('COSMIC BARRAGE', width / 2, height / 2 - 100);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#ff66ff';
    ctx.fillText('星际弹幕', width / 2, height / 2 - 50);

    // Controls
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('【CONTROLS】', width / 2, height / 2 + 10);
    ctx.fillText('WASD - Move', width / 2, height / 2 + 45);
    ctx.fillText('SPACE / Z - Shoot', width / 2, height / 2 + 75);

    // Boss info
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('【3 BOSSES】', width / 2, height / 2 + 120);
    ctx.fillStyle = '#cc66ff';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Nebula Guardian → Void Beast → Final Core', width / 2, height / 2 + 150);

    // Start prompt
    const blinkAlpha = 0.5 + Math.sin(this.gameTime * 4) * 0.5;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = `rgba(0, 255, 255, ${blinkAlpha})`;
    ctx.fillText('Press any key to start', width / 2, height / 2 + 210);
  }
}
