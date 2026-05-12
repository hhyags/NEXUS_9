import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DbJudgeScore } from '../types';
import { JUDGE_CRITERIA } from '../config/gameConfig';

export interface JudgeScoreInput {
  team_id: string;
  logic_score: number;
  ethics_score: number;
  creativity_score: number;
  emotional_score: number;
  persuasiveness_score: number;
  judge_comment: string;
}

/**
 * Save or update judge scores for a team.
 */
export async function saveJudgeScores(input: JudgeScoreInput): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('judge_scores')
      .upsert(input, { onConflict: 'team_id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[JudgeService] Failed to save scores:', err);
    return false;
  }
}

/**
 * Fetch judge scores for a specific team.
 */
export async function fetchJudgeScores(teamId: string): Promise<DbJudgeScore | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('judge_scores')
      .select('*')
      .eq('team_id', teamId)
      .single();
    return data as DbJudgeScore | null;
  } catch {
    return null;
  }
}

/**
 * Fetch all judge scores.
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
