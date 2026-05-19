import { useEffect, useState, useMemo } from 'react';
import { fetchAllTeams, fetchMissionLogs, fetchSessionState, subscribeToTable, unsubscribeChannel } from '../services/realtimeService';
import { fetchAllJudgeScores } from '../services/judgeService';
import { sortLeaderboard, computeEventSummary } from '../services/scoreService';
import { formatTimer } from '../services/timerService';
import { EventSummaryPanel } from '../components/EventSummaryPanel';
import type { CeremonyTeam, DbJudgeScore } from '../types';
import { Monitor, Users, Activity } from 'lucide-react';

export function SpectatorPage() {
  const [leaderboard, setLeaderboard] = useState<CeremonyTeam[]>([]);
  const [allJudgeScores, setAllJudgeScores] = useState<DbJudgeScore[]>([]);
  const [rawTeams, setRawTeams] = useState<Record<string, unknown>[]>([]);
  const [missionLogs, setMissionLogs] = useState<Record<string, unknown>[]>([]);
  const [sessionState, setSessionState] = useState<Record<string, unknown> | null>(null);

  const loadAll = async () => {
    const [teams, judges, logs, session] = await Promise.all([
      fetchAllTeams(),
      fetchAllJudgeScores(),
      fetchMissionLogs(50),
      fetchSessionState(),
    ]);
    setRawTeams(teams);
    setAllJudgeScores(judges);
    setMissionLogs(logs);
    setSessionState(session);

    const mapped = teams.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.team_name as string,
      gameScore: (t.total_score as number) || 0,
      completionTime: (t.completion_time as number) || 0,
      hintsUsed: (t.hints_used as number) || 0,
      roundsCleared: (t.current_round as number) || 1,
      roundScores: (t.round_scores as number[]) || [0, 0, 0, 0],
      membersCount: ((t.team_members as unknown[]) || []).length,
      status: (t.status as string) || 'active',
    }));
    setLeaderboard(sortLeaderboard(mapped, judges));
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 5000);

    const ch1 = subscribeToTable('teams', () => loadAll());
    const ch2 = subscribeToTable('session_state', () => loadAll());
    const ch3 = subscribeToTable('mission_logs', () => loadAll());
    const ch4 = subscribeToTable('judge_scores', () => loadAll());

    return () => {
      clearInterval(interval);
      if (ch1) unsubscribeChannel(ch1);
      if (ch2) unsubscribeChannel(ch2);
      if (ch3) unsubscribeChannel(ch3);
      if (ch4) unsubscribeChannel(ch4);
    };
  }, []);

  const summary = useMemo(() => {
    if (rawTeams.length === 0) return null;
    const mapped = rawTeams.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      name: t.team_name as string,
      gameScore: (t.total_score as number) || 0,
      completionTime: (t.completion_time as number) || 0,
      hintsUsed: (t.hints_used as number) || 0,
    }));
    return computeEventSummary(mapped, allJudgeScores);
  }, [rawTeams, allJudgeScores]);

  const globalTimer = (sessionState?.global_timer as number) || 6000;
  const currentPhase = (sessionState?.current_phase as string) || 'lobby';
  const announcement = (sessionState?.announcement as string) || '';
  const isCeremony = currentPhase === 'ceremony' || currentPhase === 'results';

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 scanline pointer-events-none opacity-10" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-neon-cyan" />
            <h1 className="text-3xl tracking-widest text-neon-cyan">SPECTATOR</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neon-green" />
              <span className="text-neon-green font-bold">{rawTeams.length} TEAMS</span>
            </div>
            <div className="text-3xl font-bold text-neon-green tracking-widest">{formatTimer(globalTimer)}</div>
            <div className={`px-3 py-1 border text-xs tracking-widest ${isCeremony ? 'border-yellow-400 text-yellow-400' : 'border-neon-cyan text-neon-cyan'}`}>
              {currentPhase.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Announcement */}
        {announcement && (
          <div className="border-2 border-warning-amber/50 bg-warning-amber/5 p-4 text-center text-warning-amber font-bold tracking-widest animate-pulse">
            📢 {announcement}
          </div>
        )}

        {/* Ceremony Summary */}
        {isCeremony && summary && (
          <EventSummaryPanel summary={summary} showWinnerAnimation={false} />
        )}

        {/* Live Leaderboard */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40 text-xs tracking-widest">
            <Activity className="w-3 h-3" /> LIVE LEADERBOARD
          </div>
          {leaderboard.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between p-4 border transition-all ${i === 0 ? 'border-neon-green/50 bg-neon-green/5' : 'border-white/10 bg-black/30'}`}>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-bold ${i === 0 ? 'text-neon-green' : i === 1 ? 'text-neon-cyan' : 'text-white/30'}`}>#{i + 1}</span>
                <div>
                  <div className="font-bold tracking-widest">{t.name}</div>
                  <div className="text-[10px] text-white/30">R{t.roundsCleared} · {t.hintsUsed} hints · {t.membersCount} members</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${i === 0 ? 'text-neon-green' : 'text-white/70'}`}>{t.finalScore.toFixed(1)}</div>
                <div className="text-[10px] text-white/30">Game: {t.gameScore.toFixed(1)} | Judge: {t.judgeAverage.toFixed(1)}</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center text-white/30 py-12 text-sm">Waiting for teams...</div>
          )}
        </div>

        {/* Mission Logs */}
        <div className="border border-white/10 p-6 bg-black/30">
          <h3 className="text-xs tracking-widest text-white/40 mb-3">MISSION FEED</h3>
          <div className="max-h-64 overflow-y-auto space-y-1 font-mono text-xs">
            {missionLogs.map((log, i) => (
              <div key={i} className={`${(log.log_type as string) === 'success' ? 'text-neon-green' : (log.log_type as string) === 'danger' ? 'text-danger-red' : (log.log_type as string) === 'system' ? 'text-neon-cyan' : 'text-white/40'}`}>
                <span className="text-white/20 mr-2">{new Date(log.created_at as string).toLocaleTimeString()}</span>
                &gt; {log.message as string}
              </div>
            ))}
            {missionLogs.length === 0 && <div className="text-white/20">&gt; Awaiting mission data...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
