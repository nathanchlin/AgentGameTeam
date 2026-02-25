import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import type { EventBus } from '../core/EventBus';
import { Entity } from '../entities/Entity';
import { VelocityComponent } from '../components/VelocityComponent';
import { HealthComponent } from '../components/HealthComponent';
import { ColliderComponent, CollisionLayer } from '../components/ColliderComponent';
import { SpriteComponent, SpriteShape } from '../components/SpriteComponent';
import { ShooterComponent } from '../components/ShooterComponent';
import { EnemyComponent, EnemyType, MovePattern } from '../components/EnemyComponent';
import { PlayerInputSystem } from '../systems/PlayerInputSystem';
import { BulletMovementSystem } from '../systems/BulletMovementSystem';
import { BulletPatternSystem } from '../systems/BulletPatternSystem';
import { BulletCollisionSystem } from '../systems/BulletCollisionSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { ParticleEffectSystem } from '../systems/ParticleEffectSystem';
import { PatternType } from '../utils/BulletPatterns';

interface WaveConfig {
  enemies: {
    type: EnemyType;
    count: number;
    movePattern: MovePattern;
    shootPattern: PatternType;
    x: number;
    y: number;
  }[];
}

export class BulletHellScene extends Scene {
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
  private scoreEntity!: Entity;

  // Game state
  private score: number = 0;
  private lives: number = 3;
  private currentWave: number = 0;
  private waveTimer: number = 0;
  private waveDelay: number = 3.0; // seconds between waves
  private isGameOver: boolean = false;
  private gameTime: number = 0;

  // Waves configuration
  private waves: WaveConfig[] = [
    // Wave 1: Simple ink blobs
    {
      enemies: [
        { type: 'ink_blob', count: 3, movePattern: 'horizontal', shootPattern: PatternType.STRAIGHT, x: 200, y: 100 },
        { type: 'ink_blob', count: 2, movePattern: 'vertical', shootPattern: PatternType.STRAIGHT, x: 600, y: 150 },
      ],
    },
    // Wave 2: More ink blobs + paper demon
    {
      enemies: [
        { type: 'ink_blob', count: 2, movePattern: 'horizontal', shootPattern: PatternType.SPREAD, x: 150, y: 80 },
        { type: 'ink_blob', count: 2, movePattern: 'horizontal', shootPattern: PatternType.SPREAD, x: 650, y: 80 },
        { type: 'paper_demon', count: 1, movePattern: 'diagonal', shootPattern: PatternType.AIMED, x: 400, y: 100 },
      ],
    },
    // Wave 3: Spiral enemies
    {
      enemies: [
        { type: 'ink_blob', count: 3, movePattern: 'sine_wave', shootPattern: PatternType.SPIRAL, x: 100, y: 50 },
        { type: 'paper_demon', count: 2, movePattern: 'horizontal', shootPattern: PatternType.SPREAD, x: 400, y: 120 },
      ],
    },
    // Wave 4: Chasing enemies
    {
      enemies: [
        { type: 'ink_blob', count: 4, movePattern: 'chase', shootPattern: PatternType.AIMED, x: 100, y: 50 },
        { type: 'paper_demon', count: 2, movePattern: 'diagonal', shootPattern: PatternType.BURST, x: 400, y: 100 },
      ],
    },
    // Wave 5: Boss wave
    {
      enemies: [
        { type: 'paper_demon', count: 5, movePattern: 'diagonal', shootPattern: PatternType.SPIRAL, x: 400, y: 100 },
        { type: 'ink_blob', count: 5, movePattern: 'sine_wave', shootPattern: PatternType.SPREAD, x: 200, y: 60 },
      ],
    },
  ];

  constructor(engine: Engine) {
    super('BulletHell');
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

    // Create score entity
    this.createScoreEntity();

    // Set up event listeners
    this.setupEventListeners();

    // Set up keyboard tracking for restart
    window.addEventListener('keydown', (e) => this.keysPressed.add(e.code));
    window.addEventListener('keyup', (e) => this.keysPressed.delete(e.code));

    // Start first wave
    this.currentWave = 0;
    this.waveTimer = 0;

    console.log('Spirit Painter bullet hell game started!');
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
  }

  private initializeSystems(): void {
    const { width, height } = this.engine.getConfig();

    // Initialize systems
    this.playerInputSystem = new PlayerInputSystem(this.eventBus);
    this.bulletMovementSystem = new BulletMovementSystem(this.eventBus, width, height);
    this.bulletPatternSystem = new BulletPatternSystem(this.eventBus, this.bulletMovementSystem);
    this.bulletCollisionSystem = new BulletCollisionSystem(this.eventBus);
    this.enemyAISystem = new EnemyAISystem(this.eventBus);
    this.particleEffectSystem = new ParticleEffectSystem(this.eventBus, this.canvas);

    // Initialize input system
    this.playerInputSystem.initialize();
  }

  private createPlayer(): void {
    this.player = new Entity('player', 400, 500);

    // Add components
    this.player.addComponent(new VelocityComponent(0, 0, 250));
    this.player.addComponent(new HealthComponent(100, this.lives));
    this.player.addComponent(new ColliderComponent(15, CollisionLayer.PLAYER));
    this.player.addComponent(
      new SpriteComponent(SpriteShape.INK_BRUSH, '#1a1a1a', 25, {
        strokeStyle: '#2a2a2a',
        lineWidth: 2,
      })
    );
    this.player.addComponent(new ShooterComponent(0.15, PatternType.STRAIGHT, 400, 15, 1));

    // Register with systems
    this.playerInputSystem.setPlayer(this.player);
    this.bulletCollisionSystem.registerPlayer(this.player);
    this.enemyAISystem.setPlayer(this.player);

    this.addEntity(this.player);
  }

  private createScoreEntity(): void {
    this.scoreEntity = new Entity('score', 0, 0);
    this.addEntity(this.scoreEntity);
  }

  private setupEventListeners(): void {
    // Player shooting
    this.eventBus.on('player:shoot', () => {
      if (this.isGameOver) return;

      const shooter = this.player.getComponent(ShooterComponent);
      if (!shooter) return;

      const now = this.gameTime;
      if (!shooter.canShoot(now)) return;

      // Spawn player bullet
      this.eventBus.emit('bullet:spawn', {
        x: this.player.x,
        y: this.player.y - 20,
        patternType: PatternType.STRAIGHT,
        bulletCount: 1,
        angle: -Math.PI / 2, // Shoot upward
        speed: shooter.bulletSpeed,
        damage: shooter.bulletDamage,
        owner: 'player',
      });

      shooter.recordShot(now);

      // Register bullet with collision system (handled via event)
      this.eventBus.once('bullet:created', (data: { bullet: Entity }) => {
        if (data.bullet) {
          this.bulletCollisionSystem.registerBullet(data.bullet);
        }
      });
    });

    // Enemy shooting
    this.eventBus.on('enemy:shoot', (data) => {
      this.eventBus.emit('bullet:spawn', data);
      this.eventBus.once('bullet:created', (data: { bullet: Entity }) => {
        if (data.bullet) {
          this.bulletCollisionSystem.registerBullet(data.bullet);
        }
      });
    });

    // Bullet trail particles
    this.eventBus.on('bullet:trail', (data: { x: number; y: number; color: string }) => {
      this.particleEffectSystem.createTrailParticle(data.x, data.y, data.color);
    });

    // Enemy death - add score
    this.eventBus.on('enemy:death', (data: { points: number }) => {
      this.score += data.points;
      this.eventBus.emit('score:updated', { score: this.score });
    });

    // Player damage
    this.eventBus.on('player:damage', (_data: { x: number; y: number }) => {
      const health = this.player.getComponent(HealthComponent);
      if (health) {
        this.lives = health.lives;
        if (health.isDead()) {
          this.gameOver();
        }
      }
    });

    // Check bullet hit for player damage
    this.eventBus.on('bullet:hit', (data: { target: Entity; x: number; y: number }) => {
      if (data.target === this.player) {
        this.eventBus.emit('player:damage', { x: data.x, y: data.y });
      }
    });
  }

  private spawnWave(waveIndex: number): void {
    if (waveIndex >= this.waves.length) {
      // Loop back to wave 1 with increased difficulty
      waveIndex = 0;
      this.currentWave = 0;
    }

    const wave = this.waves[waveIndex];

    for (const enemyConfig of wave.enemies) {
      for (let i = 0; i < enemyConfig.count; i++) {
        // Spread enemies horizontally
        const offsetX = (i - (enemyConfig.count - 1) / 2) * 80;
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
    type: EnemyType,
    x: number,
    y: number,
    movePattern: MovePattern,
    shootPattern: PatternType
  ): Entity {
    const enemy = new Entity(`enemy_${type}_${Date.now()}`, x, y);

    // Configure based on enemy type
    const isPaperDemon = type === 'paper_demon';
    const health = isPaperDemon ? 50 : 20;
    const points = isPaperDemon ? 200 : 100;
    const moveSpeed = isPaperDemon ? 30 : 50;

    // Add components
    enemy.addComponent(new VelocityComponent(0, 0, moveSpeed));
    enemy.addComponent(new HealthComponent(health, 1));
    enemy.addComponent(
      new ColliderComponent(isPaperDemon ? 20 : 12, CollisionLayer.ENEMY)
    );
    enemy.addComponent(
      new SpriteComponent(
        isPaperDemon ? SpriteShape.PAPER_DEMON : SpriteShape.INK_SPLASH,
        isPaperDemon ? '#f5f5dc' : '#1a1a1a',
        isPaperDemon ? 30 : 15,
        {
          strokeStyle: isPaperDemon ? '#8b4513' : '#2a2a2a',
          lineWidth: 2,
        }
      )
    );
    enemy.addComponent(
      new ShooterComponent(
        isPaperDemon ? 1.5 : 2.0,
        shootPattern,
        isPaperDemon ? 180 : 200,
        isPaperDemon ? 15 : 10,
        shootPattern === PatternType.BURST ? 3 : 1
      )
    );
    enemy.addComponent(
      new EnemyComponent(type, movePattern, shootPattern, points, moveSpeed, 50, 1)
    );

    // Register with systems
    this.enemyAISystem.addEnemy(enemy);
    this.bulletCollisionSystem.registerEnemy(enemy);

    this.addEntity(enemy);
    return enemy;
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.eventBus.emit('game:over', { score: this.score, wave: this.currentWave + 1 });
    console.log(`Game Over! Final Score: ${this.score}, Wave: ${this.currentWave + 1}`);
  }

  private restart(): void {
    // Reset game state
    this.score = 0;
    this.lives = 3;
    this.currentWave = 0;
    this.waveTimer = 0;
    this.isGameOver = false;
    this.gameTime = 0;

    // Clear enemies and bullets
    this.bulletMovementSystem.clearBullets();
    this.bulletCollisionSystem.clear();
    this.enemyAISystem.clearEnemies();

    // Reset player
    const health = this.player.getComponent(HealthComponent);
    if (health) {
      health.currentHealth = health.maxHealth;
      health.lives = 3;
      health.isInvulnerable = false;
    }
    this.player.x = 400;
    this.player.y = 500;
    this.player.isActive = true;

    // Emit score update
    this.eventBus.emit('score:updated', { score: this.score });
  }

  update(deltaTime: number): void {
    this.gameTime += deltaTime;

    if (this.isGameOver) {
      // Check for restart input
      if (this.keysPressed && this.keysPressed.has('KeyR')) {
        this.restart();
      }
      return;
    }

    // Update wave timer
    this.waveTimer += deltaTime;

    // Check if all enemies are dead and spawn next wave
    const enemyCount = this.enemyAISystem.getEnemyCount();
    if (enemyCount === 0 && this.waveTimer >= this.waveDelay) {
      this.currentWave++;
      this.spawnWave(this.currentWave);
      this.waveTimer = 0;
      this.eventBus.emit('wave:started', { wave: this.currentWave + 1 });
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

    // Update base entities
    super.update(deltaTime);
  }

  private clampPlayerToBounds(): void {
    const { width, height } = this.engine.getConfig();
    const margin = 20;

    this.player.x = Math.max(margin, Math.min(width - margin, this.player.x));
    this.player.y = Math.max(margin, Math.min(height - margin, this.player.y));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.getConfig();

    // Clear with paper-like background
    ctx.fillStyle = '#f5f0e6';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid pattern (like rice paper texture)
    this.drawPaperTexture(ctx, width, height);

    // Render base entities (player, enemies)
    super.render(ctx);

    // Render particles
    this.particleEffectSystem.render(ctx);

    // Render UI
    this.renderUI(ctx);
  }

  private drawPaperTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderUI(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Score - Chinese calligraphy style
    ctx.font = '24px "SimSun", "STSong", serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 20, 35);

    // Lives - red seal stamps
    ctx.textAlign = 'right';
    for (let i = 0; i < this.lives; i++) {
      this.drawSealStamp(ctx, 780 - i * 35, 25, 12);
    }

    // Wave indicator
    ctx.textAlign = 'center';
    ctx.font = '18px "SimSun", "STSong", serif';
    ctx.fillText(`Wave ${this.currentWave + 1}`, 400, 35);

    // Game Over screen
    if (this.isGameOver) {
      this.renderGameOver(ctx);
    }

    ctx.restore();
  }

  private drawSealStamp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.save();

    // Red seal background
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(x - size, y - size, size * 2, size * 2);

    // Simple character
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.4);
    ctx.lineTo(x + size * 0.4, y - size * 0.4);
    ctx.moveTo(x, y - size * 0.4);
    ctx.lineTo(x, y + size * 0.4);
    ctx.stroke();

    ctx.restore();
  }

  private renderGameOver(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.engine.getConfig();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    // Game Over text
    ctx.font = '48px "SimSun", "STSong", serif';
    ctx.fillStyle = '#c41e3a';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

    // Final score
    ctx.font = '28px "SimSun", "STSong", serif';
    ctx.fillStyle = '#f5f5dc';
    ctx.fillText(`Final Score: ${this.score}`, width / 2, height / 2 + 10);
    ctx.fillText(`Wave: ${this.currentWave + 1}`, width / 2, height / 2 + 50);

    // Restart instruction
    ctx.font = '20px "SimSun", "STSong", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press R to Restart', width / 2, height / 2 + 100);
  }
}
