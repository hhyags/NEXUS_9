import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventSummaryPanel } from './EventSummaryPanel';
import { fetchAllTeams } from '../services/realtimeService';
import { fetchAllJudgeScores } from '../services/judgeService';
import { sortLeaderboard, computeEventSummary } from '../services/scoreService';
import type { CeremonyTeam, DbJudgeScore } from '../types';
import { JUDGE_MAX_TOTAL } from '../config/gameConfig';

export function FinalResults() {
  const [leaderboard, setLeaderboard] = useState<CeremonyTeam[]>([]);
  const [allJudgeScores, setAllJudgeScores] = useState<DbJudgeScore[]>([]);
  const [rawTeams, setRawTeams] = useState<Record<string, unknown>[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const teams = await fetchAllTeams();
      const judges = await fetchAllJudgeScores();
      setRawTeams(teams);
      setAllJudgeScores(judges);
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
    load();
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-12 relative overflow-hidden">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h1 className="text-3xl tracking-widest text-neon-cyan">FINAL RESULTS</h1>
          <div className="flex gap-3">
            <button onClick={() => navigate('/ceremony')} className="px-4 py-2 border border-neon-green/30 text-neon-green text-sm tracking-widest hover:bg-neon-green/10 transition-all">
              CEREMONY
            </button>
            <button onClick={() => navigate('/')} className="px-4 py-2 border border-white/20 text-white/50 text-sm tracking-widest hover:text-white transition-all">
              HOME
            </button>
          </div>
        </div>

        {/* Event Summary & Winner */}
        {summary && <EventSummaryPanel summary={summary} showWinnerAnimation={false} />}

        {/* Scoring Legend */}
        <div className="flex gap-4 text-[10px] text-white/30 tracking-widest border border-white/5 p-3 bg-black/20">
          <span>FORMULA: finalScore = (gameScore × 0.7) + (normalizedJudge × 0.3)</span>
          <span>|</span>
          <span>JUDGE MAX: {JUDGE_MAX_TOTAL}</span>
        </div>

        {/* Full Leaderboard */}
        <div className="space-y-3">
          {leaderboard.map((t, i) => (
            <div key={t.id} className={`border p-5 transition-all ${i === 0 ? 'border-yellow-400/50 bg-yellow-400/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : i === 1 ? 'border-gray-300/30 bg-gray-300/5' : i === 2 ? 'border-amber-600/30 bg-amber-600/5' : 'border-white/10 bg-black/30'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/30'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div>
                    <div className="font-bold tracking-widest text-lg">{t.name}</div>
                    <div className="text-xs text-white/30">
                      R{t.roundsCleared} · {t.membersCount} members · {formatTime(t.completionTime)} · {t.hintsUsed} hints
                    </div>
                    <div className="flex gap-1 mt-1">
                      {t.roundScores.map((s, ri) => (
                        <span key={ri} className="text-[9px] text-white/20 border border-white/5 px-1">
                          R{ri + 1}: {s > 0 ? s.toFixed(1) : '—'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className={`text-3xl font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/70'}`}>
                    {t.finalScore.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-white/30 space-y-0.5">
                    <div>Game: {t.gameScore.toFixed(1)} × 0.7 = {(t.gameScore * 0.7).toFixed(1)}</div>
                    <div>Judge: {t.judgeAverage.toFixed(1)}/{JUDGE_MAX_TOTAL} → {t.normalizedJudgeScore.toFixed(1)} × 0.3 = {(t.normalizedJudgeScore * 0.3).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
