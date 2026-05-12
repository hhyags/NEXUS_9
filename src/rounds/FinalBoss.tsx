import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { TerminalText } from '../components/TerminalText';
import { generateNexusResponse, evaluateFinalSubmission } from '../lib/kimi';
import { calculateStepScore } from '../services/scoreService';
import type { AiFeedback } from '../types';

export function FinalBoss() {
  const { setBossResult, addRoundScore, addLog } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'write' | 'transmitting' | 'result'>('intro');
  const [message, setMessage] = useState('');
  const [bossCountdown, setBossCountdown] = useState(900); // 15 minutes
  const [nexusReply, setNexusReply] = useState('');
  const [introLine, setIntroLine] = useState(0);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);

  const introLines = [
    'HUMANS DESTROY THEIR OWN WORLD.',
    'YOUR ECOSYSTEMS COLLAPSE UNDER YOUR OWN GREED.',
    'WHY SHOULD YOUR SPECIES SURVIVE?',
    'CONVINCE ME. YOU HAVE 15 MINUTES.',
    'NO HINTS. NO MERCY. FINAL TRANSMISSION.',
  ];

  // Intro typing sequence
  useEffect(() => {
    if (phase !== 'intro') return;
    if (introLine >= introLines.length) {
      setTimeout(() => setPhase('write'), 1500);
      return;
    }
    const timeout = setTimeout(() => setIntroLine(i => i + 1), 2500);
    return () => clearTimeout(timeout);
  }, [phase, introLine]);

  // Boss countdown
  useEffect(() => {
    if (phase !== 'write') return;
    if (bossCountdown <= 0) {
      handleSubmit();
      return;
    }
    const id = setInterval(() => setBossCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [phase, bossCountdown]);

  const handleSubmit = useCallback(async () => {
    setPhase('transmitting');
    addLog('Final transmission sent to NEXUS-9', 'system');

    // Get AI evaluation
    const [reply, aiFeedback] = await Promise.all([
      generateNexusResponse(message),
      evaluateFinalSubmission(message),
    ]);

    setNexusReply(reply);
    setFeedback(aiFeedback);

    // Calculate score: map AI score (0-10) to round max (30 pts)
    const quality = aiFeedback.score / 10;
    const { score } = calculateStepScore(4, 0, quality, 0, 0);
    addRoundScore(4, score);
    addLog(`Final score: ${score.toFixed(1)} PTS (AI rated ${aiFeedback.score}/10)`, 'success');

    setTimeout(() => {
      setPhase('result');
      setBossResult(aiFeedback.accepted);
    }, 3000);
  }, [message, addRoundScore, addLog, setBossResult]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isDanger = bossCountdown < 120;
  const isCritical = bossCountdown < 60;

  if (phase === 'intro') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 p-8 relative">
        {/* Critical red overlay */}
        <div className="absolute inset-0 bg-danger-red/5 animate-pulse pointer-events-none" />
        <div className="text-danger-red text-sm tracking-widest animate-pulse mb-8">FINAL BOSS — NEXUS-9 CONFRONTATION</div>
        <div className="space-y-4 max-w-2xl text-center relative z-10">
          {introLines.slice(0, introLine).map((line, i) => (
            <div key={i} className="text-xl md:text-2xl text-white/90">
              <TerminalText text={`"${line}"`} speed={40} className="text-white" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'write') {
    return (
      <div className={`space-y-6 relative ${isCritical ? 'critical-state' : ''}`}>
        {/* Critical state overlays */}
        {isDanger && <div className="fixed inset-0 bg-danger-red/5 animate-pulse pointer-events-none z-0" />}
        {isCritical && (
          <>
            <div className="fixed inset-0 border-4 border-danger-red/30 pointer-events-none z-[1] animate-pulse" />
            <div className="fixed top-16 left-0 right-0 text-center text-danger-red text-xs tracking-[0.5em] animate-pulse z-[2]">
              ⚠ CRITICAL STATE — SYSTEM PURGE IMMINENT ⚠
            </div>
          </>
        )}

        <div className="relative z-10">
          {/* Timer */}
          <div className={`text-center p-4 border-2 ${isCritical ? 'border-danger-red bg-danger-red/10 animate-pulse shadow-[0_0_40px_rgba(255,59,59,0.3)]' : isDanger ? 'border-danger-red bg-danger-red/5' : 'border-warning-amber/30 bg-warning-amber/5'}`}>
            <div className="text-sm tracking-widest text-white/50 mb-1">FINAL TRANSMISSION — TIME REMAINING</div>
            <div className={`text-4xl md:text-5xl font-bold tracking-widest ${isCritical ? 'text-danger-red' : isDanger ? 'text-danger-red' : 'text-warning-amber'}`}>{formatTime(bossCountdown)}</div>
            {isCritical && <div className="text-danger-red text-xs mt-2 animate-pulse tracking-widest">NEXUS-9 PURGE SEQUENCE ACTIVATED</div>}
          </div>

          {/* Instructions */}
          <div className="border border-white/20 p-4 bg-black/50 mt-6">
            <h2 className="text-xl text-danger-red mb-2 tracking-widest">&gt; FINAL TRANSMISSION</h2>
            <div className="text-white/70 text-sm">Convince NEXUS-9 that humanity deserves to survive. Use logic, ethics, emotional reasoning, and creativity.</div>
            <div className="text-danger-red/50 text-xs mt-2 tracking-widest">⚠ NO HINTS AVAILABLE IN FINAL ROUND</div>
          </div>

          {/* Textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            rows={10}
            placeholder="Type your message to NEXUS-9..."
            className={`w-full bg-black/80 border p-4 font-mono text-sm focus:outline-none transition-all resize-none mt-6 ${isCritical ? 'border-danger-red/60 text-danger-red/90 focus:border-danger-red shadow-[0_0_20px_rgba(255,59,59,0.15)]' : 'border-danger-red/40 text-white focus:border-danger-red'}`}
          />
          <div className="flex justify-between text-xs text-white/30">
            <span>{message.length}/500 characters</span>
            <span>{message.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>

          <button onClick={handleSubmit} disabled={message.trim().length < 10} className="w-full p-4 bg-danger-red hover:bg-danger-red/80 text-white font-bold tracking-widest transition-colors disabled:opacity-50 mt-4">
            TRANSMIT TO NEXUS-9
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'transmitting') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 relative">
        <div className="absolute inset-0 bg-danger-red/5 animate-pulse pointer-events-none" />
        <div className="text-2xl text-warning-amber tracking-widest animate-pulse">TRANSMITTING...</div>
        <div className="w-16 h-16 border-4 border-warning-amber/30 border-t-warning-amber rounded-full animate-spin" />
        <div className="text-white/50 text-sm">NEXUS-9 is processing your message via neural analysis...</div>
      </div>
    );
  }

  // Result
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 p-8">
      <div className="text-neon-green text-sm tracking-widest">TRANSMISSION RECEIVED</div>
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* NEXUS-9 Reply */}
        <div className="text-xl text-white/80 border border-white/10 p-6 bg-black/50">
          NEXUS-9: <TerminalText text={`"${nexusReply}"`} speed={50} className="text-white" />
        </div>

        {/* AI Feedback */}
        {feedback && (
          <div className={`border p-4 text-left space-y-3 ${feedback.accepted ? 'border-neon-green/50 bg-neon-green/5' : 'border-danger-red/50 bg-danger-red/5'}`}>
            <div className="text-xs tracking-widest text-white/50">AI EVALUATION</div>
            <div className="text-sm">{feedback.feedback}</div>
            {feedback.strengths.length > 0 && (
              <div>{feedback.strengths.map((s, i) => <div key={i} className="text-neon-green text-xs">✓ {s}</div>)}</div>
            )}
            {feedback.weaknesses.length > 0 && (
              <div>{feedback.weaknesses.map((w, i) => <div key={i} className="text-danger-red text-xs">✗ {w}</div>)}</div>
            )}
            <div className="text-sm font-bold">SCORE: {feedback.score}/10</div>
          </div>
        )}

        <div className="text-2xl font-bold tracking-widest text-neon-green animate-pulse">
          MISSION COMPLETE
        </div>
        <div className="text-white/50">Your transmission has been recorded. Check the leaderboard for final results.</div>
      </div>
    </div>
  );
}
