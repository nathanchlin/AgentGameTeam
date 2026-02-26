/**
 * AI Heuristics for Tetris
 *
 * These functions evaluate board positions and help the AI
 * make decisions about piece placement.
 */

/**
 * Board representation: 0 = empty, 1 = filled
 */
export type BoardGrid = number[][];

/**
 * Result of evaluating a potential move
 */
export interface MoveEvaluation {
  score: number;
  x: number;
  rotation: number;
  linesCleared: number;
}

/**
 * Weights for AI heuristic scoring
 */
export interface AIWeights {
  aggregateHeight: number;
  completeLines: number;
  holes: number;
  bumpiness: number;
}

/**
 * Default weights for a balanced AI
 */
export const DEFAULT_WEIGHTS: AIWeights = {
  aggregateHeight: -0.510066,
  completeLines: 0.760666,
  holes: -0.35663,
  bumpiness: -0.184483,
};

/**
 * Aggressive weights - focuses on clearing lines
 */
export const AGGRESSIVE_WEIGHTS: AIWeights = {
  aggregateHeight: -0.3,
  completeLines: 1.2,
  holes: -0.2,
  bumpiness: -0.1,
};

/**
 * Defensive weights - focuses on staying alive
 */
export const DEFENSIVE_WEIGHTS: AIWeights = {
  aggregateHeight: -0.7,
  completeLines: 0.4,
  holes: -0.5,
  bumpiness: -0.3,
};

/**
 * Calculate the height of each column
 */
export function getColumnHeights(board: BoardGrid): number[] {
  const heights: number[] = [];
  const width = board[0]?.length || 10;

  for (let x = 0; x < width; x++) {
    let height = 0;
    for (let y = 0; y < board.length; y++) {
      if (board[y][x]) {
        height = board.length - y;
        break;
      }
    }
    heights.push(height);
  }

  return heights;
}

/**
 * Calculate aggregate height (sum of all column heights)
 */
export function calculateAggregateHeight(board: BoardGrid): number {
  const heights = getColumnHeights(board);
  return heights.reduce((sum, h) => sum + h, 0);
}

/**
 * Count complete lines in the board
 */
export function countCompleteLines(board: BoardGrid): number {
  let count = 0;
  for (const row of board) {
    if (row.every((cell) => cell !== 0)) {
      count++;
    }
  }
  return count;
}

/**
 * Count holes (empty cells with filled cells above them)
 */
export function countHoles(board: BoardGrid): number {
  let holes = 0;
  const width = board[0]?.length || 10;

  for (let x = 0; x < width; x++) {
    let foundBlock = false;
    for (let y = 0; y < board.length; y++) {
      if (board[y][x]) {
        foundBlock = true;
      } else if (foundBlock) {
        // Empty cell below a filled cell = hole
        holes++;
      }
    }
  }

  return holes;
}

/**
 * Calculate bumpiness (sum of absolute differences between adjacent column heights)
 */
export function calculateBumpiness(board: BoardGrid): number {
  const heights = getColumnHeights(board);
  let bumpiness = 0;

  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }

  return bumpiness;
}

/**
 * Evaluate a board position using weighted heuristics
 */
export function evaluateBoard(board: BoardGrid, weights: AIWeights = DEFAULT_WEIGHTS): number {
  const aggregateHeight = calculateAggregateHeight(board);
  const completeLines = countCompleteLines(board);
  const holes = countHoles(board);
  const bumpiness = calculateBumpiness(board);

  return (
    weights.aggregateHeight * aggregateHeight +
    weights.completeLines * completeLines +
    weights.holes * holes +
    weights.bumpiness * bumpiness
  );
}

/**
 * Check if a piece placement is valid
 */
export function isValidPosition(
  board: BoardGrid,
  pieceMatrix: number[][],
  posX: number,
  posY: number
): boolean {
  for (let y = 0; y < pieceMatrix.length; y++) {
    for (let x = 0; x < pieceMatrix[y].length; x++) {
      if (pieceMatrix[y][x]) {
        const boardX = posX + x;
        const boardY = posY + y;

        // Check bounds
        if (boardX < 0 || boardX >= (board[0]?.length || 10)) {
          return false;
        }
        if (boardY < 0 || boardY >= board.length) {
          return false;
        }

        // Check collision with placed pieces
        if (board[boardY] && board[boardY][boardX]) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Get the landing position for a piece (hard drop simulation)
 */
export function getLandingPosition(
  board: BoardGrid,
  pieceMatrix: number[][],
  startX: number,
  startY: number
): number {
  let landY = startY;
  while (isValidPosition(board, pieceMatrix, startX, landY + 1)) {
    landY++;
  }
  return landY;
}

/**
 * Place a piece on a copy of the board and return the new board
 */
export function placePiece(
  board: BoardGrid,
  pieceMatrix: number[][],
  posX: number,
  posY: number
): BoardGrid {
  // Deep copy the board
  const newBoard = board.map((row) => [...row]);

  for (let y = 0; y < pieceMatrix.length; y++) {
    for (let x = 0; x < pieceMatrix[y].length; x++) {
      if (pieceMatrix[y][x]) {
        const boardX = posX + x;
        const boardY = posY + y;
        if (boardY >= 0 && boardY < newBoard.length && boardX >= 0 && boardX < newBoard[0].length) {
          newBoard[boardY][boardX] = 1;
        }
      }
    }
  }

  return newBoard;
}

/**
 * Clear complete lines and return the new board
 */
export function clearCompleteLines(board: BoardGrid): { board: BoardGrid; linesCleared: number } {
  const width = board[0]?.length || 10;
  const newBoard = board.filter((row) => !row.every((cell) => cell !== 0));
  const linesCleared = board.length - newBoard.length;

  // Add empty rows at the top
  while (newBoard.length < board.length) {
    newBoard.unshift(new Array(width).fill(0));
  }

  return { board: newBoard, linesCleared };
}

/**
 * Find the best move for a piece
 * @param board - Current board state
 * @param rotationMatrices - Array of 4 pre-defined rotation matrices for the piece
 * @param weights - AI evaluation weights
 */
export function findBestMoveWithRotations(
  board: BoardGrid,
  rotationMatrices: number[][][],
  weights: AIWeights = DEFAULT_WEIGHTS
): MoveEvaluation | null {
  const width = board[0]?.length || 10;
  let bestMove: MoveEvaluation | null = null;
  let bestScore = -Infinity;

  // Try all rotations (use the provided pre-defined rotation matrices)
  const rotations = rotationMatrices.length;

  for (let rotation = 0; rotation < rotations; rotation++) {
    const rotatedMatrix = rotationMatrices[rotation];

    // Skip if this rotation is identical to a previous one (O piece)
    if (rotation > 0 && matricesEqual(rotatedMatrix, rotationMatrices[0])) {
      continue;
    }

    // Try all x positions
    for (let x = -2; x < width + 2; x++) {
      // Find landing position
      if (!isValidPosition(board, rotatedMatrix, x, 0)) continue;

      const landY = getLandingPosition(board, rotatedMatrix, x, 0);

      // Place piece and evaluate
      let testBoard = placePiece(board, rotatedMatrix, x, landY);
      const { board: clearedBoard, linesCleared } = clearCompleteLines(testBoard);
      testBoard = clearedBoard;

      const score = evaluateBoard(testBoard, weights);

      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          score,
          x,
          rotation,
          linesCleared,
        };
      }
    }
  }

  return bestMove;
}

/**
 * Check if two matrices are equal
 */
function matricesEqual(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  for (let y = 0; y < a.length; y++) {
    if (a[y].length !== b[y].length) return false;
    for (let x = 0; x < a[y].length; x++) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}

/**
 * Find the best move for a piece (legacy function using dynamic rotation)
 * @deprecated Use findBestMoveWithRotations with pre-defined rotation matrices instead
 */
export function findBestMove(
  board: BoardGrid,
  pieceMatrix: number[][],
  weights: AIWeights = DEFAULT_WEIGHTS
): MoveEvaluation | null {
  const width = board[0]?.length || 10;
  let bestMove: MoveEvaluation | null = null;
  let bestScore = -Infinity;

  // Try all rotations
  const rotations = pieceMatrix.length === 2 ? 1 : 4; // O piece only has 1 rotation

  for (let rotation = 0; rotation < rotations; rotation++) {
    const rotatedMatrix = rotateMatrix(pieceMatrix, rotation);

    // Try all x positions
    for (let x = -2; x < width + 2; x++) {
      // Find landing position
      if (!isValidPosition(board, rotatedMatrix, x, 0)) continue;

      const landY = getLandingPosition(board, rotatedMatrix, x, 0);

      // Place piece and evaluate
      let testBoard = placePiece(board, rotatedMatrix, x, landY);
      const { board: clearedBoard, linesCleared } = clearCompleteLines(testBoard);
      testBoard = clearedBoard;

      const score = evaluateBoard(testBoard, weights);

      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          score,
          x,
          rotation,
          linesCleared,
        };
      }
    }
  }

  return bestMove;
}

/**
 * Rotate a matrix by 90 degrees clockwise, n times
 */
function rotateMatrix(matrix: number[][], times: number): number[][] {
  let result = matrix;
  for (let i = 0; i < times; i++) {
    result = rotate90Clockwise(result);
  }
  return result;
}

/**
 * Rotate a matrix 90 degrees clockwise
 */
function rotate90Clockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];

  for (let x = 0; x < cols; x++) {
    const newRow: number[] = [];
    for (let y = rows - 1; y >= 0; y--) {
      newRow.push(matrix[y][x]);
    }
    result.push(newRow);
  }

  return result;
}
