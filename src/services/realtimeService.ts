import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChangeCallback = (payload: { table: string; eventType: string; new: any; old: any }) => void;

let channels: RealtimeChannel[] = [];

/**
 * Subscribe to realtime changes across all game tables.
 */
export function subscribeToGameChanges(onUpdate: ChangeCallback): void {
  if (!isSupabaseConfigured) return;

  const tables = ['teams', 'judge_scores', 'session_state', 'mission_logs', 'rounds', 'final_submissions'];

  tables.forEach((table) => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          onUpdate({
            table,
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();
    channels.push(channel);
  });
}

/**
 * Subscribe to a specific table.
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured) return null;

  const channel = supabase
    .channel(`realtime-${table}-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();

  channels.push(channel);
  return channel;
}

/**
 * Unsubscribe from all channels.
 */
export function unsubscribeAll(): void {
  channels.forEach((ch) => supabase.removeChannel(ch));
  channels = [];
}

/**
 * Fetch all active teams with their members.
 */
export async function fetchAllTeams(): Promise<any[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .order('total_score', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch session state.
 */
export async function fetchSessionState(): Promise<any | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from('session_state')
      .select('*')
      .eq('id', 1)
      .single();
    return data;
  } catch {
    return null;
  }
}

/**
 * Trigger a game restart in session_state.
 */
export async function triggerRestart(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    // Increment restart_trigger to notify all clients
    const { data: current } = await supabase
      .from('session_state')
      .select('restart_trigger')
      .eq('id', 1)
      .single();

    await supabase
      .from('session_state')
      .update({
        global_timer: 6000,
        is_paused: true,
        game_started: false,
        current_phase: 'lobby',
        restart_trigger: (current?.restart_trigger || 0) + 1,
      })
      .eq('id', 1);

    // Delete all team data
    await supabase.from('puzzle_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('hints_used').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('judge_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('final_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('mission_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rounds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (err) {
    console.error('[RealtimeService] Restart failed:', err);
  }
}

/**
 * Add a mission log entry.
 */
export async function addMissionLog(
  teamId: string,
  message: string,
  logType: 'info' | 'success' | 'danger' | 'system' = 'info'
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('mission_logs').insert({
      team_id: teamId,
      message,
      log_type: logType,
    });
  } catch (err) {
    console.warn('[RealtimeService] Failed to add mission log:', err);
  }
}
