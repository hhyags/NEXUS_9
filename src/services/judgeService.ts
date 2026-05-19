import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DbJudgeScore } from '../types';
import { JUDGE_CRITERIA } from '../config/gameConfig';

export interface JudgeScoreInput {
  team_id: string;
  judge_name: string;
  logic_score: number;
  ethics_score: number;
  creativity_score: number;
  emotional_score: number;
  persuasiveness_score: number;
  judge_comment: string;
}

/**
 * Save or update judge scores for a team (multi-judge safe).
 * Upserts on (team_id, judge_name) unique constraint.
 */
export async function saveJudgeScores(input: JudgeScoreInput): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('judge_scores')
      .upsert(input, { onConflict: 'team_id,judge_name' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[JudgeService] Failed to save scores:', err);
    return false;
  }
}

/**
 * Lock a judge score after submission (prevents edits without admin override).
 */
export async function lockJudgeScore(teamId: string, judgeName: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('judge_scores')
      .update({ is_locked: true })
      .eq('team_id', teamId)
      .eq('judge_name', judgeName);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[JudgeService] Failed to lock score:', err);
    return false;
  }
}

/**
 * Admin override: unlock a judge score for editing.
 */
export async function unlockJudgeScore(teamId: string, judgeName: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('judge_scores')
      .update({ is_locked: false })
      .eq('team_id', teamId)
      .eq('judge_name', judgeName);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[JudgeService] Failed to unlock score:', err);
    return false;
  }
}

/**
 * Fetch all judge scores for a specific team (returns array for multi-judge).
 */
export async function fetchJudgeScoresForTeam(teamId: string): Promise<DbJudgeScore[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('judge_scores')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });
    return (data as DbJudgeScore[]) || [];
  } catch {
    return [];
  }
}

/**
 * Fetch judge scores for a specific team by a specific judge.
 */
export async function fetchJudgeScoreByJudge(teamId: string, judgeName: string): Promise<DbJudgeScore | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('judge_scores')
      .select('*')
      .eq('team_id', teamId)
      .eq('judge_name', judgeName)
      .single();
    return data as DbJudgeScore | null;
  } catch {
    return null;
  }
}

/**
 * Fetch all judge scores across all teams.
 */
export async function fetchAllJudgeScores(): Promise<DbJudgeScore[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('judge_scores')
      .select('*')
      .order('total', { ascending: false });
    return (data as DbJudgeScore[]) || [];
  } catch {
    return [];
  }
}

/**
 * Get submission count for a specific team.
 * Returns how many judges have submitted scores for that team.
 */
export function getJudgeSubmissionCount(
  allScores: DbJudgeScore[],
  teamId: string,
  expectedJudgeCount: number
): { submitted: number; total: number } {
  const teamScores = allScores.filter((s) => s.team_id === teamId);
  return { submitted: teamScores.length, total: expectedJudgeCount };
}

/**
 * Calculate the average judge total for a team from all judge submissions.
 */
export function calculateJudgeAverage(allScores: DbJudgeScore[], teamId: string): number {
  const teamScores = allScores.filter((s) => s.team_id === teamId);
  if (teamScores.length === 0) return 0;
  const sum = teamScores.reduce((acc, s) => acc + s.total, 0);
  return Math.round((sum / teamScores.length) * 100) / 100;
}

/**
 * Normalize judge score to 0-100 scale.
 * normalizedJudgeScore = (judgeAverage / 25) * 100
 */
export function calculateNormalizedJudgeScore(judgeAverage: number): number {
  return Math.round(((judgeAverage / 25) * 100) * 100) / 100;
}

/**
 * Calculate final weighted score.
 * finalScore = (gameScore * 0.7) + (normalizedJudgeScore * 0.3)
 */
export function calculateFinalWeightedScore(gameScore: number, normalizedJudgeScore: number): number {
  return Math.round(((gameScore * 0.7) + (normalizedJudgeScore * 0.3)) * 100) / 100;
}

/**
 * Check if all judges have submitted for all teams.
 */
export function allJudgesSubmitted(
  allScores: DbJudgeScore[],
  teamIds: string[],
  expectedJudgeCount: number
): boolean {
  return teamIds.every((teamId) => {
    const count = allScores.filter((s) => s.team_id === teamId).length;
    return count >= expectedJudgeCount;
  });
}

/**
 * Get criteria list for UI rendering.
 */
export function getJudgeCriteria() {
  return JUDGE_CRITERIA;
}

/**
 * Calculate total from individual scores.
 */
export function calculateJudgeTotal(scores: {
  logic: number;
  ethics: number;
  creativity: number;
  emotional: number;
  persuasiveness: number;
}): number {
  return scores.logic + scores.ethics + scores.creativity + scores.emotional + scores.persuasiveness;
}
