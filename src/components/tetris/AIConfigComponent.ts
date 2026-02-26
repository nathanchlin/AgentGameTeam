import { Component } from '../Component';
import type { AIWeights } from '../../utils/tetris/AIHeuristics';
import { DEFAULT_WEIGHTS, AGGRESSIVE_WEIGHTS, DEFENSIVE_WEIGHTS } from '../../utils/tetris/AIHeuristics';

/**
 * AI difficulty levels
 */
export type AIDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

/**
 * AI configuration and behavior settings
 */
export class AIConfigComponent extends Component {
  // Difficulty level
  public difficulty: AIDifficulty;

  // Time between AI decisions (milliseconds)
  public thinkInterval: number = 300;

  // How many pieces ahead the AI considers
  public lookAhead: number = 2;

  // Chance to use skills when available (0-1)
  public skillAggressiveness: number = 0.4;

  // Heuristic weights for position evaluation
  public weights: AIWeights = { ...DEFAULT_WEIGHTS };

  // Decision timing
  public timeSinceLastDecision: number = 0;
  public currentTarget: { x: number; rotation: number } | null = null;

  // Mistake chance (for easier difficulties)
  public mistakeChance: number = 0.05;

  // Delay before placing piece
  public placementDelay: number = 100;

  constructor(difficulty: AIDifficulty = 'normal') {
    super();
    this.difficulty = difficulty;
    this.configureForDifficulty(difficulty);
  }

  /**
   * Configure AI parameters based on difficulty
   */
  private configureForDifficulty(difficulty: AIDifficulty): void {
    switch (difficulty) {
      case 'easy':
        this.thinkInterval = 500; // ms
        this.lookAhead = 1;
        this.skillAggressiveness = 0.2;
        this.weights = { ...DEFENSIVE_WEIGHTS };
        this.mistakeChance = 0.15;
        this.placementDelay = 200;
        break;

      case 'normal':
        this.thinkInterval = 300;
        this.lookAhead = 2;
        this.skillAggressiveness = 0.4;
        this.weights = { ...DEFAULT_WEIGHTS };
        this.mistakeChance = 0.05;
        this.placementDelay = 100;
        break;

      case 'hard':
        this.thinkInterval = 150;
        this.lookAhead = 3;
        this.skillAggressiveness = 0.6;
        this.weights = { ...AGGRESSIVE_WEIGHTS };
        this.mistakeChance = 0.02;
        this.placementDelay = 50;
        break;

      case 'expert':
        this.thinkInterval = 80;
        this.lookAhead = 4;
        this.skillAggressiveness = 0.8;
        this.weights = { ...AGGRESSIVE_WEIGHTS };
        this.mistakeChance = 0;
        this.placementDelay = 20;
        break;
    }
  }

  /**
   * Check if AI should make a decision
   */
  shouldDecide(deltaTime: number): boolean {
    this.timeSinceLastDecision += deltaTime * 1000;
    return this.timeSinceLastDecision >= this.thinkInterval;
  }

  /**
   * Record that a decision was made
   */
  recordDecision(): void {
    this.timeSinceLastDecision = 0;
  }

  /**
   * Set the current target position
   */
  setTarget(x: number, rotation: number): void {
    this.currentTarget = { x, rotation };
  }

  /**
   * Clear the current target
   */
  clearTarget(): void {
    this.currentTarget = null;
  }

  /**
   * Check if AI should make a mistake
   */
  shouldMakeMistake(): boolean {
    return Math.random() < this.mistakeChance;
  }

  /**
   * Check if AI should use a skill
   */
  shouldUseSkill(): boolean {
    return Math.random() < this.skillAggressiveness;
  }

  /**
   * Get the best skill to use
   */
  getBestSkill(availableSkills: string[]): string | null {
    if (availableSkills.length === 0) return null;
    if (!this.shouldUseSkill()) return null;

    // Prioritize skills by situation
    // For simplicity, pick randomly weighted by cost (cheaper = more likely)
    const weights = availableSkills.map((id) => {
      // Lower cost = higher weight
      const costMap: Record<string, number> = {
        player_speed_up: 3,
        player_garbage: 2,
        player_blind: 2,
        player_bomb: 1,
        player_reverse_gravity: 1,
        player_freeze: 1,
        ai_confusion: 3,
        ai_stone_wall: 2,
        ai_hold_freeze: 2,
        ai_chaos: 1,
        ai_narrow_vision: 2,
        ai_ghost_hide: 1,
      };
      return costMap[id] || 1;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableSkills.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableSkills[i];
      }
    }

    return availableSkills[0];
  }

  /**
   * Reset AI state
   */
  reset(): void {
    this.timeSinceLastDecision = 0;
    this.currentTarget = null;
  }

  update(_deltaTime: number): void {
    // AI decisions are handled by TetrisAISystem
  }
}
