import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { CeremonyTeam } from '../types';
import { Trophy } from 'lucide-react';

interface PodiumCardProps {
  team: CeremonyTeam;
  rank: number;
  delay: number;
}

const RANK_CONFIG: Record<number, { emoji: string; border: string; glow: string; bg: string }> = {
  1: { emoji: '🥇', border: 'border-yellow-400', glow: 'shadow-[0_0_40px_rgba(234,179,8,0.4)]', bg: 'bg-yellow-400/5' },
  2: { emoji: '🥈', border: 'border-gray-300', glow: 'shadow-[0_0_30px_rgba(192,192,192,0.3)]', bg: 'bg-gray-300/5' },
  3: { emoji: '🥉', border: 'border-amber-600', glow: 'shadow-[0_0_25px_rgba(217,119,6,0.3)]', bg: 'bg-amber-600/5' },
};

export const PodiumCard = React.memo(function PodiumCard({ team, rank, delay }: PodiumCardProps) {
  const config = RANK_CONFIG[rank] || RANK_CONFIG[3];
  const [displayScore, setDisplayScore] = useState(0);

  // Animated counter
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 2000;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(team.finalScore * eased * 10) / 10);
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }, delay * 1000 + 500);
    return () => clearTimeout(timer);
  }, [team.finalScore, delay]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`relative border-2 ${config.border} ${config.bg} ${config.glow} p-6 holographic-card overflow-hidden`}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 holographic-shimmer pointer-events-none opacity-20" />

      <div className="relative z-10">
        {/* Rank Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <div className="text-xs text-white/40 tracking-widest">RANK #{rank}</div>
              <div className="text-xl font-bold tracking-widest text-white">{team.name}</div>
            </div>
          </div>
          <Trophy className={`w-8 h-8 ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-amber-600'}`} />
        </div>

        {/* Score */}
        <div className="text-center py-4 border-y border-white/10">
          <div className="text-[10px] text-white/40 tracking-widest mb-1">FINAL SCORE</div>
          <div className={`text-5xl font-bold ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-amber-600'}`}>
            {displayScore.toFixed(1)}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <div className="text-[9px] text-white/30 tracking-widest">GAME SCORE</div>
            <div className="text-neon-green font-bold">{team.gameScore.toFixed(1)}/100</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 tracking-widest">JUDGE AVG</div>
            <div className="text-neon-cyan font-bold">{team.judgeAverage.toFixed(1)}/25</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 tracking-widest">TIME</div>
            <div className="text-white/70">{formatTime(team.completionTime)}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 tracking-widest">ROUNDS</div>
            <div className="text-white/70">{team.roundsCleared}/4</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 tracking-widest">HINTS USED</div>
            <div className="text-warning-amber">{team.hintsUsed}</div>
          </div>
          <div>
            <div className="text-[9px] text-white/30 tracking-widest">MEMBERS</div>
            <div className="text-white/70">{team.membersCount}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
