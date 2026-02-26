/**
 * Bullet pattern generation utility for bullet hell games
 * Provides various bullet spawning patterns for enemy attacks
 */

/**
 * Available bullet pattern types
 */
export enum PatternType {
  /** Bullets move in a straight line */
  STRAIGHT = 'straight',
  /** Bullets spread in a cone/arc */
  SPREAD = 'spread',
  /** Bullets spiral outward */
  SPIRAL = 'spiral',
  /** Bullets aimed directly at target */
  AIMED = 'aimed',
  /** Multiple bullets fired in quick succession */
  BURST = 'burst'
}

/**
 * Configuration for bullet pattern generation
 */
export interface PatternConfig {
  /** Type of pattern to generate */
  patternType: PatternType;
  /** Number of bullets to generate */
  bulletCount: number;
  /** Base angle in radians (0 = right, PI/2 = down, etc.) */
  angle: number;
  /** Spread angle in radians (for spread patterns) */
  spreadAngle?: number;
  /** Speed of bullets (pixels per second) */
  speed: number;
  /** Damage each bullet deals */
  damage: number;
  /** Entity ID or identifier of who owns the bullets */
  owner: string;
  /** Target position for aimed patterns (x, y) */
  target?: { x: number; y: number };
  /** Source position for pattern generation */
  source: { x: number; y: number };
  /** Spiral pattern parameters */
  spiral?: {
    /** Angular speed for spiral */
    angularSpeed?: number;
    /** Number of spiral arms */
    arms?: number;
  };
  /** Burst pattern delay between bullets (ms) */
  burstDelay?: number;
}

/**
 * Result of pattern generation
 */
export interface BulletVelocity {
  /** Velocity in X direction */
  vx: number;
  /** Velocity in Y direction */
  vy: number;
  /** Angle of travel in radians */
  angle: number;
  /** Damage value for the bullet */
  damage: number;
  /** Owner identifier */
  owner: string;
  /** Optional delay for burst patterns (in milliseconds) */
  delay?: number;
}

/**
 * Generate bullet velocities based on pattern configuration
 *
 * @param config - Pattern configuration object
 * @returns Array of bullet velocity objects
 */
export function generateBulletPattern(config: PatternConfig): BulletVelocity[] {
  const bullets: BulletVelocity[] = [];

  switch (config.patternType) {
    case PatternType.STRAIGHT:
      bullets.push(...generateStraightPattern(config));
      break;
    case PatternType.SPREAD:
      bullets.push(...generateSpreadPattern(config));
      break;
    case PatternType.SPIRAL:
      bullets.push(...generateSpiralPattern(config));
      break;
    case PatternType.AIMED:
      bullets.push(...generateAimedPattern(config));
      break;
    case PatternType.BURST:
      bullets.push(...generateBurstPattern(config));
      break;
    default:
      console.warn(`Unknown pattern type: ${config.patternType}`);
  }

  return bullets;
}

/**
 * Generate a straight line bullet pattern
 */
function generateStraightPattern(config: PatternConfig): BulletVelocity[] {
  const { bulletCount, angle, speed, damage, owner } = config;

  // For straight pattern, bulletCount creates multiple bullets
  // all moving in the same direction with slight timing or spacing
  return Array.from({ length: bulletCount }, () => ({
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    damage,
    owner
  }));
}

/**
 * Generate a spread/cone bullet pattern
 */
function generateSpreadPattern(config: PatternConfig): BulletVelocity[] {
  const { bulletCount, angle, spreadAngle = Math.PI / 2, speed, damage, owner } = config;

  const halfSpread = spreadAngle / 2;
  const startAngle = angle - halfSpread;
  const angleStep = bulletCount > 1 ? spreadAngle / (bulletCount - 1) : 0;

  return Array.from({ length: bulletCount }, (_, i) => {
    const bulletAngle = startAngle + angleStep * i;
    return {
      vx: Math.cos(bulletAngle) * speed,
      vy: Math.sin(bulletAngle) * speed,
      angle: bulletAngle,
      damage,
      owner
    };
  });
}

/**
 * Generate a spiral bullet pattern
 */
function generateSpiralPattern(config: PatternConfig): BulletVelocity[] {
  const {
    bulletCount,
    angle,
    speed,
    damage,
    owner,
    spiral = { angularSpeed: Math.PI / 8, arms: 3 }
  } = config;

  const { angularSpeed = Math.PI / 8, arms = 3 } = spiral;
  const bulletsPerArm = Math.floor(bulletCount / arms);

  const bullets: BulletVelocity[] = [];

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (Math.PI * 2 * arm) / arms;
    for (let i = 0; i < bulletsPerArm; i++) {
      const bulletAngle = angle + armOffset + angularSpeed * i;
      bullets.push({
        vx: Math.cos(bulletAngle) * speed,
        vy: Math.sin(bulletAngle) * speed,
        angle: bulletAngle,
        damage,
        owner
      });
    }
  }

  return bullets;
}

/**
 * Generate an aimed bullet pattern (targets specific position)
 */
function generateAimedPattern(config: PatternConfig): BulletVelocity[] {
  const { bulletCount, source, target, speed, damage, owner, spreadAngle = Math.PI / 12 } = config;

  if (!target) {
    console.warn('Aimed pattern requires target position');
    return [];
  }

  // Calculate angle to target
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const targetAngle = Math.atan2(dy, dx);

  // For aimed pattern, create bullets aimed at target with slight spread
  const halfSpread = spreadAngle / 2;
  const startAngle = targetAngle - halfSpread;
  const angleStep = bulletCount > 1 ? spreadAngle / (bulletCount - 1) : 0;

  return Array.from({ length: bulletCount }, (_, i) => {
    const bulletAngle = bulletCount > 1 ? startAngle + angleStep * i : targetAngle;
    return {
      vx: Math.cos(bulletAngle) * speed,
      vy: Math.sin(bulletAngle) * speed,
      angle: bulletAngle,
      damage,
      owner
    };
  });
}

/**
 * Generate a burst bullet pattern (bullets with delays)
 */
function generateBurstPattern(config: PatternConfig): BulletVelocity[] {
  const { bulletCount, angle, speed, damage, owner, burstDelay = 100 } = config;

  return Array.from({ length: bulletCount }, (_, i) => ({
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    damage,
    owner,
    delay: i * burstDelay
  }));
}

/**
 * Helper to create a standard pattern config with defaults
 */
export function createPatternConfig(
  patternType: PatternType,
  source: { x: number; y: number },
  overrides: Partial<PatternConfig> = {}
): PatternConfig {
  const defaults: Omit<PatternConfig, 'patternType' | 'source'> = {
    bulletCount: 1,
    angle: 0,
    spreadAngle: Math.PI / 2,
    speed: 200,
    damage: 1,
    owner: 'enemy',
    spiral: {
      angularSpeed: Math.PI / 8,
      arms: 1
    },
    burstDelay: 100
  };

  return {
    ...defaults,
    ...overrides,
    patternType,
    source
  };
}
