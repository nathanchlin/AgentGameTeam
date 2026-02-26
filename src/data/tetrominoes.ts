/**
 * Tetromino definitions for Tetris
 * Each tetromino has 4 rotation states (0, 1, 2, 3 = spawn, R, 2, L)
 */

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetrominoData {
  type: TetrominoType;
  color: string;
  borderColor: string;
  rotations: number[][][]; // 4 rotation states, each is a matrix
}

// Standard Tetris colors
export const TETROMINO_COLORS = {
  I: { fill: '#00f0f0', border: '#00a0a0' },
  O: { fill: '#f0f000', border: '#a0a000' },
  T: { fill: '#a000f0', border: '#7000a0' },
  S: { fill: '#00f000', border: '#00a000' },
  Z: { fill: '#f00000', border: '#a00000' },
  J: { fill: '#0000f0', border: '#0000a0' },
  L: { fill: '#f0a000', border: '#a07000' },
};

/**
 * All 7 tetromino shapes with their 4 rotation states
 * Based on SRS (Super Rotation System) standard
 */
export const TETROMINOES: Record<TetrominoType, TetrominoData> = {
  I: {
    type: 'I',
    color: TETROMINO_COLORS.I.fill,
    borderColor: TETROMINO_COLORS.I.border,
    rotations: [
      // State 0 (spawn)
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      // State 1 (R)
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      // State 2 (2)
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      // State 3 (L)
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },

  O: {
    type: 'O',
    color: TETROMINO_COLORS.O.fill,
    borderColor: TETROMINO_COLORS.O.border,
    rotations: [
      // State 0 (spawn) - O piece doesn't rotate
      [
        [1, 1],
        [1, 1],
      ],
      // State 1 (R) - same as 0
      [
        [1, 1],
        [1, 1],
      ],
      // State 2 (2) - same as 0
      [
        [1, 1],
        [1, 1],
      ],
      // State 3 (L) - same as 0
      [
        [1, 1],
        [1, 1],
      ],
    ],
  },

  T: {
    type: 'T',
    color: TETROMINO_COLORS.T.fill,
    borderColor: TETROMINO_COLORS.T.border,
    rotations: [
      // State 0 (spawn)
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      // State 1 (R)
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      // State 2 (2)
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      // State 3 (L)
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },

  S: {
    type: 'S',
    color: TETROMINO_COLORS.S.fill,
    borderColor: TETROMINO_COLORS.S.border,
    rotations: [
      // State 0 (spawn)
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      // State 1 (R)
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
      // State 2 (2)
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      // State 3 (L)
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },

  Z: {
    type: 'Z',
    color: TETROMINO_COLORS.Z.fill,
    borderColor: TETROMINO_COLORS.Z.border,
    rotations: [
      // State 0 (spawn)
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      // State 1 (R)
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      // State 2 (2)
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      // State 3 (L)
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
  },

  J: {
    type: 'J',
    color: TETROMINO_COLORS.J.fill,
    borderColor: TETROMINO_COLORS.J.border,
    rotations: [
      // State 0 (spawn)
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      // State 1 (R)
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      // State 2 (2)
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      // State 3 (L)
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
  },

  L: {
    type: 'L',
    color: TETROMINO_COLORS.L.fill,
    borderColor: TETROMINO_COLORS.L.border,
    rotations: [
      // State 0 (spawn)
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      // State 1 (R)
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      // State 2 (2)
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      // State 3 (L)
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
};

/**
 * Get the rotation matrix for a tetromino at a given rotation state
 */
export function getRotationState(type: TetrominoType, rotation: number): number[][] {
  const normalizedRotation = ((rotation % 4) + 4) % 4;
  return TETROMINOES[type].rotations[normalizedRotation];
}

/**
 * Get tetromino color
 */
export function getTetrominoColor(type: TetrominoType): { fill: string; border: string } {
  return TETROMINO_COLORS[type];
}

/**
 * Get the size of a tetromino matrix (width/height)
 */
export function getTetrominoSize(type: TetrominoType): number {
  return type === 'O' ? 2 : (type === 'I' ? 4 : 3);
}

/**
 * All tetromino types in an array for randomization
 */
export const ALL_TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
