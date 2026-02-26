import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { TetrominoComponent } from '../../components/tetris/TetrominoComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { AIConfigComponent, type AIDifficulty } from '../../components/tetris/AIConfigComponent';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';
import { GravityComponent } from '../../components/tetris/GravityComponent';
import { getRotationState } from '../../data/tetrominoes';
import { findBestMoveWithRotations, type BoardGrid } from '../../utils/tetris/AIHeuristics';
import type { RotationState } from '../../utils/tetris/WallKicks';

/**
 * AI action state
 */
type AIState = 'thinking' | 'moving' | 'dropping' | 'waiting';

/**
 * System for controlling AI opponent
 */
export class TetrisAISystem {
  private eventBus: EventBus;
  private aiEntity: Entity;
  private pieceEntity: Entity;

  private state: AIState = 'thinking';
  private targetX: number = 0;
  private targetRotation: number = 0;
  private moveTimer: number = 0;

  constructor(eventBus: EventBus, aiEntity: Entity, pieceEntity: Entity) {
    this.eventBus = eventBus;
    this.aiEntity = aiEntity;
    this.pieceEntity = pieceEntity;
  }

  /**
   * Set AI difficulty
   */
  setDifficulty(difficulty: AIDifficulty): void {
    const aiConfig = this.aiEntity.getComponent(AIConfigComponent);
    if (aiConfig) {
      // Create new config with difficulty
      const newConfig = new AIConfigComponent(difficulty);
      Object.assign(aiConfig, newConfig);
    }
  }

  /**
   * Main update loop
   */
  update(deltaTime: number): void {
    const board = this.aiEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);
    const aiConfig = this.aiEntity.getComponent(AIConfigComponent);
    const gravity = this.pieceEntity.getComponent(GravityComponent);

    if (!board || !tetromino || !aiConfig || !gravity) return;
    if (board.isGameOver || tetromino.isLocked) return;

    // Check for input freeze effect
    const skillPool = this.aiEntity.getComponent(SkillPoolComponent);
    if (skillPool?.hasEffect('input_freeze')) {
      return;
    }

    switch (this.state) {
      case 'thinking':
        this.think(deltaTime, aiConfig, board, tetromino);
        break;

      case 'moving':
        this.move(deltaTime, aiConfig, board, tetromino);
        break;

      case 'dropping':
        this.drop(gravity);
        break;

      case 'waiting':
        // Wait for new piece
        break;
    }
  }

  /**
   * Think about the next move
   */
  private think(
    deltaTime: number,
    aiConfig: AIConfigComponent,
    board: BoardComponent,
    tetromino: TetrominoComponent
  ): void {
    if (!aiConfig.shouldDecide(deltaTime)) return;

    // Convert board to AI format
    const grid = this.boardToGrid(board);

    // Get all rotation states for the current piece type (using pre-defined rotations)
    const rotationMatrices: number[][][] = [
      getRotationState(tetromino.type, 0),
      getRotationState(tetromino.type, 1),
      getRotationState(tetromino.type, 2),
      getRotationState(tetromino.type, 3),
    ];

    // Find best move using pre-defined rotation matrices
    const move = findBestMoveWithRotations(grid, rotationMatrices, aiConfig.weights);

    if (move) {
      // Maybe make a mistake (easier difficulties)
      if (aiConfig.shouldMakeMistake()) {
        this.targetX = move.x + (Math.random() > 0.5 ? 1 : -1);
        this.targetRotation = Math.floor(Math.random() * 4);
      } else {
        this.targetX = move.x;
        this.targetRotation = move.rotation;
      }

      this.state = 'moving';
      this.moveTimer = 0;
    }

    aiConfig.recordDecision();
  }

  /**
   * Move piece to target position
   */
  private move(
    deltaTime: number,
    aiConfig: AIConfigComponent,
    board: BoardComponent,
    tetromino: TetrominoComponent
  ): void {
    this.moveTimer += deltaTime * 1000;

    // Check if we've reached the target
    const atTargetX = tetromino.gridX === this.targetX;
    const atTargetRotation = tetromino.rotation === this.targetRotation;

    if (atTargetX && atTargetRotation) {
      this.state = 'dropping';
      return;
    }

    // Move with delay based on difficulty
    if (this.moveTimer < aiConfig.placementDelay) return;
    this.moveTimer = 0;

    // Rotate first
    if (tetromino.rotation !== this.targetRotation) {
      this.tryRotate(tetromino, board);
    }
    // Then move horizontally
    else if (tetromino.gridX !== this.targetX) {
      this.tryMove(tetromino, board);
    }
  }

  /**
   * Try to rotate the piece
   */
  private tryRotate(tetromino: TetrominoComponent, board: BoardComponent): void {
    const targetRot = this.targetRotation;
    const currentRot = tetromino.rotation;

    // Determine shortest rotation direction
    const clockwiseSteps = (targetRot - currentRot + 4) % 4;
    const counterSteps = (currentRot - targetRot + 4) % 4;

    if (clockwiseSteps <= counterSteps) {
      if (!this.tryRotateTo(tetromino, board, (currentRot + 1) % 4)) {
        // Try counter-clockwise if clockwise fails
        this.tryRotateTo(tetromino, board, (currentRot + 3) % 4);
      }
    } else {
      if (!this.tryRotateTo(tetromino, board, (currentRot + 3) % 4)) {
        this.tryRotateTo(tetromino, board, (currentRot + 1) % 4);
      }
    }
  }

  /**
   * Try to rotate to a specific state
   */
  private tryRotateTo(tetromino: TetrominoComponent, board: BoardComponent, rotation: number): boolean {
    const newMatrix = getRotationState(tetromino.type, rotation as RotationState);

    // Try basic rotation
    if (this.canPlace(newMatrix, tetromino.gridX, tetromino.gridY, board)) {
      tetromino.rotation = rotation as RotationState;
      return true;
    }

    // Try wall kicks
    const kicks = [
      [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-2, 0], [2, 0]
    ];

    for (const [kx, ky] of kicks) {
      if (this.canPlace(newMatrix, tetromino.gridX + kx, tetromino.gridY + ky, board)) {
        tetromino.rotation = rotation as RotationState;
        tetromino.gridX += kx;
        tetromino.gridY += ky;
        return true;
      }
    }

    return false;
  }

  /**
   * Try to move horizontally
   */
  private tryMove(tetromino: TetrominoComponent, board: BoardComponent): void {
    const dx = this.targetX > tetromino.gridX ? 1 : -1;
    const matrix = tetromino.getMatrix();

    if (this.canPlace(matrix, tetromino.gridX + dx, tetromino.gridY, board)) {
      tetromino.gridX += dx;
    }
  }

  /**
   * Check if a piece can be placed
   */
  private canPlace(matrix: number[][], x: number, y: number, board: BoardComponent): boolean {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          const boardX = x + col;
          const boardY = y + row;

          if (boardX < 0 || boardX >= board.width) return false;
          if (boardY < 0 || boardY >= board.height) return false;
          if (board.isCellOccupied(boardX, boardY)) return false;
        }
      }
    }
    return true;
  }

  /**
   * Hard drop the piece
   */
  private drop(gravity: GravityComponent): void {
    this.manualDrop(gravity);
    this.state = 'waiting';
  }

  /**
   * Manual drop if hardDrop not available
   */
  private manualDrop(gravity: GravityComponent): void {
    const board = this.aiEntity.getComponent(BoardComponent);
    const tetromino = this.pieceEntity.getComponent(TetrominoComponent);

    if (!board || !tetromino) return;

    while (this.canPlace(tetromino.getMatrix(), tetromino.gridX, tetromino.gridY + 1, board)) {
      tetromino.gridY++;
    }

    tetromino.isLocked = true;

    // Place on board
    const cells = tetromino.getOccupiedCells();
    for (const cell of cells) {
      board.setCell(cell.x, cell.y, tetromino.color);
    }

    board.piecesPlaced++;

    // Emit piece locked event to trigger line clear and spawn new piece
    this.eventBus.emit('tetris:piece_locked', {
      playerId: board.playerId,
      pieceType: tetromino.type,
    });

    // Reset gravity for next piece
    gravity.reset();
  }

  /**
   * Convert board to AI grid format
   */
  private boardToGrid(board: BoardComponent): BoardGrid {
    const grid: BoardGrid = [];
    for (let y = 0; y < board.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < board.width; x++) {
        row.push(board.grid[y][x] !== null ? 1 : 0);
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Called when a new piece spawns
   */
  onNewPiece(): void {
    this.state = 'thinking';

    // Consider using a skill
    this.considerSkillUse();
  }

  /**
   * Consider using a skill
   */
  private considerSkillUse(): void {
    const aiConfig = this.aiEntity.getComponent(AIConfigComponent);
    const skillPool = this.aiEntity.getComponent(SkillPoolComponent);

    if (!aiConfig || !skillPool) return;

    const availableSkills = skillPool.skills.filter((s) => skillPool.canUseSkill(s.id)).map((s) => s.id);

    if (availableSkills.length === 0) return;

    const skillId = aiConfig.getBestSkill(availableSkills);
    if (skillId) {
      this.eventBus.emit('ai:use_skill', { skillId });
    }
  }

  /**
   * Reset AI state
   */
  reset(): void {
    this.state = 'thinking';
    this.targetX = 0;
    this.targetRotation = 0;
    this.moveTimer = 0;

    const aiConfig = this.aiEntity.getComponent(AIConfigComponent);
    if (aiConfig) {
      aiConfig.reset();
    }
  }
}
