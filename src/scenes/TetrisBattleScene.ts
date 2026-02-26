import { Scene } from '../core/Scene';
import type { Engine } from '../core/Engine';
import type { EventBus } from '../core/EventBus';
import { Entity } from '../entities/Entity';
import type { AIDifficulty } from '../components/tetris/AIConfigComponent';

// Components
import { TetrominoComponent } from '../components/tetris/TetrominoComponent';
import { BoardComponent } from '../components/tetris/BoardComponent';
import { PieceQueueComponent } from '../components/tetris/PieceQueueComponent';
import { SkillPoolComponent } from '../components/tetris/SkillPoolComponent';
import { GravityComponent } from '../components/tetris/GravityComponent';
import { AIConfigComponent } from '../components/tetris/AIConfigComponent';

// Systems
import { PieceSpawnSystem } from '../systems/tetris/PieceSpawnSystem';
import { GravitySystem } from '../systems/tetris/GravitySystem';
import { PieceControlSystem } from '../systems/tetris/PieceControlSystem';
import { LineClearSystem } from '../systems/tetris/LineClearSystem';
import { SkillSystem } from '../systems/tetris/SkillSystem';
import { GarbageSystem } from '../systems/tetris/GarbageSystem';
import { TetrisAISystem } from '../systems/tetris/TetrisAISystem';
import { BoardRenderSystem } from '../systems/tetris/BoardRenderSystem';
import { EffectRenderSystem } from '../systems/tetris/EffectRenderSystem';

/**
 * Main Tetris Battle game scene
 */
export class TetrisBattleScene extends Scene {
  private engine: Engine;
  private eventBus: EventBus;
  private difficulty: AIDifficulty;

  // Entities
  private playerBoardEntity!: Entity;
  private aiBoardEntity!: Entity;
  private playerPieceEntity!: Entity;
  private aiPieceEntity!: Entity;

  // Systems
  private playerSpawnSystem!: PieceSpawnSystem;
  private aiSpawnSystem!: PieceSpawnSystem;
  private playerGravitySystem!: GravitySystem;
  private aiGravitySystem!: GravitySystem;
  private playerControlSystem!: PieceControlSystem;
  private aiControlSystem!: PieceControlSystem;
  private playerLineClearSystem!: LineClearSystem;
  private aiLineClearSystem!: LineClearSystem;
  private skillSystem!: SkillSystem;
  private garbageSystem!: GarbageSystem;
  private aiSystem!: TetrisAISystem;
  private boardRenderSystem!: BoardRenderSystem;
  private effectRenderSystem!: EffectRenderSystem;

  // Game state
  private isGameOver: boolean = false;
  private winner: 'player' | 'ai' | null = null;
  private isPaused: boolean = false;
  private gameOverListenerSet: boolean = false;
  private unsubs: (() => void)[] = [];

  constructor(engine: Engine, difficulty: AIDifficulty = 'normal') {
    super('TetrisBattleScene');
    this.engine = engine;
    this.eventBus = engine.getEventBus();
    this.difficulty = difficulty;
  }

  enter(): void {
    super.enter();
    this.isGameOver = false;
    this.winner = null;
    this.isPaused = false;
    this.gameOverListenerSet = false;

    // Clear existing entities before creating new ones
    this.entities = [];

    this.createEntities();
    this.createSystems();
    this.setupEventHandlers();
    this.spawnInitialPieces();
  }

  exit(): void {
    super.exit();
    // Unsubscribe from all events
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
  }

  private createEntities(): void {
    // Player board entity
    this.playerBoardEntity = new Entity('PlayerBoard', 0, 0);
    this.playerBoardEntity.addComponent(new BoardComponent('player'));
    this.playerBoardEntity.addComponent(new PieceQueueComponent());
    this.playerBoardEntity.addComponent(new SkillPoolComponent(true));

    // AI board entity
    this.aiBoardEntity = new Entity('AIBoard', 0, 0);
    this.aiBoardEntity.addComponent(new BoardComponent('ai'));
    this.aiBoardEntity.addComponent(new PieceQueueComponent());
    this.aiBoardEntity.addComponent(new SkillPoolComponent(false));
    this.aiBoardEntity.addComponent(new AIConfigComponent(this.difficulty));

    // Player piece entity
    this.playerPieceEntity = new Entity('PlayerPiece', 0, 0);
    this.playerPieceEntity.addComponent(new TetrominoComponent('T', 3, 0));
    this.playerPieceEntity.addComponent(new GravityComponent(1));

    // AI piece entity
    this.aiPieceEntity = new Entity('AIPiece', 0, 0);
    this.aiPieceEntity.addComponent(new TetrominoComponent('T', 3, 0));
    this.aiPieceEntity.addComponent(new GravityComponent(1));

    this.addEntity(this.playerBoardEntity);
    this.addEntity(this.aiBoardEntity);
    this.addEntity(this.playerPieceEntity);
    this.addEntity(this.aiPieceEntity);
  }

  private createSystems(): void {
    // Spawn systems
    this.playerSpawnSystem = new PieceSpawnSystem(this.eventBus, this.playerBoardEntity);
    this.aiSpawnSystem = new PieceSpawnSystem(this.eventBus, this.aiBoardEntity);

    // Gravity systems
    this.playerGravitySystem = new GravitySystem(this.eventBus, this.playerBoardEntity, this.playerPieceEntity);
    this.aiGravitySystem = new GravitySystem(this.eventBus, this.aiBoardEntity, this.aiPieceEntity);

    // Control systems
    this.playerControlSystem = new PieceControlSystem(this.eventBus, this.playerBoardEntity, this.playerPieceEntity);
    this.aiControlSystem = new PieceControlSystem(this.eventBus, this.aiBoardEntity, this.aiPieceEntity);

    // Line clear systems
    this.playerLineClearSystem = new LineClearSystem(this.eventBus, this.playerBoardEntity);
    this.aiLineClearSystem = new LineClearSystem(this.eventBus, this.aiBoardEntity);

    // Skill system
    this.skillSystem = new SkillSystem(this.eventBus, this.playerBoardEntity, this.aiBoardEntity);

    // Garbage system
    this.garbageSystem = new GarbageSystem(this.eventBus, this.playerBoardEntity, this.aiBoardEntity);

    // AI system
    this.aiSystem = new TetrisAISystem(this.eventBus, this.aiBoardEntity, this.aiPieceEntity);

    // Render systems
    this.boardRenderSystem = new BoardRenderSystem(
      this.engine,
      this.playerBoardEntity,
      this.aiBoardEntity,
      this.playerPieceEntity,
      this.aiPieceEntity,
      this.playerControlSystem,
      this.aiControlSystem,
      this.playerLineClearSystem,
      this.aiLineClearSystem
    );

    this.effectRenderSystem = new EffectRenderSystem(this.engine, this.playerBoardEntity, this.aiBoardEntity);
  }

  private setupEventHandlers(): void {
    // Piece locked - spawn new piece and process garbage
    this.unsubs.push(
      this.eventBus.on('tetris:piece_locked', (data: { playerId: string }) => {
        if (this.isGameOver) return;

        if (data.playerId === 'player') {
          // Check for line clears
          const lines = this.playerLineClearSystem.checkAndClear();
          if (lines === 0) {
            // No clears - process pending garbage
            this.garbageSystem.processPendingGarbage('player');
          }
          // Spawn new piece after a short delay
          setTimeout(() => {
            if (!this.isGameOver) {
              const queue = this.playerBoardEntity.getComponent(PieceQueueComponent);
              if (queue && this.playerSpawnSystem.spawnPiece(queue, this.playerPieceEntity)) {
                // Piece spawned successfully
              }
            }
          }, 100);
        } else {
          // AI piece locked
          const lines = this.aiLineClearSystem.checkAndClear();
          if (lines === 0) {
            this.garbageSystem.processPendingGarbage('ai');
          }
          setTimeout(() => {
            if (!this.isGameOver) {
              const queue = this.aiBoardEntity.getComponent(PieceQueueComponent);
              if (queue && this.aiSpawnSystem.spawnPiece(queue, this.aiPieceEntity)) {
                this.aiSystem.onNewPiece();
              }
            }
          }, 100);
        }
      })
    );

    // Lines cleared - process garbage after clear
    this.unsubs.push(
      this.eventBus.on('tetris:lines_cleared', (data: { playerId: string; count: number }) => {
        // After lines are cleared, process pending garbage
        setTimeout(() => {
          if (data.playerId === 'player') {
            this.garbageSystem.processPendingGarbage('player');
          } else {
            this.garbageSystem.processPendingGarbage('ai');
          }
        }, this.playerLineClearSystem.getClearProgress() * 1000 + 50);
      })
    );

    // Game over
    this.unsubs.push(
      this.eventBus.on('game:over', (data: { playerId: string; reason: string }) => {
        this.handleGameOver(data.playerId as 'player' | 'ai');
      })
    );

    // AI skill use
    this.unsubs.push(
      this.eventBus.on('ai:use_skill', (data: { skillId: string }) => {
        this.skillSystem.useSkill(data.skillId, false);
      })
    );

    // Player input
    this.unsubs.push(
      this.eventBus.on('keydown', (data: { key: string }) => {
        if (!this.isGameOver && !this.isPaused) {
          this.handlePlayerInput(data.key);
        }
      })
    );

    this.unsubs.push(
      this.eventBus.on('keyup', (data: { key: string }) => {
        this.handlePlayerKeyUp(data.key);
      })
    );

    // Skill effect events for visual feedback
    this.unsubs.push(
      this.eventBus.on('skill:cast', (data: { skillName: string; sourceId: string }) => {
        // Create visual effect
        const centerX = this.engine.width / 2;
        const centerY = this.engine.height / 2;
        this.effectRenderSystem.createSkillEffect(centerX, centerY, data.sourceId === 'player' ? '#4f4' : '#f44');
      })
    );
  }

  private spawnInitialPieces(): void {
    const playerQueue = this.playerBoardEntity.getComponent(PieceQueueComponent);
    const aiQueue = this.aiBoardEntity.getComponent(PieceQueueComponent);

    if (playerQueue) {
      this.playerSpawnSystem.spawnPiece(playerQueue, this.playerPieceEntity);
    }

    if (aiQueue) {
      this.aiSpawnSystem.spawnPiece(aiQueue, this.aiPieceEntity);
      this.aiSystem.onNewPiece();
    }
  }

  private handlePlayerInput(key: string): void {
    const tetromino = this.playerPieceEntity.getComponent(TetrominoComponent);
    if (!tetromino || tetromino.isLocked) return;

    const skillPool = this.playerBoardEntity.getComponent(SkillPoolComponent);
    if (skillPool?.hasEffect('input_freeze')) return;

    switch (key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (skillPool?.hasEffect('reverse_controls')) {
          this.playerControlSystem.moveRight();
        } else {
          this.playerControlSystem.moveLeft();
        }
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        if (skillPool?.hasEffect('reverse_controls')) {
          this.playerControlSystem.moveLeft();
        } else {
          this.playerControlSystem.moveRight();
        }
        break;

      case 'ArrowDown':
      case 's':
      case 'S':
        this.playerGravitySystem.softDrop();
        break;

      case 'ArrowUp':
      case 'x':
      case 'X':
        this.playerControlSystem.rotateClockwise();
        break;

      case 'z':
      case 'Z':
        this.playerControlSystem.rotateCounterClockwise();
        break;

      case ' ':
        this.playerGravitySystem.hardDrop();
        break;

      case 'c':
      case 'C':
      case 'Shift':
        const queue = this.playerBoardEntity.getComponent(PieceQueueComponent);
        if (queue) {
          this.playerSpawnSystem.holdPiece(queue, this.playerPieceEntity);
        }
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        const skillIndex = parseInt(key) - 1;
        const skills = this.skillSystem.getAvailableSkills(true);
        if (skills[skillIndex]) {
          this.skillSystem.useSkill(skills[skillIndex], true);
        }
        break;

      case 'p':
      case 'P':
      case 'Escape':
        this.togglePause();
        break;
    }
  }

  private handlePlayerKeyUp(key: string): void {
    switch (key) {
      case 'ArrowDown':
      case 's':
      case 'S':
        this.playerGravitySystem.stopSoftDrop();
        break;
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  private handleGameOver(loser: 'player' | 'ai'): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.winner = loser === 'player' ? 'ai' : 'player';
    this.setupGameOverListeners();
  }

  /**
   * Setup key listeners for game over screen (only once)
   */
  private setupGameOverListeners(): void {
    if (this.gameOverListenerSet) return;
    this.gameOverListenerSet = true;

    this.unsubs.push(
      this.eventBus.on('keydown', (data: { key: string }) => {
        if (!this.isGameOver) return;
        if (data.key === 'r' || data.key === 'R') {
          this.restartGame();
        } else if (data.key === 'm' || data.key === 'M') {
          this.returnToMenu();
        }
      })
    );
  }

  update(deltaTime: number): void {
    if (this.isGameOver || this.isPaused) return;

    // Update player systems
    this.playerGravitySystem.update(deltaTime);
    this.playerLineClearSystem.update(deltaTime);

    // Update AI systems
    this.aiGravitySystem.update(deltaTime);
    this.aiLineClearSystem.update(deltaTime);
    this.aiSystem.update(deltaTime);

    // Update shared systems
    this.skillSystem.update(deltaTime);
    this.effectRenderSystem.update(deltaTime);

    // Update skill pool components
    const playerSkills = this.playerBoardEntity.getComponent(SkillPoolComponent);
    const aiSkills = this.aiBoardEntity.getComponent(SkillPoolComponent);
    if (playerSkills) playerSkills.update(deltaTime);
    if (aiSkills) aiSkills.update(deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear with background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    // Render boards
    this.boardRenderSystem.render(ctx);

    // Render effects
    this.effectRenderSystem.render(ctx);

    // Render game over overlay
    if (this.isGameOver) {
      this.renderGameOver(ctx);
    }

    // Render pause overlay
    if (this.isPaused) {
      this.renderPause(ctx);
    }
  }

  private renderGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Winner text
    ctx.fillStyle = this.winner === 'player' ? '#4f4' : '#f44';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillText(this.winner === 'player' ? 'YOU WIN!' : 'AI WINS!', this.engine.width / 2, this.engine.height / 2 - 40);

    // Stats
    const playerBoard = this.playerBoardEntity.getComponent(BoardComponent);
    if (playerBoard) {
      ctx.fillStyle = '#aaa';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText(`Lines: ${playerBoard.linesCleared} | Score: ${playerBoard.score}`, this.engine.width / 2, this.engine.height / 2 + 20);
    }

    // Restart hint
    ctx.fillStyle = '#666';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Press R to restart | Press M for menu', this.engine.width / 2, this.engine.height / 2 + 70);
  }

  private renderPause(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.engine.width, this.engine.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.engine.width / 2, this.engine.height / 2);

    ctx.fillStyle = '#888';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('Press P or Escape to continue', this.engine.width / 2, this.engine.height / 2 + 40);
  }

  private restartGame(): void {
    this.exit();
    this.enter();
  }

  private returnToMenu(): void {
    this.eventBus.emit('tetris:return_to_menu');
  }
}
