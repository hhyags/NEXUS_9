import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SessionPhase } from '../types';

type ChangeCallback = (payload: { table: string; eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void;

let channels: RealtimeChannel[] = [];

/**
 * Subscribe to realtime changes across all game tables.
 */
export function subscribeToGameChanges(onUpdate: ChangeCallback): void {
  if (!isSupabaseConfigured) return;

  const tables = ['teams', 'judge_scores', 'session_state', 'mission_logs', 'rounds', 'final_submissions', 'security_logs', 'event_replay'];

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
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          });
        }
      )
      .subscribe();
    channels.push(channel);
  });
}

/**
 * Subscribe to a specific table with cleanup support.
 */
export function subscribeToTable(
  table: string,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured) return null;

  const channel = supabase
    .channel(`realtime-${table}-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback as (payload: unknown) => void
    )
    .subscribe();

  channels.push(channel);
  return channel;
}

/**
 * Unsubscribe from a specific channel.
 */
export function unsubscribeChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
  channels = channels.filter((ch) => ch !== channel);
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
export async function fetchAllTeams(): Promise<Record<string, unknown>[]> {
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
export async function fetchSessionState(): Promise<Record<string, unknown> | null> {
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
 * Update session phase.
 */
export async function updateSessionPhase(phase: SessionPhase): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('session_state').update({ current_phase: phase }).eq('id', 1);
  } catch (err) {
    console.warn('[RealtimeService] Failed to update phase:', err);
  }
}

/**
 * Broadcast an announcement to all clients.
 */
export async function broadcastAnnouncement(message: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('session_state').update({ announcement: message }).eq('id', 1);
  } catch (err) {
    console.warn('[RealtimeService] Failed to broadcast:', err);
  }
}

/**
 * Trigger ceremony phase.
 */
export async function triggerCeremony(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase
      .from('session_state')
      .update({ ceremony_triggered: true, current_phase: 'ceremony' })
      .eq('id', 1);
  } catch (err) {
    console.warn('[RealtimeService] Failed to trigger ceremony:', err);
  }
}

/**
 * Add bonus time to the global timer.
 */
export async function addBonusTime(seconds: number): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data: current } = await supabase
      .from('session_state')
      .select('global_timer, bonus_time_added')
      .eq('id', 1)
      .single();
    if (current) {
      await supabase
        .from('session_state')
        .update({
          global_timer: (current.global_timer as number) + seconds,
          bonus_time_added: (current.bonus_time_added as number || 0) + seconds,
        })
        .eq('id', 1);
    }
  } catch (err) {
    console.warn('[RealtimeService] Failed to add bonus time:', err);
  }
}

/**
 * Log a security event (anti-cheat).
 */
export async function logSecurityEvent(
  teamId: string,
  eventType: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('security_logs').insert({
      team_id: teamId,
      event_type: eventType,
      details,
    });
  } catch (err) {
    console.warn('[RealtimeService] Failed to log security event:', err);
  }
}

/**
 * Log a replay event.
 */
export async function logReplayEvent(
  eventType: string,
  payload: Record<string, unknown> = {},
  teamId?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('event_replay').insert({
      event_type: eventType,
      payload,
      team_id: teamId || null,
    });
  } catch (err) {
    console.warn('[RealtimeService] Failed to log replay event:', err);
  }
}

/**
 * Fetch mission logs from the database.
 */
export async function fetchMissionLogs(limit: number = 100): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('mission_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch security logs.
 */
export async function fetchSecurityLogs(limit: number = 50): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch replay events.
 */
export async function fetchReplayEvents(limit: number = 200): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('event_replay')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch final submissions.
 */
export async function fetchFinalSubmissions(): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('final_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    return data || [];
  } catch {
    return [];
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
        restart_trigger: ((current?.restart_trigger as number) || 0) + 1,
        ceremony_triggered: false,
        announcement: '',
        bonus_time_added: 0,
        forced_ceremony: false,
      })
      .eq('id', 1);

    // Delete all team data
    await supabase.from('puzzle_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('hints_used').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('judge_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('final_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('mission_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('security_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('event_replay').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
