import React from 'react';
import { Users, Target, Key, Clock, Brain, MessageSquare, Activity } from 'lucide-react';

interface TeamIntelPanelProps {
  team: Record<string, unknown> | null;
  finalSubmission: Record<string, unknown> | null;
  missionLogs: Record<string, unknown>[];
}

export const TeamIntelPanel = React.memo(function TeamIntelPanel({ team, finalSubmission, missionLogs }: TeamIntelPanelProps) {
  if (!team) {
    return (
      <div className="h-full flex items-center justify-center text-white/20 text-sm tracking-widest">
        SELECT A TEAM FOR INTEL
      </div>
    );
  }

  const totalScore = (team.total_score as number) || 0;
  const currentRound = (team.current_round as number) || 1;
  const currentStep = (team.current_step as number) || 1;
  const hintsUsed = (team.hints_used as number) || 0;
  const keysCollected = (team.keys_collected as number) || 0;
  const roundScores = (team.round_scores as number[]) || [0, 0, 0, 0];
  const members = (team.team_members as Array<{ member_name: string; role: string }>) || [];
  const completionTime = (team.completion_time as number) || 0;
  const status = (team.status as string) || 'active';

  const completionPercent = Math.min(100, Math.round(((currentRound - 1) * 3 + currentStep) / 10 * 100));
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const teamLogs = missionLogs.filter((l) => (l.team_id as string) === (team.id as string)).slice(0, 20);

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
      {/* Team Header */}
      <div className="border border-neon-cyan/30 bg-black/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-neon-cyan tracking-widest">{team.team_name as string}</h3>
          <span className={`text-xs px-2 py-1 border ${status === 'completed' ? 'border-neon-green text-neon-green' : status === 'eliminated' ? 'border-danger-red text-danger-red' : 'border-neon-cyan text-neon-cyan'}`}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-white/10 p-3 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-1">
            <Target className="w-3 h-3" /> LIVE SCORE
          </div>
          <div className="text-2xl font-bold text-neon-green">{totalScore}/100</div>
        </div>

        <div className="border border-white/10 p-3 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-1">
            <Activity className="w-3 h-3" /> ROUND
          </div>
          <div className="text-2xl font-bold text-neon-cyan">R{currentRound} / S{currentStep}</div>
        </div>

        <div className="border border-white/10 p-3 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-1">
            <Key className="w-3 h-3" /> KEYS
          </div>
          <div className="text-lg font-bold text-neon-green">{keysCollected}/3</div>
        </div>

        <div className="border border-white/10 p-3 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-1">
            <Brain className="w-3 h-3" /> HINTS
          </div>
          <div className="text-lg font-bold text-warning-amber">{hintsUsed}</div>
        </div>

        <div className="border border-white/10 p-3 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-1">
            <Clock className="w-3 h-3" /> TIME
          </div>
          <div className="text-lg font-bold text-white/70">{formatTime(completionTime)}</div>
        </div>

        <div className="border border-white/10 p-3 bg-black/30">
          <div className="text-white/40 text-[10px] tracking-widest mb-1">COMPLETION</div>
          <div className="text-lg font-bold text-neon-cyan">{completionPercent}%</div>
          <div className="h-1 bg-white/10 rounded mt-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-500" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Round Scores */}
      <div className="border border-white/10 p-3 bg-black/30">
        <div className="text-white/40 text-[10px] tracking-widest mb-2">ROUND SCORES</div>
        <div className="grid grid-cols-4 gap-2">
          {roundScores.map((s: number, i: number) => (
            <div key={i} className={`text-center p-2 border ${i + 1 <= currentRound ? 'border-neon-green/30' : 'border-white/5'}`}>
              <div className="text-xs text-white/30">R{i + 1}</div>
              <div className="text-sm font-bold text-neon-green">{s > 0 ? s.toFixed(1) : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div className="border border-white/10 p-3 bg-black/30">
        <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
          <Users className="w-3 h-3" /> SQUAD ({members.length})
        </div>
        <div className="space-y-1">
          {members.map((m, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-white/60">{m.member_name}</span>
              <span className="text-neon-cyan/40">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Final Submission */}
      {finalSubmission && (
        <div className="border border-neon-green/30 p-3 bg-neon-green/5">
          <div className="flex items-center gap-2 text-neon-green text-[10px] tracking-widest mb-2">
            <MessageSquare className="w-3 h-3" /> FINAL SUBMISSION
          </div>
          <p className="text-white/70 text-xs">{finalSubmission.submission_text as string}</p>
          {!!finalSubmission.ai_feedback && (
            <div className="mt-2 text-[10px] text-white/40 border-t border-white/10 pt-2">
              <div className="text-neon-cyan">AI Score: {((finalSubmission.ai_feedback as Record<string, unknown>).score as number)}/10</div>
              <div className="mt-1">{String((finalSubmission.ai_feedback as Record<string, unknown>).feedback || '')}</div>
            </div>
          )}
        </div>
      )}

      {/* Mission Logs */}
      <div className="border border-white/10 p-3 bg-black/30">
        <div className="text-white/40 text-[10px] tracking-widest mb-2">MISSION LOGS</div>
        <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[10px]">
          {teamLogs.length === 0 && <div className="text-white/20">No logs yet</div>}
          {teamLogs.map((log, i) => (
            <div key={i} className={`${(log.log_type as string) === 'success' ? 'text-neon-green' : (log.log_type as string) === 'danger' ? 'text-danger-red' : (log.log_type as string) === 'system' ? 'text-neon-cyan' : 'text-white/40'}`}>
              &gt; {log.message as string}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
