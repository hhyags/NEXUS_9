import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RestartModal } from './RestartModal';
import { ROUND_EXPECTED_TIMES, ADMIN_PASSWORD } from '../config/gameConfig';
import { formatTimer, syncGlobalTimer } from '../services/timerService';
import { triggerRestart } from '../services/realtimeService';
import { clearCache } from '../services/syncService';
import { Clock, AlertTriangle, Wifi, RotateCcw, TrendingDown } from 'lucide-react';

export function Header() {
  const {
    teamName, globalTimeRemaining, threatLevel, isTimerRunning,
    updateTimer, currentRound, roundElapsed, setRoundElapsed,
    efficiencyDropping, setEfficiencyDropping, resetGame,
  } = useGameStore();

  const [showRestart, setShowRestart] = useState(false);
  const [, setIsAdmin] = useState(false);

  // Global timer countdown
  useEffect(() => {
    if (!isTimerRunning) return;

    // Periodically sync back to Supabase every 5 seconds
    if (globalTimeRemaining > 0 && globalTimeRemaining % 5 === 0) {
      useGameStore.getState().syncToSupabase();
      syncGlobalTimer(globalTimeRemaining);
    }

    const interval = setInterval(() => {
      updateTimer(globalTimeRemaining - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, globalTimeRemaining, updateTimer]);

  // Round elapsed timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setRoundElapsed(roundElapsed + 1);

      // Check efficiency
      const expected = ROUND_EXPECTED_TIMES[currentRound] || 1200;
      if (roundElapsed + 1 > expected && !efficiencyDropping) {
        setEfficiencyDropping(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, roundElapsed, currentRound, efficiencyDropping, setRoundElapsed, setEfficiencyDropping]);

  // Admin check (check if admin was authenticated via localStorage)
  useEffect(() => {
    setIsAdmin(localStorage.getItem('nexus9_admin') === 'true');
  }, []);

  const handleRestart = async () => {
    clearCache();
    resetGame();
    await triggerRestart();
    setShowRestart(false);
    window.location.href = '/';
  };

  const isDanger = globalTimeRemaining < 300;
  const roundExpected = ROUND_EXPECTED_TIMES[currentRound] || 1200;
  const roundTimeDisplay = formatTimer(Math.max(0, roundExpected - roundElapsed));

  return (
    <>
      <header className={`border-b-2 p-3 md:p-4 flex justify-between items-center bg-black/80 backdrop-blur-md sticky top-0 z-50 ${isDanger ? 'border-danger-red shadow-[0_0_20px_rgba(255,59,59,0.3)] animate-pulse-fast' : 'border-neon-green/30'}`}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-neon-green" />
            <span className="font-bold tracking-widest text-xs hidden md:inline">UPLINK</span>
          </div>
          <div className="border-l border-white/20 pl-3">
            <span className="text-white/70 text-xs">TEAM:</span>
            <span className="ml-2 font-bold text-neon-cyan text-sm">{teamName || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {/* Efficiency Warning */}
          {efficiencyDropping && (
            <div className="hidden md:flex items-center gap-1 text-warning-amber animate-pulse text-xs font-bold tracking-widest">
              <TrendingDown className="w-4 h-4" />
              <span>EFFICIENCY DROPPING</span>
            </div>
          )}

          {/* Round Timer */}
          <div className={`hidden md:flex items-center gap-1 px-3 py-1 border rounded text-xs ${
            efficiencyDropping ? 'border-warning-amber/50 text-warning-amber' : 'border-white/20 text-white/50'
          }`}>
            <span className="tracking-widest">R{currentRound}: {roundTimeDisplay}</span>
          </div>

          {/* Global Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded ${isDanger ? 'border-danger-red text-danger-red bg-danger-red/10' : 'border-neon-green text-neon-green'}`}>
            <Clock className={`w-4 h-4 ${isDanger ? 'animate-pulse' : ''}`} />
            <span className="text-lg font-bold tracking-widest">{formatTimer(globalTimeRemaining)}</span>
          </div>

          {/* Threat Level */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${threatLevel !== 'NORMAL' ? 'text-danger-red animate-pulse' : 'text-warning-amber'}`} />
            <span className="text-xs font-bold tracking-widest hidden md:inline">{threatLevel}</span>
          </div>

          {/* Restart Button (admin only) */}
          <button
            onClick={() => {
              const pw = localStorage.getItem('nexus9_admin');
              if (pw === 'true') {
                setShowRestart(true);
              } else {
                const input = prompt('ADMIN PASSWORD:');
                if (input === ADMIN_PASSWORD) {
                  localStorage.setItem('nexus9_admin', 'true');
                  setIsAdmin(true);
                  setShowRestart(true);
                }
              }
            }}
            className="p-1.5 border border-danger-red/30 text-danger-red/50 hover:text-danger-red hover:border-danger-red hover:bg-danger-red/10 transition-all rounded"
            title="RESTART MISSION (ADMIN)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Efficiency Warning Mobile */}
      {efficiencyDropping && (
        <div className="md:hidden bg-warning-amber/10 border-b border-warning-amber/30 text-warning-amber text-center py-1.5 text-xs font-bold tracking-widest animate-pulse flex items-center justify-center gap-2 z-40">
          <TrendingDown className="w-3 h-3" />
          EFFICIENCY DROPPING
        </div>
      )}

      {showRestart && (
        <RestartModal
          onConfirm={handleRestart}
          onCancel={() => setShowRestart(false)}
        />
      )}
    </>
  );
}
