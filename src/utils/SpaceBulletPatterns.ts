/**
 * Space bullet hell pattern generation utility
 * Extends base BulletPatterns with space-specific patterns like rings, lasers, and homing bullets
 */

import {
  PatternType,
  PatternConfig,
  BulletVelocity
} from './BulletPatterns';

/**
 * Space-specific bullet pattern types
 */
export enum SpacePatternType {
  /** 360° circular spread of bullets */
  RING = 'ring',
  /** Line with warning indicator */
  LASER = 'laser',
  /** Bullets that track player */
  HOMING = 'homing'
}

/**
 * Extended configuration for space bullet patterns
 */
export interface SpacePatternConfig extends Omit<PatternConfig, 'patternType'> {
  /** Type of pattern (space or base pattern types) */
  patternType: SpacePatternType | PatternType;
  /** For ring pattern: starting radius from source */
  ringRadius?: number;
  /** For laser pattern: width of the laser line */
  laserWidth?: number;
  /** For laser pattern: length of the laser line (in bullets) */
  laserLength?: number;
  /** For laser pattern: warning time before firing (milliseconds) */
  laserChargeTime?: number;
  /** For homing pattern: how long bullets track (seconds) */
  homingDuration?: number;
  /** For homing pattern: max turn rate (radians/second) */
  homingTurnRate?: number;
}

/**
 * Extended bullet velocity interface for homing bullets
 */
export interface HomingBulletVelocity extends BulletVelocity {
  /** Whether this bullet has homing behavior */
  isHoming?: boolean;
  /** Maximum turn rate for homing (radians/second) */
  homingTurnRate?: number;
  /** Duration of homing behavior (seconds) */
  homingDuration?: number;
}

/**
 * Generate bullet velocities based on space pattern configuration
 *
 * @param config - Space pattern configuration object
 * @returns Array of bullet velocity objects
 */
export function generateSpaceBulletPattern(config: SpacePatternConfig): BulletVelocity[] {
  switch (config.patternType) {
    case SpacePatternType.RING:
      return generateRingPattern(config);
    case SpacePatternType.LASER:
      return generateLaserPattern(config);
    case SpacePatternType.HOMING:
      return generateHomingPattern(config);
    default:
      // Fall back to base patterns if a standard PatternType is passed
      const baseConfig = config as PatternConfig;
      // Import the base generator dynamically to avoid circular dependency
      const { generateBulletPattern } = require('./BulletPatterns');
      return generateBulletPattern(baseConfig);
  }
}

/**
 * Generate a 360° ring bullet pattern
 *
 * @param config - Pattern configuration
 * @returns Array of bullet velocities forming a ring
 */
function generateRingPattern(config: SpacePatternConfig): BulletVelocity[] {
  const { bulletCount, speed, damage, owner } = config;
  const bullets: BulletVelocity[] = [];

  for (let i = 0; i < bulletCount; i++) {
    const angle = (Math.PI * 2 * i) / bulletCount;
    bullets.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      damage,
      owner
    });
  }

  return bullets;
}

/**
 * Generate a laser bullet pattern (line of bullets)
 *
 * @param config - Pattern configuration
 * @returns Array of bullet velocities forming a line
 */
function generateLaserPattern(config: SpacePatternConfig): BulletVelocity[] {
  const { angle, speed, damage, owner, laserLength = 1 } = config;
  const bullets: BulletVelocity[] = [];

  // Create a line of bullets
  for (let i = 0; i < laserLength; i++) {
    // For a simple laser, create bullets with the same velocity
    // The offset is handled in rendering/positioning
    bullets.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      damage,
      owner,
      // Store offset information for rendering
      delay: i * 50 // Slight delay for visual effect
    });
  }

  return bullets;
}

/**
 * Generate a homing bullet pattern
 * Bullets start in a direction but can track toward a target
 *
 * @param config - Pattern configuration
 * @returns Array of bullet velocities with homing metadata
 */
function generateHomingPattern(config: SpacePatternConfig): BulletVelocity[] {
  const { bulletCount, angle, speed, damage, owner, homingTurnRate = 3, homingDuration = 2 } = config;
  const bullets: HomingBulletVelocity[] = [];

  // Initial direction, will be updated by homing logic in game systems
  for (let i = 0; i < bulletCount; i++) {
    const spreadAngle = bulletCount > 1
      ? angle + ((i - (bulletCount - 1) / 2) * Math.PI / 12)
      : angle;

    bullets.push({
      vx: Math.cos(spreadAngle) * speed,
      vy: Math.sin(spreadAngle) * speed,
      angle: spreadAngle,
      damage,
      owner,
      // Store homing metadata
      isHoming: true,
      homingTurnRate,
      homingDuration,
      delay: 0
    });
  }

  return bullets;
}

/**
 * Helper function to create space pattern config with sensible defaults
 *
 * @param patternType - The pattern type (space or base)
 * @param source - Source position for pattern generation
 * @param overrides - Optional overrides for default values
 * @returns Complete space pattern configuration
 */
export function createSpacePatternConfig(
  patternType: SpacePatternType | PatternType,
  source: { x: number; y: number },
  overrides: Partial<SpacePatternConfig> = {}
): SpacePatternConfig {
  const defaults: Omit<SpacePatternConfig, 'patternType' | 'source'> = {
    bulletCount: 1,
    angle: 0,
    spreadAngle: Math.PI / 2,
    speed: 200,
    damage: 1,
    owner: 'enemy',
    ringRadius: 0,
    laserWidth: 20,
    laserLength: 1,
    laserChargeTime: 500,
    homingDuration: 2,
    homingTurnRate: 3
  };

  return {
    ...defaults,
    ...overrides,
    patternType,
    source
  };
}

/**
 * Create a ring pattern configuration
 *
 * @param source - Source position
 * @param bulletCount - Number of bullets in the ring
 * @param speed - Bullet speed
 * @returns Ring pattern configuration
 */
export function createRingPattern(
  source: { x: number; y: number },
  bulletCount: number = 12,
  speed: number = 200
): SpacePatternConfig {
  return createSpacePatternConfig(SpacePatternType.RING, source, {
    bulletCount,
    speed
  });
}

/**
 * Create a laser pattern configuration
 *
 * @param source - Source position
 * @param angle - Direction of laser
 * @param laserWidth - Width of laser line
 * @param laserLength - Length in bullets
 * @returns Laser pattern configuration
 */
export function createLaserPattern(
  source: { x: number; y: number },
  angle: number,
  laserWidth: number = 20,
  laserLength: number = 1
): SpacePatternConfig {
  return createSpacePatternConfig(SpacePatternType.LASER, source, {
    angle,
    laserWidth,
    laserLength
  });
}

/**
 * Create a homing bullet pattern configuration
 *
 * @param source - Source position
 * @param angle - Initial direction
 * @param bulletCount - Number of homing bullets
 * @param speed - Bullet speed
 * @returns Homing pattern configuration
 */
export function createHomingPattern(
  source: { x: number; y: number },
  angle: number,
  bulletCount: number = 1,
  speed: number = 150
): SpacePatternConfig {
  return createSpacePatternConfig(SpacePatternType.HOMING, source, {
    angle,
    bulletCount,
    speed
  });
}
