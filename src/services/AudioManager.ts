/**
 * AudioManager — Centralized audio system with Web Audio API placeholder sounds.
 * Uses oscillator-based tones as placeholder effects.
 */

type SoundName =
  | 'critical_alarm'
  | 'mission_success'
  | 'podium_reveal'
  | 'score_tick'
  | 'round_complete'
  | 'glitch'
  | 'notification';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const SOUND_CONFIGS: Record<SoundName, SoundConfig> = {
  critical_alarm: { frequency: 880, duration: 0.3, type: 'square', gain: 0.15 },
  mission_success: { frequency: 523, duration: 0.8, type: 'sine', gain: 0.2 },
  podium_reveal: { frequency: 659, duration: 0.6, type: 'sine', gain: 0.15 },
  score_tick: { frequency: 1200, duration: 0.05, type: 'square', gain: 0.08 },
  round_complete: { frequency: 440, duration: 0.5, type: 'triangle', gain: 0.15 },
  glitch: { frequency: 200, duration: 0.15, type: 'sawtooth', gain: 0.1 },
  notification: { frequency: 800, duration: 0.2, type: 'sine', gain: 0.12 },
};

class AudioManagerImpl {
  private context: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.context) {
        this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      return this.context;
    } catch {
      console.warn('[AudioManager] Web Audio API not available');
      this.enabled = false;
      return null;
    }
  }

  playSound(name: SoundName): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const config = SOUND_CONFIGS[name];
    if (!config) return;

    try {
      // Resume context if suspended (required by browsers after user gesture)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch {
      // Silent fail — audio is non-critical
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const audioManager = new AudioManagerImpl();

/**
 * React hook for audio playback.
 */
export function useAudio() {
  return {
    playSound: (name: SoundName) => audioManager.playSound(name),
    setEnabled: (enabled: boolean) => audioManager.setEnabled(enabled),
    isEnabled: () => audioManager.isEnabled(),
  };
}
