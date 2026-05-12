import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { TerminalText } from '../components/TerminalText';
import { calculateStepScore } from '../services/scoreService';
import { HINT_COSTS } from '../config/gameConfig';

function HintButton3({ onReveal }: { onReveal: () => void }) {
  const [showWarning, setShowWarning] = useState(false);
  const { useHint, addLog } = useGameStore();
  const cost = HINT_COSTS[3];
  const handleClick = () => {
    if (!showWarning) { setShowWarning(true); return; }
    const result = useHint();
    if (result.allowed) { onReveal(); addLog(`Hint used (-${result.cost} pts)`, 'danger'); }
  };
  return (
    <>
      {showWarning && <div className="text-warning-amber text-sm border border-warning-amber/30 p-3 bg-warning-amber/5 animate-pulse text-center">⚠ USING THIS HINT WILL REDUCE YOUR MISSION SCORE (-{cost} PTS)</div>}
      <button onClick={handleClick} className="w-full p-2 text-warning-amber/70 hover:text-warning-amber text-sm tracking-widest border border-warning-amber/20 hover:border-warning-amber/50">{showWarning ? 'CONFIRM HINT' : `HINT (−${cost} PTS)`}</button>
    </>
  );
}

/* ───── STEP 1: CAESAR CIPHER ───── */
export function R3Step1() {
  const { advanceStep, addRoundScore, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [hintVisible, setHintVisible] = useState(false);

  const submit = useCallback(() => {
    if (input.trim().toUpperCase() === 'CODE') {
      const { score } = calculateStepScore(3, 0, 1.0, roundElapsed, hintsUsedPerRound[2]);
      addRoundScore(3, score);
      addLog(`Caesar cipher decrypted (+${score.toFixed(1)} pts)`, 'success');
      advanceStep();
    } else { setError('DECRYPTION FAILED'); setInput(''); }
  }, [input, addRoundScore, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 01 — CAESAR CIPHER</h2>
        <TerminalText text="Decrypt the Caesar cipher (shift=3) to reveal the hidden word." className="text-white/70" />
      </div>
      <div className="text-center p-8 border-2 border-neon-green/30 bg-neon-green/5">
        <div className="text-5xl md:text-7xl font-bold text-white tracking-[0.3em]">FRGH</div>
        <div className="text-white/30 text-sm mt-4">CAESAR SHIFT: 3</div>
      </div>
      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <div className="max-w-md mx-auto space-y-4">
        <input type="text" value={input} onChange={(e) => { setInput(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ENTER DECRYPTED WORD..." className="w-full bg-black border border-neon-green/60 text-neon-green text-center p-4 font-mono text-xl focus:outline-none uppercase tracking-widest" />
        <button onClick={submit} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest">SUBMIT</button>
        {!hintVisible && <HintButton3 onReveal={() => setHintVisible(true)} />}
        {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: Shift each letter back by 3: F→C, R→O, G→D, H→E</div>}
      </div>
    </div>
  );
}

/* ───── STEP 2: PASSWORD ENGINEERING ───── */
export function R3Step2() {
  const { advanceStep, addRoundScore, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [hintVisible, setHintVisible] = useState(false);

  const ALLOWED_UPPER = 'ABCDEFGHIJ';
  const ALLOWED_LOWER = 'abcdefghij';
  const ALLOWED_NUMS = '01234';
  const ALLOWED_SYMS = '@#';

  const checks = {
    length: pw.length === 12,
    upper: [...pw].some(c => ALLOWED_UPPER.includes(c)),
    lower: [...pw].some(c => ALLOWED_LOWER.includes(c)),
    number: [...pw].some(c => ALLOWED_NUMS.includes(c)),
    symbol: [...pw].some(c => ALLOWED_SYMS.includes(c)),
    validChars: [...pw].every(c => (ALLOWED_UPPER + ALLOWED_LOWER + ALLOWED_NUMS + ALLOWED_SYMS).includes(c)),
  };
  const allValid = Object.values(checks).every(Boolean);
  const strength = Object.values(checks).filter(Boolean).length;

  const submit = useCallback(() => {
    if (allValid) {
      const quality = strength / 6;
      const { score } = calculateStepScore(3, 1, quality, roundElapsed, hintsUsedPerRound[2]);
      addRoundScore(3, score);
      addLog(`Password engineered (+${score.toFixed(1)} pts)`, 'success');
      advanceStep();
    } else { setError('PASSWORD DOES NOT MEET REQUIREMENTS'); }
  }, [allValid, strength, addRoundScore, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  const strengthColor = strength <= 2 ? 'bg-danger-red' : strength <= 4 ? 'bg-warning-amber' : 'bg-neon-green';

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 02 — PASSWORD ENGINEERING</h2>
        <TerminalText text="Engineer a password meeting strict military-grade criteria." className="text-white/70" />
      </div>
      <div className="border border-white/10 p-4 bg-black/30 space-y-2 text-sm">
        <div className="text-white/50 tracking-widest text-xs mb-3">REQUIREMENTS</div>
        {[
          ['Exactly 12 characters', checks.length],
          ['Uppercase (A-J)', checks.upper],
          ['Lowercase (a-j)', checks.lower],
          ['Numbers (0-4)', checks.number],
          ['Symbols (@ #)', checks.symbol],
          ['Only allowed characters', checks.validChars],
        ].map(([label, ok], i) => (
          <div key={i} className={`flex items-center gap-2 ${ok ? 'text-neon-green' : 'text-white/40'}`}>
            <span>{ok ? '✓' : '○'}</span><span>{label as string}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span>STRENGTH</span>
        <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden"><div className={`h-full transition-all ${strengthColor}`} style={{ width: `${(strength / 6) * 100}%` }} /></div>
        <span>{strength}/6</span>
      </div>
      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <input type="text" value={pw} onChange={(e) => { setPw(e.target.value); setError(''); }} placeholder="ENGINEER PASSWORD..." className="w-full bg-black border border-neon-green/60 text-neon-green text-center p-4 font-mono text-xl focus:outline-none tracking-widest" maxLength={20} />
      <div className="text-xs text-white/30 text-right">{pw.length}/12 chars</div>
      <button onClick={submit} className={`w-full p-4 font-bold tracking-widest transition-colors ${allValid ? 'bg-neon-green hover:bg-white text-black' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>SUBMIT PASSWORD</button>
      {!hintVisible && <HintButton3 onReveal={() => setHintVisible(true)} />}
      {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: Example: ABcd01@#EFgh</div>}
    </div>
  );
}

/* ───── STEP 3: MEMORY TOKEN (ANTI-CHEAT) ───── */
export function R3Step3() {
  const { advanceStep, addRoundScore, acquireKey, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [token, setToken] = useState('');
  const [phase, setPhase] = useState<'show' | 'input' | 'done'>('show');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(8);
  const [hintVisible, setHintVisible] = useState(false);
  const tokenRef = useRef('');

  // Generate random token
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let t = '';
    for (let i = 0; i < 8; i++) t += chars[Math.floor(Math.random() * chars.length)];
    setToken(t);
    tokenRef.current = t;
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== 'show') return;
    if (countdown <= 0) { setPhase('input'); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  // Anti-cheat: block keyboard shortcuts globally during this step
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', blockKeys, true);
    return () => document.removeEventListener('keydown', blockKeys, true);
  }, []);

  const submit = useCallback(() => {
    if (input.toUpperCase() === tokenRef.current) {
      const { score } = calculateStepScore(3, 2, 1.0, roundElapsed, hintsUsedPerRound[2]);
      addRoundScore(3, score);
      acquireKey();
      addLog(`Memory token verified (+${score.toFixed(1)} pts)`, 'success');
      addLog('SECURITY KEY 3 RECOVERED', 'success');
      setPhase('done');
      setTimeout(() => advanceStep(), 3000);
    } else { setError('TOKEN MISMATCH'); setInput(''); }
  }, [input, addRoundScore, acquireKey, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  // Anti-cheat handlers
  const preventAction = (e: React.SyntheticEvent) => { e.preventDefault(); return false; };

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-32 h-32 border-4 border-warning-amber rotate-45 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse"><div className="-rotate-45 text-3xl text-warning-amber font-bold">KEY 3</div></div>
        <div className="text-2xl text-warning-amber font-bold tracking-widest animate-pulse">✓ SECURITY KEY 3 RECOVERED</div>
        <div className="text-white/50">All keys acquired. Initiating Final Boss...</div>
      </div>
    );
  }

  if (phase === 'show') {
    return (
      <div className="space-y-6">
        <div className="border border-white/20 p-4 bg-black/50">
          <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 03 — MEMORY TOKEN</h2>
          <TerminalText text="Memorize the token. It will disappear. NO COPYING ALLOWED." className="text-white/70" />
        </div>
        <div
          className="text-center p-12 border-2 border-warning-amber/30 bg-warning-amber/5"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          onCopy={preventAction}
          onCut={preventAction}
          onContextMenu={preventAction}
        >
          <div
            className="text-5xl md:text-7xl font-bold text-white tracking-[0.3em]"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            onMouseDown={preventAction}
          >
            {token}
          </div>
          <div className="text-warning-amber mt-4 text-lg animate-pulse">MEMORIZE — {countdown}s remaining</div>
          <div className="mt-4 h-2 bg-white/10 rounded overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-warning-amber transition-all" style={{ width: `${(countdown / 8) * 100}%` }} />
          </div>
          <div className="mt-3 text-danger-red/60 text-xs tracking-widest">⚠ COPY / PASTE / SELECTION DISABLED</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 03 — MEMORY TOKEN</h2>
        <div className="text-white/70">Enter the token from memory.</div>
      </div>
      <div className="text-center p-8 border-2 border-white/10 bg-black/50">
        <div className="text-5xl md:text-7xl font-bold text-white/10 tracking-[0.3em]">????????</div>
        <div className="text-danger-red mt-4 text-sm animate-pulse">TOKEN HIDDEN — RECALL FROM MEMORY</div>
      </div>
      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <div className="max-w-md mx-auto space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          onPaste={preventAction}
          placeholder="ENTER TOKEN..."
          className="w-full bg-black border border-neon-green/60 text-neon-green text-center p-4 font-mono text-xl focus:outline-none uppercase tracking-[0.3em]"
          maxLength={8}
          autoComplete="off"
        />
        <button onClick={submit} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest">VERIFY TOKEN</button>
        {!hintVisible && <HintButton3 onReveal={() => setHintVisible(true)} />}
        {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: First 2 chars: {tokenRef.current.slice(0, 2)}...</div>}
      </div>
    </div>
  );
}
