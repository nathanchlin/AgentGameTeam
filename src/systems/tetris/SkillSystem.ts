import type { EventBus } from '../../core/EventBus';
import type { Entity } from '../../entities/Entity';
import { SkillPoolComponent } from '../../components/tetris/SkillPoolComponent';
import { BoardComponent } from '../../components/tetris/BoardComponent';
import { GravityComponent } from '../../components/tetris/GravityComponent';
import { PieceQueueComponent } from '../../components/tetris/PieceQueueComponent';
import type { SkillConfig, ActiveEffect } from '../../data/skills';

/**
 * System for managing skills and their effects
 */
export class SkillSystem {
  private eventBus: EventBus;
  private playerEntity: Entity;
  private aiEntity: Entity;

  constructor(eventBus: EventBus, playerEntity: Entity, aiEntity: Entity) {
    this.eventBus = eventBus;
    this.playerEntity = playerEntity;
    this.aiEntity = aiEntity;
  }

  /**
   * Use a skill by ID
   */
  useSkill(skillId: string, isPlayer: boolean): boolean {
    const sourceEntity = isPlayer ? this.playerEntity : this.aiEntity;
    const targetEntity = isPlayer ? this.aiEntity : this.playerEntity;

    const skillPool = sourceEntity.getComponent(SkillPoolComponent);
    if (!skillPool) return false;

    // Use the skill (deducts SP and starts cooldown)
    const skill = skillPool.useSkill(skillId);
    if (!skill) return false;

    // Apply the skill effect
    this.applySkillEffect(skill, targetEntity, isPlayer);

    // Emit skill cast event
    this.eventBus.emit('skill:cast', {
      skillId: skill.id,
      skillName: skill.name,
      sourceId: isPlayer ? 'player' : 'ai',
      targetId: isPlayer ? 'ai' : 'player',
      cost: skill.cost,
    });

    return true;
  }

  /**
   * Apply a skill's effect to the target
   */
  private applySkillEffect(skill: SkillConfig, target: Entity, _isPlayerSource: boolean): void {
    const targetSkillPool = target.getComponent(SkillPoolComponent);
    const targetBoard = target.getComponent(BoardComponent);
    const targetGravity = target.getComponent(GravityComponent);
    const targetQueue = target.getComponent(PieceQueueComponent);

    // Suppress unused variable warnings
    void targetGravity;
    void targetQueue;

    if (!targetSkillPool) return;

    // Instant effects
    switch (skill.effectType) {
      case 'add_garbage':
        if (targetBoard) {
          targetBoard.pendingGarbage += 1;
          this.eventBus.emit('garbage:added', {
            targetId: targetBoard.playerId,
            lines: 1,
          });
        }
        break;

      case 'place_garbage_blocks':
        if (targetBoard) {
          this.placeGarbageBlocks(targetBoard, 5);
        }
        break;

      case 'reverse_gravity':
        if (targetBoard) {
          this.applyReverseGravity(targetBoard);
        }
        break;

      case 'shuffle_queue':
        if (targetQueue) {
          targetQueue.shufflePreview();
        }
        break;
    }

    // Timed effects
    if (skill.duration > 0) {
      const effect: ActiveEffect = {
        skillId: skill.id,
        effectType: skill.effectType,
        remainingTime: skill.duration,
        sourcePlayer: _isPlayerSource ? 'player' : 'ai',
      };

      targetSkillPool.addEffect(effect);

      // Apply immediate effect changes
      this.applyEffectStart(skill.effectType, target);

      this.eventBus.emit('skill:effect_started', {
        effectType: skill.effectType,
        targetId: targetBoard?.playerId || 'unknown',
        duration: skill.duration,
      });
    }
  }

  /**
   * Apply effect start changes
   */
  private applyEffectStart(effectType: string, target: Entity): void {
    const gravity = target.getComponent(GravityComponent);

    switch (effectType) {
      case 'speed_increase':
        if (gravity) {
          gravity.modifySpeed(1.5); // 50% faster
        }
        break;
    }
  }

  /**
   * Apply effect end changes
   */
  private applyEffectEnd(effectType: string, target: Entity): void {
    const gravity = target.getComponent(GravityComponent);

    switch (effectType) {
      case 'speed_increase':
        if (gravity) {
          gravity.resetSpeed();
        }
        break;
    }
  }

  /**
   * Update active effects
   */
  updateEffects(_deltaTime: number): void {
    // Update player effects
    const playerSkillPool = this.playerEntity.getComponent(SkillPoolComponent);
    if (playerSkillPool) {
      const expiredEffects = playerSkillPool.activeEffects.filter((e) => e.remainingTime <= 0);
      for (const effect of expiredEffects) {
        this.applyEffectEnd(effect.effectType, this.playerEntity);
        this.eventBus.emit('skill:effect_ended', {
          effectType: effect.effectType,
          targetId: 'player',
        });
      }
    }

    // Update AI effects
    const aiSkillPool = this.aiEntity.getComponent(SkillPoolComponent);
    if (aiSkillPool) {
      const expiredEffects = aiSkillPool.activeEffects.filter((e) => e.remainingTime <= 0);
      for (const effect of expiredEffects) {
        this.applyEffectEnd(effect.effectType, this.aiEntity);
        this.eventBus.emit('skill:effect_ended', {
          effectType: effect.effectType,
          targetId: 'ai',
        });
      }
    }
  }

  /**
   * Place random garbage blocks on the board
   */
  private placeGarbageBlocks(board: BoardComponent, count: number): void {
    let placed = 0;
    const maxAttempts = count * 10;
    let attempts = 0;

    while (placed < count && attempts < maxAttempts) {
      const x = Math.floor(Math.random() * board.width);
      const y = Math.floor(Math.random() * 10) + 10; // Lower half of visible area

      if (board.isCellEmpty(x, y)) {
        board.setCell(x, y, '#666666');
        placed++;
      }
      attempts++;
    }
  }

  /**
   * Apply reverse gravity - shift all blocks up
   */
  private applyReverseGravity(board: BoardComponent): void {
    const shiftAmount = 3;

    // Remove top rows
    for (let i = 0; i < shiftAmount; i++) {
      board.grid.shift();
    }

    // Add empty rows at bottom
    for (let i = 0; i < shiftAmount; i++) {
      board.grid.push(new Array(board.width).fill(null));
    }
  }

  /**
   * Get available skills for a player
   */
  getAvailableSkills(isPlayer: boolean): string[] {
    const entity = isPlayer ? this.playerEntity : this.aiEntity;
    const skillPool = entity.getComponent(SkillPoolComponent);
    if (!skillPool) return [];

    return skillPool.skills.filter((s) => skillPool.canUseSkill(s.id)).map((s) => s.id);
  }

  update(deltaTime: number): void {
    this.updateEffects(deltaTime);
  }
}
