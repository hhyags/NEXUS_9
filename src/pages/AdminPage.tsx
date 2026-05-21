import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ADMIN_PASSWORD, ROUND_MAX_SCORES } from '../config/gameConfig';
import { formatTimer } from '../services/timerService';
import { triggerRestart, fetchAllTeams, updateSessionPhase, broadcastAnnouncement, triggerCeremony, deleteTeam } from '../services/realtimeService';
import { clearCache } from '../services/syncService';
import { RestartModal } from '../components/RestartModal';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [teamToDelete, setTeamToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const store = useGameStore();

  useEffect(() => {
    if (authed) {
      localStorage.setItem('nexus9_admin', 'true');
      fetchAllTeams().then(setTeams);
      const interval = setInterval(() => fetchAllTeams().then(setTeams), 5000);
      return () => clearInterval(interval);
    }
  }, [authed]);

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) setAuthed(true);
  };

  const handleRestart = async () => {
    clearCache();
    store.resetGame();
    await triggerRestart();
    setShowRestart(false);
    window.location.href = '/';
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    setDeleting(true);
    const success = await deleteTeam(teamToDelete.id);
    if (success) {
      setTeams(teams.filter(t => t.id !== teamToDelete.id));
    }
    setDeleting(false);
    setTeamToDelete(null);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-md w-full space-y-6 border-t-4 border-t-danger-red">
          <h2 className="text-2xl tracking-widest text-danger-red text-center">ADMIN ACCESS</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} placeholder="ENTER ADMIN PASSWORD" className="w-full bg-black border border-danger-red/50 text-white text-center p-4 font-mono focus:outline-none" />
          <button onClick={handleAuth} className="w-full p-4 bg-danger-red/20 border border-danger-red text-danger-red font-bold tracking-widest hover:bg-danger-red hover:text-black transition-all">AUTHENTICATE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-danger-red/30 pb-4">
          <h1 className="text-3xl tracking-widest text-danger-red">ADMIN DASHBOARD</h1>
          <button onClick={() => setShowRestart(true)} className="px-4 py-2 bg-danger-red/20 border border-danger-red text-danger-red text-sm font-bold tracking-widest hover:bg-danger-red hover:text-black transition-all">RESTART GAME</button>
        </div>

        {/* Timer & State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-white/10 p-6 bg-black/30 space-y-4">
            <h3 className="text-sm tracking-widest text-white/50">TIMER CONTROL</h3>
            <div className="text-3xl font-bold text-neon-cyan">{formatTimer(store.globalTimeRemaining)}</div>
            <div className="text-xs text-white/30">100 MINUTES TOTAL</div>
            <button onClick={() => store.setTimerStatus(!store.isTimerRunning)} className={`w-full p-3 border font-bold tracking-widest text-sm ${store.isTimerRunning ? 'border-warning-amber text-warning-amber hover:bg-warning-amber hover:text-black' : 'border-neon-green text-neon-green hover:bg-neon-green hover:text-black'} transition-all`}>
              {store.isTimerRunning ? 'PAUSE' : 'RESUME'}
            </button>
          </div>

          <div className="border border-white/10 p-6 bg-black/30 space-y-4">
            <h3 className="text-sm tracking-widest text-white/50">CURRENT GAME STATE</h3>
            <div className="space-y-2 text-sm">
              <div>Round: {store.currentRound} · Step: {store.currentStep}</div>
              <div>Score: {store.totalScore}/100 · Keys: {store.keysAcquired}/3</div>
              <div>Hints Used: {store.totalHintsUsed}</div>
              <div className="flex gap-2 mt-2">
                {store.roundScores.map((s, i) => (
                  <div key={i} className="flex-1 text-center border border-white/10 py-1 text-xs">
                    <div className="text-neon-green font-bold">{s.toFixed(1)}</div>
                    <div className="text-white/30">R{i + 1}/{ROUND_MAX_SCORES[i + 1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => store.acquireKey()} className="p-4 border border-neon-green/50 text-neon-green text-sm tracking-widest hover:bg-neon-green/10 transition-all">AWARD KEY</button>
          <button onClick={() => store.addRoundScore(store.currentRound, 5)} className="p-4 border border-neon-cyan/50 text-neon-cyan text-sm tracking-widest hover:bg-neon-cyan/10 transition-all">+5 PTS</button>
          <button onClick={() => store.advanceStep()} className="p-4 border border-warning-amber/50 text-warning-amber text-sm tracking-widest hover:bg-warning-amber/10 transition-all">SKIP STEP</button>
          <button onClick={() => store.resetGame()} className="p-4 border border-danger-red/50 text-danger-red text-sm tracking-widest hover:bg-danger-red/10 transition-all">LOCAL RESET</button>
        </div>

        {/* Round Jump */}
        <div className="border border-white/10 p-6 bg-black/30 space-y-4">
          <h3 className="text-sm tracking-widest text-white/50">JUMP TO ROUND</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(r => (
              <button key={r} onClick={() => store.setRound(r)} className={`flex-1 p-3 border text-sm tracking-widest transition-all ${store.currentRound === r ? 'border-neon-green text-neon-green bg-neon-green/10' : 'border-white/10 text-white/30 hover:border-white/30'}`}>
                {r === 4 ? 'BOSS' : `R${r}`}
              </button>
            ))}
          </div>
        </div>

        {/* Global Event Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phase Control */}
          <div className="border border-white/10 p-6 bg-black/30 space-y-4">
            <h3 className="text-sm tracking-widest text-white/50">EVENT PHASE CONTROL</h3>
            <div className="flex gap-2 text-xs">
              <button onClick={() => updateSessionPhase('lobby')} className="px-3 py-2 border border-white/20 hover:border-neon-cyan">LOBBY</button>
              <button onClick={() => updateSessionPhase('active')} className="px-3 py-2 border border-white/20 hover:border-neon-green">ACTIVE</button>
              <button onClick={() => updateSessionPhase('judging')} className="px-3 py-2 border border-white/20 hover:border-warning-amber">JUDGING</button>
              <button onClick={() => triggerCeremony()} className="px-3 py-2 border border-yellow-400 text-yellow-400 hover:bg-yellow-400/20 font-bold">TRIGGER CEREMONY</button>
            </div>
            <div className="pt-2">
              <label className="text-[10px] text-white/30 block mb-1">BROADCAST ANNOUNCEMENT</label>
              <div className="flex gap-2">
                <input type="text" value={announcementMsg} onChange={e => setAnnouncementMsg(e.target.value)} placeholder="Enter global message..." className="flex-1 bg-black/50 border border-white/20 p-2 text-sm focus:border-neon-cyan outline-none" />
                <button onClick={() => { broadcastAnnouncement(announcementMsg); setAnnouncementMsg(''); }} className="px-4 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black">SEND</button>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="pt-4">
          <AnalyticsDashboard />
        </div>

        {/* All Teams */}
        {teams.length > 0 && (
          <div className="border border-white/10 p-6 bg-black/30 space-y-4">
            <h3 className="text-sm tracking-widest text-white/50">ALL TEAMS ({teams.length})</h3>
            <div className="space-y-2">
              {teams.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between border border-white/5 p-3 text-sm">
                  <div>
                    <span className="text-neon-cyan font-bold">{t.team_name}</span>
                    <span className="text-white/30 ml-2">R{t.current_round} · {t.team_members?.length || 0} members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-neon-green font-bold">{t.total_score}/100</div>
                    <button
                      onClick={() => setTeamToDelete({id: t.id, name: t.team_name})}
                      className="px-3 py-1 border border-danger-red text-danger-red text-xs tracking-widest hover:bg-danger-red hover:text-black transition-all"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showRestart && <RestartModal onConfirm={handleRestart} onCancel={() => setShowRestart(false)} />}

      {/* Delete Team Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-2 border-danger-red p-8 max-w-md w-full space-y-6">
            <h2 className="text-2xl tracking-widest text-danger-red text-center">CONFIRM DELETE</h2>
            <div className="text-center text-white/70">
              <p>Are you sure you want to delete team:</p>
              <p className="text-neon-cyan font-bold mt-2 text-lg">{teamToDelete.name}</p>
              <p className="text-danger-red text-sm mt-4">This action CANNOT be undone.</p>
              <p className="text-danger-red text-sm">All team data will be permanently deleted.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTeamToDelete(null)}
                className="flex-1 p-3 border border-white/20 text-white tracking-widest hover:border-white transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={deleting}
                className="flex-1 p-3 border border-danger-red text-danger-red bg-danger-red/20 font-bold tracking-widest hover:bg-danger-red hover:text-black transition-all disabled:opacity-50"
              >
                {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
