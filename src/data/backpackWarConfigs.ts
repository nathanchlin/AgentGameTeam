/**
 * Backpack War game configurations.
 * Auto-battler with inventory management and Q-version (chibi) visual style.
 */

// Item types
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'gem';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type HeroClass = 'warrior' | 'mage' | 'archer' | 'healer';

// Item effect types
export interface ItemEffect {
  type: 'attack' | 'defense' | 'hp' | 'speed' | 'crit' | 'lifesteal' | 'heal';
  value: number;
}

// Item definition
export interface ItemDefinition {
  id: string;
  name: string;
  nameZh: string;
  type: ItemType;
  rarity: Rarity;
  size: { width: number; height: number }; // Grid size (1x1, 1x2, 2x2)
  effects: ItemEffect[];
  color: string;
  cost: number;
}

// Hero definition
export interface HeroDefinition {
  id: string;
  name: string;
  nameZh: string;
  heroClass: HeroClass;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  color: string;
  attackRange: number;
  attackSpeed: number; // Attacks per second
}

// Enemy definition
export interface EnemyDefinition {
  id: string;
  name: string;
  nameZh: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  reward: number;
  color: string;
  size: number;
}

// Wave configuration
export interface WaveConfig {
  waveNumber: number;
  enemies: { enemyId: string; count: number }[];
  reward: number;
}

// Item definitions
export const itemConfigs: Record<string, ItemDefinition> = {
  // Weapons (1x2)
  sword_wood: {
    id: 'sword_wood',
    name: 'Wooden Sword',
    nameZh: '木剑',
    type: 'weapon',
    rarity: 'common',
    size: { width: 1, height: 2 },
    effects: [{ type: 'attack', value: 5 }],
    color: '#8B4513',
    cost: 10,
  },
  sword_iron: {
    id: 'sword_iron',
    name: 'Iron Sword',
    nameZh: '铁剑',
    type: 'weapon',
    rarity: 'rare',
    size: { width: 1, height: 2 },
    effects: [{ type: 'attack', value: 12 }],
    color: '#708090',
    cost: 25,
  },
  staff_magic: {
    id: 'staff_magic',
    name: 'Magic Staff',
    nameZh: '魔法杖',
    type: 'weapon',
    rarity: 'rare',
    size: { width: 1, height: 2 },
    effects: [
      { type: 'attack', value: 8 },
      { type: 'crit', value: 10 },
    ],
    color: '#9370DB',
    cost: 30,
  },
  bow_long: {
    id: 'bow_long',
    name: 'Long Bow',
    nameZh: '长弓',
    type: 'weapon',
    rarity: 'common',
    size: { width: 2, height: 1 },
    effects: [{ type: 'attack', value: 7 }],
    color: '#228B22',
    cost: 15,
  },
  dagger_quick: {
    id: 'dagger_quick',
    name: 'Quick Dagger',
    nameZh: '匕首',
    type: 'weapon',
    rarity: 'common',
    size: { width: 1, height: 1 },
    effects: [
      { type: 'attack', value: 3 },
      { type: 'speed', value: 10 },
    ],
    color: '#C0C0C0',
    cost: 12,
  },

  // Armor (2x2 or 1x2)
  shield_wood: {
    id: 'shield_wood',
    name: 'Wooden Shield',
    nameZh: '木盾',
    type: 'armor',
    rarity: 'common',
    size: { width: 1, height: 2 },
    effects: [{ type: 'defense', value: 5 }],
    color: '#8B4513',
    cost: 12,
  },
  armor_leather: {
    id: 'armor_leather',
    name: 'Leather Armor',
    nameZh: '皮甲',
    type: 'armor',
    rarity: 'common',
    size: { width: 2, height: 2 },
    effects: [
      { type: 'hp', value: 20 },
      { type: 'defense', value: 3 },
    ],
    color: '#D2691E',
    cost: 20,
  },
  armor_iron: {
    id: 'armor_iron',
    name: 'Iron Armor',
    nameZh: '铁甲',
    type: 'armor',
    rarity: 'rare',
    size: { width: 2, height: 2 },
    effects: [
      { type: 'hp', value: 40 },
      { type: 'defense', value: 8 },
    ],
    color: '#708090',
    cost: 35,
  },
  helmet_steel: {
    id: 'helmet_steel',
    name: 'Steel Helmet',
    nameZh: '钢盔',
    type: 'armor',
    rarity: 'rare',
    size: { width: 1, height: 1 },
    effects: [{ type: 'defense', value: 6 }],
    color: '#708090',
    cost: 18,
  },

  // Gems (1x1) - adjacency bonuses
  gem_ruby: {
    id: 'gem_ruby',
    name: 'Ruby',
    nameZh: '红宝石',
    type: 'gem',
    rarity: 'rare',
    size: { width: 1, height: 1 },
    effects: [{ type: 'attack', value: 8 }],
    color: '#DC143C',
    cost: 25,
  },
  gem_sapphire: {
    id: 'gem_sapphire',
    name: 'Sapphire',
    nameZh: '蓝宝石',
    type: 'gem',
    rarity: 'rare',
    size: { width: 1, height: 1 },
    effects: [{ type: 'defense', value: 8 }],
    color: '#4169E1',
    cost: 25,
  },
  gem_emerald: {
    id: 'gem_emerald',
    name: 'Emerald',
    nameZh: '翡翠',
    type: 'gem',
    rarity: 'rare',
    size: { width: 1, height: 1 },
    effects: [{ type: 'speed', value: 15 }],
    color: '#50C878',
    cost: 25,
  },
  gem_diamond: {
    id: 'gem_diamond',
    name: 'Diamond',
    nameZh: '钻石',
    type: 'gem',
    rarity: 'legendary',
    size: { width: 1, height: 1 },
    effects: [
      { type: 'attack', value: 5 },
      { type: 'defense', value: 5 },
      { type: 'hp', value: 15 },
    ],
    color: '#E0FFFF',
    cost: 50,
  },

  // Consumables (1x1)
  potion_hp: {
    id: 'potion_hp',
    name: 'Health Potion',
    nameZh: '生命药水',
    type: 'consumable',
    rarity: 'common',
    size: { width: 1, height: 1 },
    effects: [{ type: 'heal', value: 30 }],
    color: '#FF6B6B',
    cost: 8,
  },
  scroll_attack: {
    id: 'scroll_attack',
    name: 'Attack Scroll',
    nameZh: '攻击卷轴',
    type: 'consumable',
    rarity: 'common',
    size: { width: 1, height: 1 },
    effects: [{ type: 'attack', value: 4 }],
    color: '#FFD700',
    cost: 10,
  },

  // Legendary items
  sword_excalibur: {
    id: 'sword_excalibur',
    name: 'Excalibur',
    nameZh: '誓约胜利之剑',
    type: 'weapon',
    rarity: 'legendary',
    size: { width: 1, height: 2 },
    effects: [
      { type: 'attack', value: 25 },
      { type: 'crit', value: 20 },
      { type: 'lifesteal', value: 10 },
    ],
    color: '#FFD700',
    cost: 100,
  },
};

// Hero definitions
export const heroConfigs: Record<string, HeroDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    nameZh: '战士',
    heroClass: 'warrior',
    baseStats: {
      hp: 120,
      attack: 15,
      defense: 10,
      speed: 80,
    },
    color: '#CD5C5C',
    attackRange: 50,
    attackSpeed: 1.0,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    nameZh: '法师',
    heroClass: 'mage',
    baseStats: {
      hp: 80,
      attack: 25,
      defense: 5,
      speed: 70,
    },
    color: '#9370DB',
    attackRange: 120,
    attackSpeed: 0.8,
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    nameZh: '弓箭手',
    heroClass: 'archer',
    baseStats: {
      hp: 90,
      attack: 18,
      defense: 6,
      speed: 100,
    },
    color: '#3CB371',
    attackRange: 100,
    attackSpeed: 1.2,
  },
  healer: {
    id: 'healer',
    name: 'Healer',
    nameZh: '牧师',
    heroClass: 'healer',
    baseStats: {
      hp: 100,
      attack: 10,
      defense: 8,
      speed: 75,
    },
    color: '#FFB6C1',
    attackRange: 80,
    attackSpeed: 1.5,
  },
};

// Enemy definitions
export const enemyConfigs: Record<string, EnemyDefinition> = {
  slime_green: {
    id: 'slime_green',
    name: 'Green Slime',
    nameZh: '绿色史莱姆',
    hp: 30,
    attack: 5,
    defense: 2,
    speed: 50,
    reward: 5,
    color: '#90EE90',
    size: 20,
  },
  slime_blue: {
    id: 'slime_blue',
    name: 'Blue Slime',
    nameZh: '蓝色史莱姆',
    hp: 50,
    attack: 8,
    defense: 4,
    speed: 45,
    reward: 8,
    color: '#87CEEB',
    size: 25,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    nameZh: '哥布林',
    hp: 40,
    attack: 12,
    defense: 3,
    speed: 70,
    reward: 10,
    color: '#9ACD32',
    size: 22,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    nameZh: '骷髅',
    hp: 60,
    attack: 15,
    defense: 5,
    speed: 60,
    reward: 12,
    color: '#F5F5DC',
    size: 24,
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    nameZh: '兽人',
    hp: 100,
    attack: 20,
    defense: 8,
    speed: 40,
    reward: 20,
    color: '#556B2F',
    size: 30,
  },
  dragon_baby: {
    id: 'dragon_baby',
    name: 'Baby Dragon',
    nameZh: '幼龙',
    hp: 150,
    attack: 25,
    defense: 10,
    speed: 55,
    reward: 35,
    color: '#FF4500',
    size: 35,
  },
  boss_dragon: {
    id: 'boss_dragon',
    name: 'Dragon Boss',
    nameZh: '龙BOSS',
    hp: 500,
    attack: 40,
    defense: 15,
    speed: 30,
    reward: 100,
    color: '#8B0000',
    size: 50,
  },
};

// Wave configurations
export const waveConfigs: WaveConfig[] = [
  {
    waveNumber: 1,
    enemies: [
      { enemyId: 'slime_green', count: 5 },
    ],
    reward: 15,
  },
  {
    waveNumber: 2,
    enemies: [
      { enemyId: 'slime_green', count: 4 },
      { enemyId: 'slime_blue', count: 2 },
    ],
    reward: 25,
  },
  {
    waveNumber: 3,
    enemies: [
      { enemyId: 'slime_blue', count: 3 },
      { enemyId: 'goblin', count: 3 },
    ],
    reward: 35,
  },
  {
    waveNumber: 4,
    enemies: [
      { enemyId: 'goblin', count: 5 },
      { enemyId: 'skeleton', count: 2 },
    ],
    reward: 45,
  },
  {
    waveNumber: 5,
    enemies: [
      { enemyId: 'skeleton', count: 4 },
      { enemyId: 'orc', count: 1 },
    ],
    reward: 60,
  },
  {
    waveNumber: 6,
    enemies: [
      { enemyId: 'slime_blue', count: 4 },
      { enemyId: 'goblin', count: 4 },
      { enemyId: 'orc', count: 1 },
    ],
    reward: 75,
  },
  {
    waveNumber: 7,
    enemies: [
      { enemyId: 'skeleton', count: 5 },
      { enemyId: 'orc', count: 2 },
    ],
    reward: 90,
  },
  {
    waveNumber: 8,
    enemies: [
      { enemyId: 'orc', count: 3 },
      { enemyId: 'dragon_baby', count: 1 },
    ],
    reward: 110,
  },
  {
    waveNumber: 9,
    enemies: [
      { enemyId: 'skeleton', count: 6 },
      { enemyId: 'dragon_baby', count: 2 },
    ],
    reward: 130,
  },
  {
    waveNumber: 10,
    enemies: [
      { enemyId: 'orc', count: 3 },
      { enemyId: 'dragon_baby', count: 2 },
      { enemyId: 'boss_dragon', count: 1 },
    ],
    reward: 200,
  },
];

/**
 * Get item configuration by ID
 */
export function getItemConfig(id: string): ItemDefinition | undefined {
  return itemConfigs[id];
}

/**
 * Get random items for shop
 */
export function getRandomShopItems(count: number, wave: number): ItemDefinition[] {
  const items = Object.values(itemConfigs);
  const availableItems = items.filter(item => item.cost <= wave * 20 + 30);
  const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get hero configuration by ID
 */
export function getHeroConfig(id: string): HeroDefinition | undefined {
  return heroConfigs[id];
}

/**
 * Get all hero configurations
 */
export function getAllHeroConfigs(): HeroDefinition[] {
  return Object.values(heroConfigs);
}

/**
 * Get enemy configuration by ID
 */
export function getEnemyConfig(id: string): EnemyDefinition | undefined {
  return enemyConfigs[id];
}

/**
 * Get wave configuration by wave number
 */
export function getWaveConfig(waveNumber: number): WaveConfig | undefined {
  return waveConfigs.find(w => w.waveNumber === waveNumber);
}

/**
 * Get total wave count
 */
export function getTotalWaves(): number {
  return waveConfigs.length;
}
