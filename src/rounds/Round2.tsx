import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { TerminalText } from '../components/TerminalText';
import { evaluatePromptSubmission, generateDynamicThreatMessage } from '../lib/kimi';
import { calculateStepScore } from '../services/scoreService';
import { HINT_COSTS } from '../config/gameConfig';
import type { AiFeedback } from '../types';

function HintButton2({ onReveal }: { onReveal: () => void }) {
  const [showWarning, setShowWarning] = useState(false);
  const { useHint, addLog } = useGameStore();
  const cost = HINT_COSTS[2];
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

/* ─── AI IMAGE ARTIFACTS DATA ─── */
const IMAGE_CHALLENGES = [
  {
    id: 'img1',
    src: '/img_scientist.png',
    description: 'A professional portrait of a scientist in a laboratory',
    artifacts: [
      { id: 'a1', region: 'Left ear', issue: 'Asymmetrical ear structure — different shapes', found: false },
      { id: 'a2', region: 'Lab coat collar', issue: 'Impossible fold pattern — fabric defies physics', found: false },
      { id: 'a3', region: 'Background equipment', issue: 'Repeated texture pattern — cloned elements', found: false },
      { id: 'a4', region: 'Fingers on right hand', issue: 'Extra finger joint — impossible anatomy', found: false },
    ],
    isAI: true,
  },
  {
    id: 'img2',
    src: '/img_cityscape.png',
    description: 'A sunset cityscape with modern architecture',
    artifacts: [
      { id: 'b1', region: 'Window reflections', issue: 'Inconsistent reflections — sky shows different time of day', found: false },
      { id: 'b2', region: 'Shadow directions', issue: 'Impossible shadows — light source contradictions', found: false },
      { id: 'b3', region: 'Building signage', issue: 'Warped text — illegible AI-generated characters', found: false },
    ],
    isAI: true,
  },
  {
    id: 'img3',
    src: '/img_market.png',
    description: 'A photojournalistic shot of a street market',
    artifacts: [],
    isAI: false,
  },
];

export function R2Step1() {
  const { advanceStep, addRoundScore, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Record<string, 'ai' | 'real' | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [threat, setThreat] = useState('');

  useEffect(() => {
    if (currentImage === 1 && !threat) {
      generateDynamicThreatMessage().then(setThreat);
    }
  }, [currentImage, threat]);

  const img = IMAGE_CHALLENGES[currentImage];

  const toggleArtifact = (id: string) => {
    if (submitted) return;
    setSelectedArtifacts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const setImageVerdict = (v: 'ai' | 'real') => {
    if (submitted) return;
    setVerdict((prev) => ({ ...prev, [img.id]: v }));
  };

  const submit = useCallback(() => {
    // Check all images have verdicts
    const allJudged = IMAGE_CHALLENGES.every((im) => verdict[im.id]);
    if (!allJudged) { setError('CLASSIFY ALL IMAGES BEFORE SUBMITTING'); return; }

    setSubmitted(true);
    let correct = 0;
    let totalArtifacts = 0;
    let foundArtifacts = 0;

    IMAGE_CHALLENGES.forEach((im) => {
      const isCorrect = (im.isAI && verdict[im.id] === 'ai') || (!im.isAI && verdict[im.id] === 'real');
      if (isCorrect) correct++;
      totalArtifacts += im.artifacts.length;
    });

    // Count found artifacts from selected
    IMAGE_CHALLENGES.forEach((im) => {
      im.artifacts.forEach((a) => {
        if (selectedArtifacts.includes(a.id)) foundArtifacts++;
      });
    });

    const verdictQuality = correct / IMAGE_CHALLENGES.length;
    const artifactQuality = totalArtifacts > 0 ? foundArtifacts / totalArtifacts : 1;
    const quality = verdictQuality * 0.6 + artifactQuality * 0.4;

    if (correct >= 2) {
      const { score } = calculateStepScore(2, 0, quality, roundElapsed, hintsUsedPerRound[1]);
      addRoundScore(2, score);
      addLog(`Image analysis: ${correct}/${IMAGE_CHALLENGES.length} correct, ${foundArtifacts} artifacts (+${score.toFixed(1)} pts)`, 'success');
      setTimeout(() => advanceStep(), 2500);
    } else {
      setError(`FAILED — ${correct}/${IMAGE_CHALLENGES.length} correct. Need at least 2.`);
      setSubmitted(false);
    }
  }, [verdict, selectedArtifacts, addRoundScore, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 01 — AI IMAGE DETECTION</h2>
        <TerminalText text="NEXUS-9 has planted AI-generated images. Identify which are AI-generated and spot the artifacts." className="text-white/70" />
      </div>

      {threat && <div className="text-danger-red text-center animate-pulse border border-danger-red/30 p-3 bg-danger-red/5 text-sm tracking-widest">NEXUS-9: "{threat}"</div>}

      {/* Image Navigation */}
      <div className="flex gap-2 justify-center">
        {IMAGE_CHALLENGES.map((im, i) => (
          <button key={im.id} onClick={() => setCurrentImage(i)} className={`px-4 py-2 text-xs border tracking-widest transition-all ${currentImage === i ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10' : verdict[im.id] ? 'border-neon-green/30 text-neon-green/50' : 'border-white/20 text-white/40'}`}>
            IMAGE {i + 1} {verdict[im.id] && '✓'}
          </button>
        ))}
      </div>

      {/* Image Display */}
      <div className="border-2 border-white/10 bg-black/70 p-6 space-y-4">
        <div className="text-center">
          <div className="text-white/50 text-xs tracking-widest mb-2">SPECIMEN {currentImage + 1}</div>
          {/* Actual image display */}
          <div className="border border-white/10 bg-black relative overflow-hidden group">
            <img
              src={img.src}
              alt={img.description}
              className="w-full h-auto max-h-[450px] object-contain mx-auto transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="text-white/60 text-xs tracking-widest">{img.description}</div>
            </div>
            <div className="absolute top-2 right-2 text-[9px] text-white/30 bg-black/60 px-2 py-1 border border-white/10">HOVER TO ZOOM</div>
          </div>
        </div>

        {/* Artifact Regions */}
        {img.artifacts.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-white/40 tracking-widest">SUSPICIOUS REGIONS — SELECT ALL ARTIFACTS YOU IDENTIFY:</div>
            <div className="grid grid-cols-2 gap-2">
              {img.artifacts.map((a) => (
                <button key={a.id} onClick={() => toggleArtifact(a.id)} className={`p-3 text-left text-xs border transition-all ${selectedArtifacts.includes(a.id) ? 'border-danger-red bg-danger-red/10 text-danger-red' : 'border-white/10 text-white/50 hover:border-white/30'}`}>
                  <div className="font-bold">{a.region}</div>
                  <div className="text-[10px] opacity-70 mt-1">{a.issue}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verdict */}
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={() => setImageVerdict('ai')} className={`px-6 py-3 text-sm font-bold border tracking-widest transition-all ${verdict[img.id] === 'ai' ? 'border-danger-red text-danger-red bg-danger-red/10' : 'border-white/20 text-white/40'}`}>AI GENERATED</button>
          <button onClick={() => setImageVerdict('real')} className={`px-6 py-3 text-sm font-bold border tracking-widest transition-all ${verdict[img.id] === 'real' ? 'border-neon-green text-neon-green bg-neon-green/10' : 'border-white/20 text-white/40'}`}>REAL PHOTO</button>
        </div>
      </div>

      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <button onClick={submit} disabled={submitted} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest disabled:opacity-50">SUBMIT ANALYSIS</button>
      {!hintVisible && <HintButton2 onReveal={() => setHintVisible(true)} />}
      {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: Look for impossible anatomy, inconsistent reflections, and warped text. The street market is real.</div>}
    </div>
  );
}

export function R2Step2() {
  const { advanceStep, addRoundScore, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  const submit = useCallback(async () => {
    if (prompt.trim().length < 20) { setError('TOO SHORT — MIN 20 CHARS'); return; }
    setEvaluating(true); setError('');
    const result = await evaluatePromptSubmission(prompt);
    setFeedback(result);

    if (result.accepted) {
      const quality = result.score / 10;
      const { score } = calculateStepScore(2, 1, quality, roundElapsed, hintsUsedPerRound[1]);
      addRoundScore(2, score);
      addLog(`Prompt accepted (+${score.toFixed(1)} pts)`, 'success');
      setTimeout(() => advanceStep(), 3000);
    } else {
      setError('PROMPT REJECTED — IMPROVE AND RESUBMIT');
      setEvaluating(false);
    }
  }, [prompt, addRoundScore, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 02 — PROMPT ENGINEERING</h2>
        <TerminalText text='Rewrite the weak prompt into a strong, structured prompt.' className="text-white/70" />
      </div>
      <div className="text-center p-6 border-2 border-danger-red/30 bg-danger-red/5">
        <div className="text-danger-red/50 text-xs tracking-widest mb-2">WEAK PROMPT</div>
        <div className="text-xl text-white/60 italic">"Explain Artificial Intelligence."</div>
      </div>
      <div className="text-sm text-white/40 border-l-2 border-neon-cyan/30 pl-4">Rewrite with: clear audience, structure, examples, and specificity. AI will evaluate semantically.</div>

      {/* AI Feedback Display */}
      {feedback && (
        <div className={`border p-4 space-y-3 ${feedback.accepted ? 'border-neon-green/50 bg-neon-green/5' : 'border-danger-red/50 bg-danger-red/5'}`}>
          <div className="text-xs tracking-widest text-white/50">PROMPT ANALYSIS COMPLETE</div>
          <div className="text-sm font-bold">{feedback.feedback}</div>
          {feedback.strengths.length > 0 && (
            <div className="space-y-1">{feedback.strengths.map((s, i) => <div key={i} className="text-neon-green text-xs">✓ {s}</div>)}</div>
          )}
          {feedback.weaknesses.length > 0 && (
            <div className="space-y-1">{feedback.weaknesses.map((w, i) => <div key={i} className="text-danger-red text-xs">✗ {w}</div>)}</div>
          )}
          <div className={`text-sm font-bold tracking-widest ${feedback.accepted ? 'text-neon-green' : 'text-danger-red'}`}>
            RESULT: {feedback.accepted ? 'APPROVED' : 'REJECTED'} ({feedback.score}/10)
          </div>
        </div>
      )}

      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setError(''); setFeedback(null); }} rows={6} placeholder="Rewrite the prompt with clarity and structure..." className="w-full bg-black/80 border border-neon-green/40 text-neon-green p-4 font-mono text-sm focus:outline-none resize-none" />
      <button onClick={submit} disabled={evaluating} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest disabled:opacity-50">{evaluating ? 'EVALUATING VIA AI...' : 'SUBMIT'}</button>
      {!hintVisible && <HintButton2 onReveal={() => setHintVisible(true)} />}
      {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: Specify audience (beginner), ask for examples, request step-by-step structure.</div>}
    </div>
  );
}

export function R2Step3() {
  const { advanceStep, addRoundScore, acquireKey, addLog, roundElapsed, hintsUsedPerRound } = useGameStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const submit = useCallback(() => {
    const val = input.trim().toUpperCase();
    if (val === 'VX-2042') {
      const { score } = calculateStepScore(2, 2, 1.0, roundElapsed, hintsUsedPerRound[1]);
      addRoundScore(2, score);
      acquireKey();
      addLog(`Access code verified (+${score.toFixed(1)} pts)`, 'success');
      addLog('SECURITY KEY 2 RECOVERED', 'success');
      setKeyUnlocked(true);
      setTimeout(() => advanceStep(), 3000);
    } else if (['VX-2043','VX-2041','VX-2142','XV-2042','VX-2044'].includes(val)) {
      setError('TRAP CODE — NEXUS-9 IS WATCHING'); setInput('');
    } else { setError('CODE REJECTED'); setInput(''); }
  }, [input, addRoundScore, acquireKey, addLog, advanceStep, roundElapsed, hintsUsedPerRound]);

  if (keyUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-32 h-32 border-4 border-neon-cyan rotate-45 flex items-center justify-center shadow-[0_0_40px_rgba(0,210,255,0.6)] animate-pulse"><div className="-rotate-45 text-3xl text-neon-cyan font-bold">KEY 2</div></div>
        <div className="text-2xl text-neon-cyan font-bold tracking-widest animate-pulse">✓ SECURITY KEY 2 RECOVERED</div>
        <div className="text-white/50">Proceeding to Round 3...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/20 p-4 bg-black/50">
        <h2 className="text-xl text-neon-cyan mb-2 tracking-widest">&gt; STEP 03 — HIDDEN ACCESS CODE</h2>
        <TerminalText text="Find the real access code among decoys." className="text-white/70" />
      </div>
      <div className="relative p-8 border-2 border-white/10 bg-black/70 overflow-hidden">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center font-mono text-lg">
          {['VX-2043','XV-2042','VX-2042','VX-2044','VX-2142','VX-2041','VX-2042','VV-2042','VX-2024','VX-2402'].map((c, i) => (
            <div key={i} className={`p-3 border transition-all ${c === 'VX-2042' ? 'border-neon-green/20 text-white/90' : 'border-white/5 text-white/30'}`} style={{ opacity: 0.4 + Math.random() * 0.6 }}>{c}</div>
          ))}
        </div>
      </div>
      {error && <div className="text-danger-red font-bold animate-pulse text-sm">{error}</div>}
      <div className="max-w-md mx-auto space-y-4">
        <input type="text" value={input} onChange={(e) => { setInput(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="ENTER ACCESS CODE..." className="w-full bg-black border border-neon-green/60 text-neon-green text-center p-4 font-mono text-xl focus:outline-none uppercase tracking-widest" />
        <button onClick={submit} className="w-full p-4 bg-neon-green/90 hover:bg-neon-green text-black font-bold tracking-widest">SUBMIT CODE</button>
        {!hintVisible && <HintButton2 onReveal={() => setHintVisible(true)} />}
        {hintVisible && <div className="text-warning-amber/80 text-sm border border-warning-amber/20 p-3 bg-warning-amber/5">HINT: The code appears twice. Look for VX-2042.</div>}
      </div>
    </div>
  );
}
