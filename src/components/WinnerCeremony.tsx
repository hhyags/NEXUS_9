import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PodiumCard } from './PodiumCard';
import { EventSummaryPanel } from './EventSummaryPanel';
import { fetchAllTeams } from '../services/realtimeService';
import { fetchAllJudgeScores } from '../services/judgeService';
import { sortLeaderboard, computeEventSummary } from '../services/scoreService';
import { useAudio } from '../services/AudioManager';
import type { CeremonyTeam, DbJudgeScore } from '../types';
import { useNavigate } from 'react-router-dom';

export function WinnerCeremony() {
  const [leaderboard, setLeaderboard] = useState<CeremonyTeam[]>([]);
  const [revealPhase, setRevealPhase] = useState(0);
  const [allJudgeScores, setAllJudgeScores] = useState<DbJudgeScore[]>([]);
  const [rawTeams, setRawTeams] = useState<Record<string, unknown>[]>([]);
  const { playSound } = useAudio();
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
      const sorted = sortLeaderboard(mapped, judges);
      setLeaderboard(sorted);
    };
    load();
  }, []);

  // Staggered reveal: 3rd → 2nd → 1st
  useEffect(() => {
    if (leaderboard.length === 0) return;
    const timers = [
      setTimeout(() => { setRevealPhase(1); playSound('podium_reveal'); }, 1000),   // 3rd
      setTimeout(() => { setRevealPhase(2); playSound('podium_reveal'); }, 3500),   // 2nd
      setTimeout(() => { setRevealPhase(3); playSound('podium_reveal'); }, 6000),   // 1st
      setTimeout(() => { setRevealPhase(4); playSound('mission_success'); }, 9000), // Summary
    ];
    return () => timers.forEach(clearTimeout);
  }, [leaderboard, playSound]);

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

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-12 relative overflow-hidden">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
      <div className="absolute inset-0 mission-success-bg opacity-30" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="text-xs text-neon-cyan tracking-[0.5em] animate-pulse">NEXUS-9 CONTAINMENT COMPLETE</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-neon-green glitch-effect" data-text="CEREMONY">
            CEREMONY
          </h1>
        </motion.div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3rd Place */}
          {top3[2] && revealPhase >= 1 && (
            <div className="md:order-1">
              <PodiumCard team={top3[2]} rank={3} delay={0} />
            </div>
          )}
          {/* 1st Place */}
          {top3[0] && revealPhase >= 3 && (
            <div className="md:order-2">
              <PodiumCard team={top3[0]} rank={1} delay={0} />
            </div>
          )}
          {/* 2nd Place */}
          {top3[1] && revealPhase >= 2 && (
            <div className="md:order-3">
              <PodiumCard team={top3[1]} rank={2} delay={0} />
            </div>
          )}
        </div>

        {/* Event Summary & Winner Announcement */}
        {revealPhase >= 4 && summary && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-6">
              <div className="text-xs text-white/40 tracking-[0.3em]">EVENT OVERVIEW</div>
            </div>
            <EventSummaryPanel summary={summary} showWinnerAnimation={true} />
          </motion.div>
        )}

        {/* Rest of Leaderboard */}
        {revealPhase >= 4 && rest.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border border-white/10 p-6 bg-black/30 space-y-3"
          >
            <h3 className="text-xs tracking-widest text-white/40">FULL RANKINGS</h3>
            {rest.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between border border-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-white/30 font-bold">#{i + 4}</span>
                  <span className="text-sm font-bold">{t.name}</span>
                </div>
                <span className="text-neon-green font-bold text-sm">{t.finalScore.toFixed(1)}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Navigation */}
        {revealPhase >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center gap-4"
          >
            <button onClick={() => navigate('/results')} className="px-6 py-3 border border-neon-cyan text-neon-cyan tracking-widest text-sm hover:bg-neon-cyan hover:text-black transition-all">
              VIEW FULL RESULTS
            </button>
            <button onClick={() => navigate('/leaderboard')} className="px-6 py-3 border border-white/20 text-white/50 tracking-widest text-sm hover:text-white hover:border-white/50 transition-all">
              LEADERBOARD
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
