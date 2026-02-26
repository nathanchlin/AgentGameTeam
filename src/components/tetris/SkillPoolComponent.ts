import { Component } from '../Component';
import type { SkillConfig, ActiveEffect } from '../../data/skills';
import { PLAYER_SKILLS, AI_SKILLS } from '../../data/skills';

/**
 * Manages skill points and active skills for a player
 */
export class SkillPoolComponent extends Component {
  public skillPoints: number = 0;
  public maxSkillPoints: number = 200;

  // Available skills based on player type
  public readonly skills: SkillConfig[];
  public readonly isPlayer: boolean;

  // Active effects currently affecting this player
  public activeEffects: ActiveEffect[] = [];

  // Skill cooldowns
  public cooldowns: Map<string, number> = new Map();

  // Combo tracking
  public combo: number = 0;
  public lastClearTime: number = 0;

  constructor(isPlayer: boolean) {
    super();
    this.isPlayer = isPlayer;
    this.skills = isPlayer ? PLAYER_SKILLS : AI_SKILLS;
    this.initializeCooldowns();
  }

  /**
   * Initialize all skill cooldowns to 0
   */
  private initializeCooldowns(): void {
    for (const skill of this.skills) {
      this.cooldowns.set(skill.id, 0);
    }
  }

  /**
   * Add skill points
   */
  addSkillPoints(amount: number): void {
    this.skillPoints = Math.min(this.skillPoints + amount, this.maxSkillPoints);
  }

  /**
   * Spend skill points
   */
  spendSkillPoints(amount: number): boolean {
    if (this.skillPoints >= amount) {
      this.skillPoints -= amount;
      return true;
    }
    return false;
  }

  /**
   * Check if a skill can be used
   */
  canUseSkill(skillId: string): boolean {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) return false;

    // Check cost
    if (this.skillPoints < skill.cost) return false;

    // Check cooldown
    const cooldown = this.cooldowns.get(skillId) || 0;
    if (cooldown > 0) return false;

    return true;
  }

  /**
   * Use a skill and start its cooldown
   */
  useSkill(skillId: string): SkillConfig | null {
    if (!this.canUseSkill(skillId)) return null;

    const skill = this.skills.find((s) => s.id === skillId)!;
    this.spendSkillPoints(skill.cost);
    this.cooldowns.set(skillId, skill.cooldown);

    return skill;
  }

  /**
   * Get cooldown remaining for a skill
   */
  getCooldown(skillId: string): number {
    return this.cooldowns.get(skillId) || 0;
  }

  /**
   * Update cooldowns
   */
  updateCooldowns(deltaTime: number): void {
    for (const [skillId, cooldown] of this.cooldowns) {
      if (cooldown > 0) {
        this.cooldowns.set(skillId, Math.max(0, cooldown - deltaTime));
      }
    }
  }

  /**
   * Add an active effect
   */
  addEffect(effect: ActiveEffect): void {
    // Remove existing effect of the same type
    this.activeEffects = this.activeEffects.filter((e) => e.effectType !== effect.effectType);
    this.activeEffects.push(effect);
  }

  /**
   * Remove an active effect
   */
  removeEffect(effectType: string): void {
    this.activeEffects = this.activeEffects.filter((e) => e.effectType !== effectType);
  }

  /**
   * Check if an effect is active
   */
  hasEffect(effectType: string): boolean {
    return this.activeEffects.some((e) => e.effectType === effectType);
  }

  /**
   * Get remaining time for an effect
   */
  getEffectTime(effectType: string): number {
    const effect = this.activeEffects.find((e) => e.effectType === effectType);
    return effect?.remainingTime || 0;
  }

  /**
   * Update active effects
   */
  updateEffects(deltaTime: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      this.activeEffects[i].remainingTime -= deltaTime;
      if (this.activeEffects[i].remainingTime <= 0) {
        this.activeEffects.splice(i, 1);
      }
    }
  }

  /**
   * Increment combo
   */
  incrementCombo(): void {
    this.combo++;
  }

  /**
   * Reset combo
   */
  resetCombo(): void {
    this.combo = 0;
  }

  /**
   * Reset the skill pool
   */
  reset(): void {
    this.skillPoints = 0;
    this.activeEffects = [];
    this.combo = 0;
    this.initializeCooldowns();
  }

  update(deltaTime: number): void {
    this.updateCooldowns(deltaTime);
    this.updateEffects(deltaTime);
  }
}
