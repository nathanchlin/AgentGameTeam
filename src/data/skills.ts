/**
 * Skill system configuration for Tetris Battle
 */

export type SkillTarget = 'self' | 'opponent';

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  cost: number; // Skill points required
  cooldown: number; // Cooldown in seconds
  duration: number; // Effect duration in seconds (0 = instant)
  target: SkillTarget;
  effectType: string;
}

/**
 * Skill points earned for line clears
 */
export const SKILL_POINT_REWARDS = {
  1: 10, // Single
  2: 30, // Double
  3: 60, // Triple
  4: 100, // Tetris
};

/**
 * Combo bonus per consecutive clear
 */
export const COMBO_BONUS = {
  1: 5,
  2: 10,
  3: 15,
  4: 25,
};

/**
 * Player skills - offensive abilities
 */
export const PLAYER_SKILLS: SkillConfig[] = [
  {
    id: 'player_speed_up',
    name: '加速',
    description: '对手下落速度+50%，持续10秒',
    cost: 20,
    cooldown: 15,
    duration: 10,
    target: 'opponent',
    effectType: 'speed_increase',
  },
  {
    id: 'player_garbage',
    name: '垃圾行',
    description: '给对手添加1行垃圾行',
    cost: 35,
    cooldown: 18,
    duration: 0,
    target: 'opponent',
    effectType: 'add_garbage',
  },
  {
    id: 'player_blind',
    name: '致盲',
    description: '隐藏对手预览，持续8秒',
    cost: 30,
    cooldown: 25,
    duration: 8,
    target: 'opponent',
    effectType: 'hide_preview',
  },
  {
    id: 'player_bomb',
    name: '方块炸弹',
    description: '在对手棋盘随机放置5个垃圾块',
    cost: 70,
    cooldown: 30,
    duration: 0,
    target: 'opponent',
    effectType: 'place_garbage_blocks',
  },
  {
    id: 'player_reverse_gravity',
    name: '重力反转',
    description: '对手方块向上飘起3行（打乱布局）',
    cost: 50,
    cooldown: 35,
    duration: 0,
    target: 'opponent',
    effectType: 'reverse_gravity',
  },
  {
    id: 'player_freeze',
    name: '时间冻结',
    description: '对手无法操作任何方块，持续3秒',
    cost: 80,
    cooldown: 40,
    duration: 3,
    target: 'opponent',
    effectType: 'input_freeze',
  },
];

/**
 * AI skills - defensive and disruptive abilities
 */
export const AI_SKILLS: SkillConfig[] = [
  {
    id: 'ai_confusion',
    name: '混乱',
    description: '玩家左右键反转，持续6秒',
    cost: 25,
    cooldown: 20,
    duration: 6,
    target: 'opponent',
    effectType: 'reverse_controls',
  },
  {
    id: 'ai_stone_wall',
    name: '石墙',
    description: '给玩家添加1行垃圾行',
    cost: 35,
    cooldown: 18,
    duration: 0,
    target: 'opponent',
    effectType: 'add_garbage',
  },
  {
    id: 'ai_hold_freeze',
    name: '冻结',
    description: '玩家无法暂存方块，持续10秒',
    cost: 45,
    cooldown: 22,
    duration: 10,
    target: 'opponent',
    effectType: 'disable_hold',
  },
  {
    id: 'ai_chaos',
    name: '混沌',
    description: '打乱玩家预览队列',
    cost: 60,
    cooldown: 28,
    duration: 0,
    target: 'opponent',
    effectType: 'shuffle_queue',
  },
  {
    id: 'ai_narrow_vision',
    name: '缩小视野',
    description: '玩家只能看到棋盘下半部分，持续6秒',
    cost: 40,
    cooldown: 30,
    duration: 6,
    target: 'opponent',
    effectType: 'narrow_vision',
  },
  {
    id: 'ai_ghost_hide',
    name: '幽灵消失',
    description: '隐藏玩家的幽灵方块预览，持续12秒',
    cost: 55,
    cooldown: 35,
    duration: 12,
    target: 'opponent',
    effectType: 'hide_ghost',
  },
];

/**
 * All skills combined
 */
export const ALL_SKILLS: SkillConfig[] = [...PLAYER_SKILLS, ...AI_SKILLS];

/**
 * Get a skill by its ID
 */
export function getSkillById(id: string): SkillConfig | undefined {
  return ALL_SKILLS.find((skill) => skill.id === id);
}

/**
 * Calculate skill points earned for a line clear with combo
 */
export function calculateSkillPoints(linesCleared: number, combo: number): number {
  const baseReward = SKILL_POINT_REWARDS[linesCleared as keyof typeof SKILL_POINT_REWARDS] || 0;
  const comboBonus = combo > 0 ? (COMBO_BONUS[Math.min(combo, 4) as keyof typeof COMBO_BONUS] || 0) * combo : 0;
  return baseReward + comboBonus;
}

/**
 * Active effect on a player
 */
export interface ActiveEffect {
  skillId: string;
  effectType: string;
  remainingTime: number;
  sourcePlayer: 'player' | 'ai';
}

/**
 * Skill cooldown state
 */
export interface SkillCooldown {
  skillId: string;
  remainingTime: number;
}
