import {
  ROUND_MAX_SCORES,
  ROUND_EXPECTED_TIMES,
  HINT_COSTS,
  OVERTIME_PENALTY_PER_MINUTE,
  STEP_WEIGHTS,
} from '../config/gameConfig';

/**
 * Calculate dynamic score for a completed step within a round.
 *
 * @param round        Current round (1-4)
 * @param stepIndex    Step index within round (0-based)
 * @param quality      Quality multiplier 0.0 – 1.0 (1.0 = perfect)
 * @param elapsedSec   Seconds elapsed since round started
 * @param hintsUsedInRound Number of hints used in this round so far
 */
export function calculateStepScore(
  round: number,
  stepIndex: number,
  quality: number,
  elapsedSec: number,
  hintsUsedInRound: number
): { score: number; breakdown: ScoreBreakdown } {
  const roundMax = ROUND_MAX_SCORES[round] || 20;
  const weights = STEP_WEIGHTS[round] || [1];
  const stepWeight = weights[stepIndex] ?? (1 / weights.length);
  const stepMax = roundMax * stepWeight;

  // Base score from quality (0-1)
  let baseScore = stepMax * Math.max(0, Math.min(1, quality));

  // Time bonus/penalty
  const expectedTime = ROUND_EXPECTED_TIMES[round] || 1200;
  const timeFactor = calculateTimeFactor(elapsedSec, expectedTime);
  const timeAdjusted = baseScore * timeFactor;

  // Hint deductions
  const hintCost = HINT_COSTS[round] || 1;
  const hintPenalty = hintsUsedInRound * hintCost;

  const finalScore = Math.max(0, Math.round((timeAdjusted - hintPenalty) * 100) / 100);

  return {
    score: finalScore,
    breakdown: {
      stepMax,
      baseScore: Math.round(baseScore * 100) / 100,
      timeFactor: Math.round(timeFactor * 100) / 100,
      timeAdjusted: Math.round(timeAdjusted * 100) / 100,
      hintPenalty,
      finalScore,
    },
  };
}

/**
 * Calculate time factor: 1.0 at or under expected, decreasing after.
 */
function calculateTimeFactor(elapsedSec: number, expectedSec: number): number {
  if (elapsedSec <= expectedSec * 0.5) return 1.0;   // fast bonus region
  if (elapsedSec <= expectedSec) return 1.0;          // on time
  const overtimeMinutes = (elapsedSec - expectedSec) / 60;
  const penalty = overtimeMinutes * OVERTIME_PENALTY_PER_MINUTE * 0.05; // 2.5% per extra minute
  return Math.max(0.3, 1.0 - penalty); // floor at 30%
}

/**
 * Check if efficiency is dropping (team exceeded expected round time).
 */
export function isEfficiencyDropping(elapsedSec: number, round: number): boolean {
  const expected = ROUND_EXPECTED_TIMES[round] || 1200;
  return elapsedSec > expected;
}

/**
 * Get efficiency percentage for UI display.
 */
export function getEfficiencyPercent(elapsedSec: number, round: number): number {
  const expected = ROUND_EXPECTED_TIMES[round] || 1200;
  const factor = calculateTimeFactor(elapsedSec, expected);
  return Math.round(factor * 100);
}

/**
 * Calculate total score across all rounds.
 */
export function calculateTotalScore(roundScores: number[]): number {
  return Math.min(100, roundScores.reduce((a, b) => a + b, 0));
}

/**
 * Get hint cost for a given round.
 */
export function getHintCost(round: number): number {
  return HINT_COSTS[round] || 0;
}

export interface ScoreBreakdown {
  stepMax: number;
  baseScore: number;
  timeFactor: number;
  timeAdjusted: number;
  hintPenalty: number;
  finalScore: number;
}
