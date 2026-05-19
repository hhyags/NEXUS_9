import { useState } from 'react';
import { JUDGE_PASSWORD } from '../config/gameConfig';
import { Lock, User } from 'lucide-react';

interface JudgeLoginModalProps {
  onLogin: (judgeName: string) => void;
}

export function JudgeLoginModal({ onLogin }: JudgeLoginModalProps) {
  const [password, setPassword] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [error, setError] = useState('');

  const handleAuth = () => {
    if (password !== JUDGE_PASSWORD) {
      setError('INVALID PASSWORD');
      return;
    }
    if (!judgeName.trim()) {
      setError('JUDGE NAME REQUIRED');
      return;
    }
    // Save to localStorage for session persistence
    const session = { judgeName: judgeName.trim(), authenticated: true, loginTime: Date.now() };
    localStorage.setItem('nexus9_judge_session', JSON.stringify(session));
    onLogin(judgeName.trim());
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="glass-panel p-8 max-w-md w-full space-y-6 border-t-4 border-t-neon-cyan">
        <div className="text-center space-y-2">
          <Lock className="w-10 h-10 text-neon-cyan mx-auto" />
          <h2 className="text-2xl tracking-widest text-neon-cyan">JUDGE ACCESS</h2>
          <p className="text-white/30 text-xs tracking-widest">MULTI-JUDGE SCORING SYSTEM</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-white/40 tracking-widest block mb-2">JUDGE PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              placeholder="ENTER SHARED PASSWORD"
              className="w-full bg-black border border-neon-cyan/50 text-white text-center p-4 font-mono focus:outline-none focus:border-neon-cyan"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/40 tracking-widest block mb-2">YOUR JUDGE NAME</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan/50" />
              <input
                type="text"
                value={judgeName}
                onChange={(e) => { setJudgeName(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="e.g. Judge Alpha, Dr. Chen..."
                maxLength={30}
                className="w-full bg-black border border-neon-cyan/50 text-white pl-10 pr-4 py-4 font-mono focus:outline-none focus:border-neon-cyan"
              />
            </div>
            <p className="text-[9px] text-white/20 mt-1">Each judge must use a unique name</p>
          </div>
        </div>

        {error && (
          <div className="text-danger-red text-sm text-center font-bold animate-pulse border border-danger-red/30 p-2 bg-danger-red/5">
            {error}
          </div>
        )}

        <button
          onClick={handleAuth}
          className="w-full p-4 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-bold tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
        >
          AUTHENTICATE
        </button>
      </div>
    </div>
  );
}
