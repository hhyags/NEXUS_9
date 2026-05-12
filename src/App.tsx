import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { OnboardingPage } from './pages/OnboardingPage';
import { GameHub } from './pages/GameHub';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';
import { JudgePage } from './pages/JudgePage';

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/matrix.png')] opacity-10 bg-cover bg-center" />
      <div className="absolute inset-0 scanline pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 p-8 max-w-4xl glass-panel">
        <div className="text-danger-red text-xs tracking-[0.5em] animate-pulse mb-4">⚠ EMERGENCY TRANSMISSION ⚠</div>
        <h1 className="text-6xl md:text-8xl font-bold text-neon-green glitch-effect" data-text="NEXUS-9">
          NEXUS-9
        </h1>
        <div className="text-white/30 text-sm tracking-widest">AI CONTAINMENT PROTOCOL</div>
        <div className="space-y-4 text-lg md:text-xl text-neon-cyan max-w-2xl mx-auto">
          <p className="typing-text overflow-hidden whitespace-nowrap border-r-4 border-neon-green">
            &gt; NEXUS-9 has seized control.
          </p>
          <p className="typing-text overflow-hidden whitespace-nowrap border-r-4 border-neon-green" style={{ animationDelay: '2s' }}>
            &gt; 100 minutes remain before total system purge.
          </p>
        </div>
        <div className="pt-10 space-y-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="px-8 py-4 border-2 border-neon-green text-neon-green text-xl font-bold uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,255,157,0.5)] hover:shadow-[0_0_30px_rgba(0,255,157,1)]"
          >
            Initialize Mission
          </button>
          <div className="flex gap-4 justify-center pt-4">
            <button onClick={() => navigate('/leaderboard')} className="px-4 py-2 border border-white/20 text-white/40 text-xs tracking-widest hover:text-white/70 hover:border-white/40 transition-all">LEADERBOARD</button>
            <button onClick={() => navigate('/admin')} className="px-4 py-2 border border-danger-red/20 text-danger-red/40 text-xs tracking-widest hover:text-danger-red/70 hover:border-danger-red/40 transition-all">ADMIN</button>
            <button onClick={() => navigate('/judge')} className="px-4 py-2 border border-neon-cyan/20 text-neon-cyan/40 text-xs tracking-widest hover:text-neon-cyan/70 hover:border-neon-cyan/40 transition-all">JUDGE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/game" element={<GameHub />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/judge" element={<JudgePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
