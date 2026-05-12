import { useGameStore } from '../store/gameStore';
import { Key, TerminalSquare } from 'lucide-react';
import { TeamDetailsPanel } from './TeamDetailsPanel';
import { ROUND_MAX_SCORES } from '../config/gameConfig';

export function Sidebar() {
  const {
    currentRound, currentStep, keysAcquired, totalScore,
    totalHintsUsed, missionLogs, threatLevel, roundScores,
  } = useGameStore();

  return (
    <aside className="w-64 border-r border-neon-green/20 bg-black/60 backdrop-blur-md p-5 hidden lg:flex flex-col h-[calc(100vh-73px)] overflow-y-auto gap-5">
      {/* Team Details */}
      <TeamDetailsPanel />

      {/* Mission Status */}
      <div>
        <h3 className="text-white/40 text-[10px] tracking-[0.3em] mb-3">MISSION STATUS</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-4 h-4 text-neon-green shrink-0" />
            <div>
              <div className="text-sm">ROUND 0{Math.min(currentRound, 4)}</div>
              <div className="text-[10px] text-white/40">
                {currentRound <= 3 ? `STEP 0${currentStep}/03` : 'FINAL BOSS'}
              </div>
            </div>
          </div>

          {/* Score Display */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/40">TOTAL SCORE</span>
              <span className="text-sm font-bold text-neon-green">{totalScore}/100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-500"
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>

          {/* Per-Round Breakdown */}
          <div className="grid grid-cols-4 gap-1 text-[9px]">
            {roundScores.map((s, i) => (
              <div
                key={i}
                className={`text-center py-1 border ${
                  i + 1 === currentRound
                    ? 'border-neon-green/40 text-neon-green'
                    : i + 1 < currentRound
                    ? 'border-white/10 text-white/40'
                    : 'border-white/5 text-white/15'
                }`}
              >
                <div className="font-bold">{s > 0 ? s.toFixed(1) : '—'}</div>
                <div className="opacity-50">/{ROUND_MAX_SCORES[i + 1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Keys */}
      <div>
        <h3 className="text-white/40 text-[10px] tracking-[0.3em] mb-3">SECURITY KEYS</h3>
        <div className="flex gap-2">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className={`w-12 h-14 flex items-center justify-center border-2 transition-all duration-700 ${
                slot <= keysAcquired
                  ? 'border-neon-green bg-neon-green/20 shadow-[0_0_15px_rgba(0,255,157,0.5)] text-neon-green'
                  : 'border-white/10 text-white/10'
              }`}
            >
              <Key className="w-4 h-4" />
            </div>
          ))}
        </div>
        <div className="text-[10px] mt-2 text-white/25">{keysAcquired}/3 ACQUIRED</div>
      </div>

      {/* Threat Level */}
      <div>
        <h3 className="text-white/40 text-[10px] tracking-[0.3em] mb-2">THREAT LEVEL</h3>
        <div className={`text-sm font-bold tracking-widest ${
          threatLevel === 'CRITICAL' ? 'text-danger-red animate-pulse' :
          threatLevel === 'ELEVATED' ? 'text-warning-amber' : 'text-neon-green'
        }`}>
          {threatLevel}
        </div>
      </div>

      {/* Mission Logs */}
      <div className="flex-1 min-h-0">
        <h3 className="text-white/40 text-[10px] tracking-[0.3em] mb-2">SYSTEM LOGS</h3>
        <div className="bg-black/60 p-3 border border-white/5 h-full max-h-48 overflow-y-auto font-mono text-[11px] space-y-1.5">
          {missionLogs.length === 0 && (
            <div className="text-white/30">&gt; Awaiting uplink...</div>
          )}
          {missionLogs.map((log, i) => (
            <div key={i} className={`${
              log.type === 'success' ? 'text-neon-green' :
              log.type === 'danger' ? 'text-danger-red' :
              log.type === 'system' ? 'text-neon-cyan' : 'text-white/40'
            }`}>
              <span className="text-white/20 mr-1">{log.timestamp}</span>
              &gt; {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Hints */}
      <div className="text-center text-[10px] text-white/20 border-t border-white/5 pt-3">
        HINTS USED: {totalHintsUsed}
      </div>
    </aside>
  );
}
