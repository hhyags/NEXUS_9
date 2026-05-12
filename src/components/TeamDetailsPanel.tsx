import { useGameStore } from '../store/gameStore';
import { Users, Shield } from 'lucide-react';

export function TeamDetailsPanel() {
  const { teamName, teamMembers, totalScore, currentRound, roundScores } = useGameStore();

  if (!teamName) return null;

  return (
    <div className="border border-neon-cyan/20 bg-black/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-neon-cyan">
        <Shield className="w-4 h-4" />
        <h3 className="text-[10px] tracking-[0.3em]">SQUAD DEPLOYMENT</h3>
      </div>

      {/* Team Name */}
      <div className="text-sm font-bold tracking-widest text-white truncate">
        {teamName}
      </div>

      {/* Members */}
      <div className="space-y-1">
        {teamMembers.slice(0, 4).map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <Users className="w-3 h-3 text-white/20" />
            <span className="text-white/60 truncate">{m.name}</span>
            <span className="text-neon-cyan/40 ml-auto text-[9px] shrink-0">{m.role}</span>
          </div>
        ))}
        {teamMembers.length > 4 && (
          <div className="text-[9px] text-white/30">+{teamMembers.length - 4} more</div>
        )}
      </div>

      {/* Score Summary */}
      <div className="border-t border-white/5 pt-2 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/40">TOTAL SCORE</span>
          <span className="text-neon-green font-bold">{totalScore}/100</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/40">ROUND</span>
          <span className="text-white/70">{currentRound}/4</span>
        </div>
      </div>

      {/* Round Scores Mini */}
      <div className="flex gap-1">
        {roundScores.map((s, i) => (
          <div
            key={i}
            className={`flex-1 text-center py-1 text-[9px] border ${
              i + 1 === currentRound
                ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                : i + 1 < currentRound
                ? 'border-white/10 bg-white/5 text-white/50'
                : 'border-white/5 text-white/20'
            }`}
          >
            <div className="font-bold">{s > 0 ? s.toFixed(1) : '—'}</div>
            <div className="text-[8px] opacity-60">R{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
