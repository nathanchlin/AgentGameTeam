/**
 * SRS (Super Rotation System) Wall Kick Data
 *
 * When a piece rotation would result in collision,
 * the game tests offset positions to find a valid placement.
 *
 * Format: [offsetX, offsetY] where Y is positive downward
 *
 * Rotation states: 0=spawn, 1=R, 2=2, 3=L
 */

export type RotationState = 0 | 1 | 2 | 3;
export type WallKickTest = [number, number];

/**
 * Wall kick data for J, L, S, T, Z pieces
 * Key format: "fromState>toState" (e.g., "0>1" means rotation from state 0 to state 1)
 */
export const JLSTZ_WALL_KICKS: Record<string, WallKickTest[]> = {
  // Clockwise rotation
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],

  // Counter-clockwise rotation
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
};

/**
 * Wall kick data for I piece (different due to its shape)
 */
export const I_WALL_KICKS: Record<string, WallKickTest[]> = {
  // Clockwise rotation
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],

  // Counter-clockwise rotation
  '0>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

/**
 * O piece doesn't need wall kicks (doesn't rotate)
 */
export const O_WALL_KICKS: Record<string, WallKickTest[]> = {
  '0>1': [[0, 0]],
  '1>2': [[0, 0]],
  '2>3': [[0, 0]],
  '3>0': [[0, 0]],
  '0>3': [[0, 0]],
  '3>2': [[0, 0]],
  '2>1': [[0, 0]],
  '1>0': [[0, 0]],
};

/**
 * Get wall kick tests for a rotation
 * @param pieceType - The tetromino type
 * @param fromState - Current rotation state
 * @param toState - Target rotation state
 * @returns Array of offset tests to try in order
 */
export function getWallKicks(
  pieceType: string,
  fromState: RotationState,
  toState: RotationState
): WallKickTest[] {
  const key = `${fromState}>${toState}`;

  if (pieceType === 'I') {
    return I_WALL_KICKS[key] || [[0, 0]];
  } else if (pieceType === 'O') {
    return O_WALL_KICKS[key] || [[0, 0]];
  } else {
    return JLSTZ_WALL_KICKS[key] || [[0, 0]];
  }
}

/**
 * Calculate the new rotation state after a clockwise rotation
 */
export function rotateClockwise(state: RotationState): RotationState {
  return ((state + 1) % 4) as RotationState;
}

/**
 * Calculate the new rotation state after a counter-clockwise rotation
 */
export function rotateCounterClockwise(state: RotationState): RotationState {
  return ((state + 3) % 4) as RotationState;
}

/**
 * Get a wall kick key for the rotation
 */
export function getWallKickKey(fromState: RotationState, toState: RotationState): string {
  return `${fromState}>${toState}`;
}
