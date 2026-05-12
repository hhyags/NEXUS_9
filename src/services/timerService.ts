import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GLOBAL_TIMER_SECONDS, ROUND_EXPECTED_TIMES } from '../config/gameConfig';

/**
 * Get the global timer value from Supabase session_state.
 */
export async function fetchGlobalTimer(): Promise<number> {
  if (!isSupabaseConfigured) return GLOBAL_TIMER_SECONDS;
  try {
    const { data } = await supabase
      .from('session_state')
      .select('global_timer')
      .eq('id', 1)
      .single();
    return data?.global_timer ?? GLOBAL_TIMER_SECONDS;
  } catch {
    return GLOBAL_TIMER_SECONDS;
  }
}

/**
 * Update the global timer in Supabase.
 */
export async function syncGlobalTimer(seconds: number): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('session_state')
      .update({ global_timer: seconds })
      .eq('id', 1);
  } catch (err) {
    console.warn('[TimerService] Failed to sync timer:', err);
  }
}

/**
 * Pause / resume the game.
 */
export async function setGamePaused(paused: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('session_state')
      .update({ is_paused: paused })
      .eq('id', 1);
  } catch (err) {
    console.warn('[TimerService] Failed to set pause state:', err);
  }
}

/**
 * Start a round timer entry for a team.
 */
export async function startRoundTimer(teamId: string, roundNumber: number): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('rounds')
      .upsert({
        team_id: teamId,
        round_number: roundNumber,
        started_at: new Date().toISOString(),
        expected_time: ROUND_EXPECTED_TIMES[roundNumber] || 1200,
      }, { onConflict: 'team_id,round_number' })
      .select('id')
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Complete a round timer entry.
 */
export async function completeRoundTimer(
  teamId: string,
  roundNumber: number,
  timeTaken: number,
  score: number
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('rounds')
      .update({
        completed_at: new Date().toISOString(),
        time_taken: timeTaken,
        score,
      })
      .eq('team_id', teamId)
      .eq('round_number', roundNumber);
  } catch (err) {
    console.warn('[TimerService] Failed to complete round timer:', err);
  }
}

/**
 * Get expected time for a round in seconds.
 */
export function getExpectedTime(round: number): number {
  return ROUND_EXPECTED_TIMES[round] || 1200;
}

/**
 * Format seconds to MM:SS display.
 */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to HH:MM:SS (for legacy displays).
 */
export function formatTimerLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
