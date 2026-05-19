import React, { useEffect, useState, useMemo } from 'react';
import type { EventSummary } from '../types';
import { Trophy, BarChart3, Target, Award } from 'lucide-react';
import { useAudio } from '../services/AudioManager';
import { motion } from 'framer-motion';

interface EventSummaryPanelProps {
  summary: EventSummary;
  showWinnerAnimation?: boolean;
}

export const EventSummaryPanel = React.memo(function EventSummaryPanel({ summary, showWinnerAnimation = true }: EventSummaryPanelProps) {
  const [showWinner, setShowWinner] = useState(!showWinnerAnimation);
  const [displayScore, setDisplayScore] = useState(0);
  const { playSound } = useAudio();

  useEffect(() => {
    if (!showWinnerAnimation) return;
    const timer = setTimeout(() => {
      setShowWinner(true);
      playSound('podium_reveal');
    }, 2000);
    return () => clearTimeout(timer);
  }, [showWinnerAnimation, playSound]);

  // Animated counter for winner score
  useEffect(() => {
    if (!showWinner || !summary.winner) return;
    const duration = 2500;
    const startTime = Date.now();
    const target = summary.winner.finalScore;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * eased * 10) / 10);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [showWinner, summary.winner]);

  const statItems = useMemo(() => [
    { label: 'TOTAL TEAMS', value: summary.totalTeams.toString(), icon: BarChart3, color: 'text-neon-cyan' },
    { label: 'AVG GAME SCORE', value: `${summary.avgGameScore.toFixed(1)}/100`, icon: Target, color: 'text-neon-green', bar: summary.avgGameScore },
    { label: 'AVG JUDGE SCORE', value: `${summary.avgJudgeScore.toFixed(1)}/25`, icon: Award, color: 'text-neon-cyan', bar: (summary.avgJudgeScore / 25) * 100 },
    { label: 'AVG FINAL SCORE', value: summary.avgFinalScore.toFixed(1), icon: Trophy, color: 'text-yellow-400', bar: summary.avgFinalScore },
  ], [summary]);

  if (summary.totalTeams === 0) {
    return (
      <div className="border border-white/10 p-6 bg-black/30 text-center text-white/30 text-sm tracking-widest">
        NO TEAMS DATA AVAILABLE
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="border border-white/10 p-4 bg-black/30">
            <div className="flex items-center gap-2 text-white/40 text-[10px] tracking-widest mb-2">
              <item.icon className="w-3 h-3" />
              {item.label}
            </div>
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            {item.bar !== undefined && (
              <div className="h-1.5 bg-white/10 rounded mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-1000" style={{ width: `${Math.min(100, item.bar)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Best Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-neon-green/20 p-4 bg-neon-green/5">
          <div className="text-[10px] text-white/40 tracking-widest mb-1">HIGHEST GAME SCORE</div>
          <div className="text-neon-green font-bold">{summary.highestGameScore.teamName}</div>
          <div className="text-sm text-white/50">{summary.highestGameScore.score.toFixed(1)} pts</div>
        </div>
        <div className="border border-neon-cyan/20 p-4 bg-neon-cyan/5">
          <div className="text-[10px] text-white/40 tracking-widest mb-1">HIGHEST JUDGE SCORE</div>
          <div className="text-neon-cyan font-bold">{summary.highestJudgeScore.teamName}</div>
          <div className="text-sm text-white/50">{summary.highestJudgeScore.score.toFixed(1)} / 25</div>
        </div>
      </div>

      {/* Winner Announcement */}
      {summary.winner && showWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border-2 border-yellow-400/50 p-8 bg-yellow-400/5 text-center relative overflow-hidden holographic-card"
        >
          <div className="absolute inset-0 holographic-shimmer pointer-events-none opacity-10" />
          <div className="relative z-10">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <div className="text-sm text-white/40 tracking-[0.5em] mb-2">OVERALL WINNER</div>
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 tracking-widest glitch-effect mb-4" data-text={summary.winner.teamName}>
              {summary.winner.teamName}
            </div>
            <div className="text-5xl font-bold text-yellow-400 mb-4">{displayScore.toFixed(1)}</div>
            <div className="text-xs text-white/40 tracking-widest mb-4">FINAL WEIGHTED SCORE</div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <div className="text-[9px] text-white/30 tracking-widest">GAME</div>
                <div className="text-neon-green font-bold">{summary.winner.gameScore.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30 tracking-widest">JUDGE AVG</div>
                <div className="text-neon-cyan font-bold">{summary.winner.judgeAvg.toFixed(1)}/25</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30 tracking-widest">WEIGHTED</div>
                <div className="text-yellow-400 font-bold">{summary.winner.finalScore.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});
