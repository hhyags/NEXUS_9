import React, { useEffect, useState } from 'react';
import { fetchAllTeams } from '../services/realtimeService';
import { fetchAllJudgeScores } from '../services/judgeService';
import type { DbJudgeScore } from '../types';
import { BarChart3, Zap, Clock, Brain, Users, Award } from 'lucide-react';

export const AnalyticsDashboard = React.memo(function AnalyticsDashboard() {
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [judgeScores, setJudgeScores] = useState<DbJudgeScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [t, j] = await Promise.all([fetchAllTeams(), fetchAllJudgeScores()]);
      setTeams(t);
      setJudgeScores(j);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-center text-white/30 py-8 text-sm tracking-widest">LOADING ANALYTICS...</div>;
  }

  if (teams.length === 0) {
    return <div className="text-center text-white/30 py-8 text-sm">No data available</div>;
  }

  // Compute analytics
  const completionTimes = teams.filter((t) => (t.completion_time as number) > 0).map((t) => t.completion_time as number);
  const avgCompletionTime = completionTimes.length > 0 ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) : 0;
  const fastestTeam = teams.reduce((best, t) => {
    const time = (t.completion_time as number) || Infinity;
    const bestTime = (best.completion_time as number) || Infinity;
    return time < bestTime && time > 0 ? t : best;
  }, teams[0]);

  // Hint usage by round
  const hintsByRound = [0, 0, 0, 0];
  teams.forEach((t) => {
    const hints = (t.hints_used as number) || 0;
    const round = Math.min((t.current_round as number) || 1, 4);
    hintsByRound[round - 1] += hints;
  });

  // Round completion rates
  const roundRates = [1, 2, 3, 4].map((r) => {
    const completed = teams.filter((t) => (t.current_round as number) > r || ((t.status as string) === 'completed')).length;
    return teams.length > 0 ? Math.round((completed / teams.length) * 100) : 0;
  });

  // Best judge scores
  const bestCreativity = judgeScores.reduce<DbJudgeScore | null>((best, s) => (!best || s.creativity_score > best.creativity_score) ? s : best, null);
  const bestEthics = judgeScores.reduce<DbJudgeScore | null>((best, s) => (!best || s.ethics_score > best.ethics_score) ? s : best, null);

  // Judge variance
  const judgeTotals = judgeScores.map((s) => s.total);
  const judgeMean = judgeTotals.length > 0 ? judgeTotals.reduce((a, b) => a + b, 0) / judgeTotals.length : 0;
  const judgeVariance = judgeTotals.length > 0 ? Math.round(judgeTotals.reduce((sum, t) => sum + Math.pow(t - judgeMean, 2), 0) / judgeTotals.length * 100) / 100 : 0;

  const formatTime = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}`; };

  const getTeamName = (teamId: string) => {
    const t = teams.find((t) => (t.id as string) === teamId);
    return (t?.team_name as string) || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm tracking-widest text-white/50 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" /> EVENT ANALYTICS
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="border border-white/10 p-4 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
            <Clock className="w-3 h-3" /> AVG COMPLETION
          </div>
          <div className="text-xl font-bold text-neon-cyan">{formatTime(avgCompletionTime)}</div>
        </div>

        <div className="border border-white/10 p-4 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
            <Zap className="w-3 h-3" /> FASTEST TEAM
          </div>
          <div className="text-sm font-bold text-neon-green">{fastestTeam?.team_name as string || '—'}</div>
          <div className="text-xs text-white/30">{formatTime((fastestTeam?.completion_time as number) || 0)}</div>
        </div>

        <div className="border border-white/10 p-4 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
            <Users className="w-3 h-3" /> TEAMS
          </div>
          <div className="text-xl font-bold text-neon-green">{teams.length}</div>
        </div>

        <div className="border border-white/10 p-4 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
            <Award className="w-3 h-3" /> BEST CREATIVITY
          </div>
          <div className="text-sm font-bold text-neon-cyan">{bestCreativity ? getTeamName(bestCreativity.team_id) : '—'}</div>
          <div className="text-xs text-white/30">{bestCreativity?.creativity_score || 0}/5</div>
        </div>

        <div className="border border-white/10 p-4 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
            <Award className="w-3 h-3" /> BEST ETHICS
          </div>
          <div className="text-sm font-bold text-neon-cyan">{bestEthics ? getTeamName(bestEthics.team_id) : '—'}</div>
          <div className="text-xs text-white/30">{bestEthics?.ethics_score || 0}/5</div>
        </div>

        <div className="border border-white/10 p-4 bg-black/30">
          <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
            <Brain className="w-3 h-3" /> JUDGE VARIANCE
          </div>
          <div className="text-xl font-bold text-warning-amber">{judgeVariance.toFixed(1)}</div>
        </div>
      </div>

      {/* Hint Usage Heatmap */}
      <div className="border border-white/10 p-4 bg-black/30">
        <div className="text-[10px] text-white/40 tracking-widest mb-3">HINT USAGE BY ROUND</div>
        <div className="grid grid-cols-4 gap-2">
          {hintsByRound.map((count, i) => {
            const max = Math.max(...hintsByRound, 1);
            return (
              <div key={i} className="text-center">
                <div className="h-16 bg-white/5 rounded relative overflow-hidden mb-1">
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-warning-amber to-warning-amber/50 transition-all" style={{ height: `${(count / max) * 100}%` }} />
                </div>
                <div className="text-xs text-white/30">R{i + 1}</div>
                <div className="text-sm font-bold text-warning-amber">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round Completion Rates */}
      <div className="border border-white/10 p-4 bg-black/30">
        <div className="text-[10px] text-white/40 tracking-widest mb-3">ROUND COMPLETION RATES</div>
        <div className="space-y-2">
          {roundRates.map((rate, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-white/40 w-8">R{i + 1}</span>
              <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-500" style={{ width: `${rate}%` }} />
              </div>
              <span className="text-xs text-neon-green font-bold w-10 text-right">{rate}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
