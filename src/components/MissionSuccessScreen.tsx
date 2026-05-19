import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useAudio } from '../services/AudioManager';

interface MissionSuccessScreenProps {
  onComplete: () => void;
}

export function MissionSuccessScreen({ onComplete }: MissionSuccessScreenProps) {
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const { totalScore } = useGameStore();
  const { playSound } = useAudio();

  const advancePhase = useCallback(() => {
    setPhase((p) => p + 1);
  }, []);

  // Phase progression
  useEffect(() => {
    const timers = [
      setTimeout(() => advancePhase(), 500),    // 0→1: MISSION SUCCESSFUL
      setTimeout(() => advancePhase(), 3000),   // 1→2: NEXUS-9 NEUTRALIZED
      setTimeout(() => advancePhase(), 5500),   // 2→3: Terminal shutdown
      setTimeout(() => advancePhase(), 8000),   // 3→4: Score flash
      setTimeout(() => advancePhase(), 10000),  // 4→5: Countdown
    ];
    playSound('mission_success');
    return () => timers.forEach(clearTimeout);
  }, [advancePhase, playSound]);

  // Countdown
  useEffect(() => {
    if (phase < 5) return;
    if (countdown <= 0) {
      onComplete();
      return;
    }
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [phase, countdown, onComplete]);

  // Particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 3,
    duration: Math.random() * 4 + 3,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Scanlines */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-40" />

      {/* Green ambient glow */}
      <div className="absolute inset-0 mission-success-bg" />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle absolute rounded-full bg-neon-green/60"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center space-y-8 max-w-3xl px-8">
        <AnimatePresence>
          {/* Phase 1: MISSION SUCCESSFUL */}
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-bold text-neon-green tracking-widest glitch-effect"
              data-text="MISSION SUCCESSFUL"
            >
              MISSION SUCCESSFUL
            </motion.div>
          )}

          {/* Phase 2: NEXUS-9 NEUTRALIZED */}
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xl md:text-2xl text-neon-cyan tracking-[0.5em] animate-pulse"
            >
              NEXUS-9 NEUTRALIZED
            </motion.div>
          )}

          {/* Phase 3: Terminal shutdown */}
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-sm text-white/50 space-y-1 text-left max-w-md mx-auto"
            >
              <div>&gt; SHUTTING DOWN NEXUS-9 CORE...</div>
              <div className="text-neon-green">&gt; AI NEURAL NETWORK: TERMINATED</div>
              <div className="text-neon-green">&gt; THREAT LEVEL: NEUTRALIZED</div>
              <div className="text-neon-green">&gt; ALL SYSTEMS: SECURED</div>
              <div className="text-neon-cyan">&gt; MISSION STATUS: COMPLETE</div>
            </motion.div>
          )}

          {/* Phase 4: Score */}
          {phase >= 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="border-2 border-neon-green/50 p-6 bg-neon-green/5 inline-block"
            >
              <div className="text-sm text-white/40 tracking-widest mb-2">GAME SCORE</div>
              <div className="text-4xl font-bold text-neon-green">{totalScore.toFixed(1)}/100</div>
            </motion.div>
          )}

          {/* Phase 5: Countdown */}
          {phase >= 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/50 text-sm tracking-widest"
            >
              <div>TRANSITIONING TO RESULTS IN</div>
              <div className="text-3xl font-bold text-neon-cyan mt-2">{countdown}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
