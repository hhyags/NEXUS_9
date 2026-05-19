import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { OfflineBanner } from '../components/OfflineBanner';
import { registerConnectivityListeners } from '../services/syncService';
import { ROUND_TITLES, ROUND_THEMES } from '../config/gameConfig';

import { R1Step1, R1Step2, R1Step3 } from '../rounds/Round1';
import { R2Step1, R2Step2, R2Step3 } from '../rounds/Round2';
import { R3Step1, R3Step2, R3Step3 } from '../rounds/Round3';
import { FinalBoss } from '../rounds/FinalBoss';
import { MissionSuccessScreen } from '../components/MissionSuccessScreen';
export function GameHub() {
  const { teamId, setTimerStatus, currentRound, currentStep, gameComplete, addLog, isOffline, setOffline, startRoundTimer, showMissionSuccess, setMissionSuccess } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!teamId) { navigate('/onboarding'); return; }
    setTimerStatus(true);
    startRoundTimer();
    addLog('Mission uplink established', 'system');
  }, [teamId, navigate, setTimerStatus, addLog, startRoundTimer]);

  // Connectivity listeners
  useEffect(() => {
    const cleanup = registerConnectivityListeners(
      () => { setOffline(false); addLog('CONNECTION RESTORED', 'success'); },
      () => { setOffline(true); addLog('CONNECTION LOST — OFFLINE MODE', 'danger'); }
    );
    return cleanup;
  }, [setOffline, addLog]);

  const renderMissionStep = () => {
    if (currentRound === 1 && currentStep === 1) return <R1Step1 />;
    if (currentRound === 1 && currentStep === 2) return <R1Step2 />;
    if (currentRound === 1 && currentStep === 3) return <R1Step3 />;
    if (currentRound === 2 && currentStep === 1) return <R2Step1 />;
    if (currentRound === 2 && currentStep === 2) return <R2Step2 />;
    if (currentRound === 2 && currentStep === 3) return <R2Step3 />;
    if (currentRound === 3 && currentStep === 1) return <R3Step1 />;
    if (currentRound === 3 && currentStep === 2) return <R3Step2 />;
    if (currentRound === 3 && currentStep === 3) return <R3Step3 />;
    if (currentRound === 4) return <FinalBoss />;

    if (gameComplete) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
          <div className="text-4xl font-bold text-neon-green tracking-widest animate-pulse">MISSION COMPLETE</div>
          <div className="text-white/50">All objectives achieved. Check the leaderboard.</div>
          <button onClick={() => navigate('/leaderboard')} className="px-8 py-4 border-2 border-neon-green text-neon-green font-bold tracking-widest hover:bg-neon-green hover:text-black transition-all">
            VIEW LEADERBOARD
          </button>
        </div>
      );
    }
    return null;
  };

  if (showMissionSuccess) {
    return <MissionSuccessScreen onComplete={() => { setMissionSuccess(false); navigate('/leaderboard'); }} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {isOffline && <OfflineBanner />}
      <div className="absolute inset-0 scanline pointer-events-none opacity-20 z-[60]" />
      <Header />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className={`w-3 h-3 rounded-full animate-pulse ${currentRound === 4 ? 'bg-danger-red' : 'bg-neon-green'}`} />
              <div>
                <h1 className="text-xl md:text-2xl tracking-widest">{ROUND_TITLES[currentRound] || 'NEXUS CONSOLE'}</h1>
                <div className="text-white/30 text-xs tracking-widest">{ROUND_THEMES[currentRound]}</div>
              </div>
            </div>
            {renderMissionStep()}
          </div>
        </main>
      </div>
    </div>
  );
}
