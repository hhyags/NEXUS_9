import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { TerminalText } from '../components/TerminalText';
import { calculateStepScore } from '../services/scoreService';
import { HINT_COSTS } from '../config/gameConfig';

function HintButton({ round, onReveal }: { round: number; onReveal: () => void }) {
  const [showWarning, setShowWarning] = useState(false);
  const { useHint, addLog } = useGameStore();
  const cost = HINT_COSTS[round];

  const handleClick = () => {
    if (!showWarning) { setShowWarning(true); return; }
    const result = useHint();
    if (result.allowed) { onReveal(); addLog(`Hint used (-${result.cost} pt)`, 'danger'); }
  };

  return (
    <>
      {showWarning && (
        <div className="text-warning-amber text-sm border border-warning-amber/30 p-3 bg-warning-amber/5 animate-pulse text-center">
          ⚠ USING THIS HINT WILL REDUCE YOUR MISSION SCORE (-{cost} PT)
        </div>
      )}
      <button onClick={handleClick} className="w-full p-2 text-warning-amber/70 hover:text-warning-amber text-sm tracking-widest transition-colors border border-warning-amber/20 hover:border-warning-amber/50">
        {showWarning ? 'CONFIRM HINT REQUEST' : `REQUEST HINT (−${cost} PT)`}
      </button>
    </>
  );
}

export function R1Step1() {
  const { advanceStep, addRoundScore, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [hintVisible, setHintVisible] = useState(false);

  const submit = useCallback(() => {
    const val = input.trim().toUpperCase();
    if (val === 'NIAT') {
      const { score } = calculateStepScore(1, 0, 1.0, roundElapsed, hintsUsedPerRound[0]);
      addRoundScore(1, score);
      addLog(`Binary decrypted: NIAT (+${score.toFixed(1)} pts)`, 'success');
      advanceStep();
    } else if (['NLAT', 'MIAT', 'N1AT'].includes(val)) {
      setError('TRAP DETECTED — CORRUPTED PATTERN'); addLog('Trap: ' + val, 'danger'); setInput('');
    } else { setError('INVALID CHECKSUM'); setInput(''); }
  }, [input, addRoundScore, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 01 — BINARY DECRYPTION</h2>
        <TerminalText text='Decrypt the binary sequence to restore access.' className="text-white/70" />
      </div>
      <div className="text-sm text-white/40 border-l-2 border-neon-cyan/30 pl-4">INTEL: Each binary block = one ASCII character.</div>
      <div className={`p-8 border-2 text-center ${error ? 'border-danger-red bg-danger-red/5' : 'border-neon-green/30 bg-neon-green/5'}`}>
        <div className="text-2xl sm:text-3xl md:text-5xl font-mono text-white tracking-[0.15em] mb-8 break-all">01001110&nbsp; 01001001&nbsp; 01000001&nbsp; 01010100</div>
        <div className="max-w-md mx-auto space-y-4">
          {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
          <input type="text" value={input} onChange={(e) => { setInput(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ENTER DECRYPTED ASCII..." className="w-full bg-black border border-neon-green/60 text-neon-green text-center p-4 font-mono text-xl focus:outline-none uppercase tracking-widest" />
          <button onClick={submit} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest">SUBMIT DECRYPTION</button>
          {!hintVisible && <HintButton round={1} onReveal={() => setHintVisible(true)} />}
          {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: N=78, I=73, A=65, T=84.</div>}
        </div>
      </div>
    </div>
  );
}

export function R1Step2() {
  const { advanceStep, addRoundScore, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const validateCode = useCallback(() => {
    const c = code.toLowerCase();
    const checks = [
      c.includes('2') && c.includes('4') && c.includes('3') && c.includes('5') && c.includes('8'),
      c.includes('+'),
      /print|cout|printf|console/.test(c),
      /\[|\{|array|list|int/.test(c),
      /for|while|\[0\]|\[1\]/.test(c),
    ];
    const passed = checks.filter(Boolean).length;
    if (passed >= 4) {
      const { score } = calculateStepScore(1, 1, passed / 5, roundElapsed, hintsUsedPerRound[0]);
      addRoundScore(1, score);
      addLog(`Matrix validated (+${score.toFixed(1)} pts)`, 'success');
      setShowResult(true);
      setTimeout(() => advanceStep(), 3000);
    } else {
      const labels = ['matrix values', 'addition', 'output', 'structure', 'loop'];
      const missing = labels.filter((_, i) => !checks[i]);
      setError(`COMPILATION FAILED — Missing: ${missing.join(', ')}`);
    }
  }, [code, addRoundScore, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  if (showResult) {
    return (
      <div className="border-2 border-neon-green bg-black p-6 font-mono text-neon-green">
        <div className="text-white/50 mb-4">&gt; COMPILING...</div>
        <div className="text-white/50 mb-4">&gt; EXECUTION SUCCESSFUL</div>
        <div className="mt-4"><div className="text-white/70 mb-2">RESULT MATRIX:</div><div className="text-2xl tracking-widest">[ 7&nbsp; 8 ]</div><div className="text-2xl tracking-widest">[ 11 8 ]</div></div>
        <div className="mt-6 text-neon-green animate-pulse text-lg">✓ ARITHMETIC ENGINE RESTORED</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 02 — MATRIX COMPUTATION</h2>
        <TerminalText text="Write a program that performs matrix addition and prints the result." className="text-white/70" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center font-mono">
        <div className="border border-neon-cyan/30 bg-black/50 p-4"><div className="text-neon-cyan/50 text-xs mb-2">MATRIX A</div><div className="text-white text-lg">[ 2&nbsp; 4 ]</div><div className="text-white text-lg">[ 3&nbsp; 4 ]</div></div>
        <div className="flex items-center justify-center text-3xl text-white/30">+</div>
        <div className="border border-neon-cyan/30 bg-black/50 p-4"><div className="text-neon-cyan/50 text-xs mb-2">MATRIX B</div><div className="text-white text-lg">[ 5&nbsp; 4 ]</div><div className="text-white text-lg">[ 8&nbsp; 4 ]</div></div>
      </div>
      {error && <div className="text-danger-red font-bold animate-pulse text-sm border border-danger-red/30 p-3 bg-danger-red/5">{error}</div>}
      <textarea value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} rows={12} placeholder="// Write your program here..." className="w-full bg-black/80 border border-neon-green/40 text-neon-green p-4 font-mono text-sm focus:outline-none resize-none" spellCheck={false} />
      <button onClick={validateCode} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest">COMPILE &amp; EXECUTE</button>
      {!hintVisible && <HintButton round={1} onReveal={() => setHintVisible(true)} />}
      {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: result[i][j] = A[i][j] + B[i][j]. Print each row.</div>}
    </div>
  );
}

export function R1Step3() {
  const { advanceStep, addRoundScore, acquireKey, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const submit = useCallback(() => {
    if (input.trim().toUpperCase() === 'LAPTOP') {
      const { score } = calculateStepScore(1, 2, 1.0, roundElapsed, hintsUsedPerRound[0]);
      addRoundScore(1, score);
      addLog(`Password recovered (+${score.toFixed(1)} pts)`, 'success');
      addLog('SECURITY KEY 1 RECOVERED', 'success');
      setKeyUnlocked(true);
      acquireKey();
      setTimeout(() => advanceStep(), 3000);
    } else { setError('ACCESS DENIED'); setInput(''); }
  }, [input, addRoundScore, addLog, acquireKey, advanceStep, roundElapsed, hintsUsedPerRound]);

  if (keyUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-32 h-32 border-4 border-neon-green rotate-45 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,157,0.6)] animate-pulse"><div className="-rotate-45 text-3xl text-neon-green font-bold">KEY 1</div></div>
        <div className="text-2xl text-neon-green font-bold tracking-widest animate-pulse">✓ SECURITY KEY 1 RECOVERED</div>
        <div className="text-white/50">Proceeding to Round 2...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 03 — PASSWORD RECOVERY</h2>
        <TerminalText text='Recover the system password using the clue.' className="text-white/70" />
      </div>
      <div className="text-center p-8 border-2 border-warning-amber/30 bg-warning-amber/5">
        <div className="text-warning-amber/50 text-xs tracking-widest mb-2">ENCRYPTED CLUE</div>
        <div className="text-3xl text-white font-bold tracking-widest">"THE DEVICE YOU USE DAILY"</div>
      </div>
      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <div className="max-w-md mx-auto space-y-4">
        <input type="text" value={input} onChange={(e) => { setInput(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ENTER PASSWORD..." className="w-full bg-black border border-neon-green/60 text-neon-green text-center p-4 font-mono text-xl focus:outline-none uppercase tracking-widest" />
        <button onClick={submit} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest">SUBMIT PASSWORD</button>
        {!hintVisible && <HintButton round={1} onReveal={() => setHintVisible(true)} />}
        {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: It sits on your desk or lap.</div>}
      </div>
    </div>
  );
}
