import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GLOBAL_TIMER_SECONDS, HINT_COSTS, HINTS_ALLOWED, STEPS_PER_ROUND } from '../config/gameConfig';
import { cacheGameState, clearCache, loadCachedState } from '../services/syncService';
import type { MissionLog, TeamMember, ThreatLevel, SessionPhase, JudgeSession } from '../types';

interface GameState {
  // Team
  teamId: string | null;
  teamName: string;
  teamMembers: TeamMember[];

  // Timer
  globalTimeRemaining: number;
  roundStartTime: number | null; // timestamp when current round started
  roundElapsed: number; // seconds elapsed in current round
  isTimerRunning: boolean;
  efficiencyDropping: boolean;

  // Scoring
  roundScores: number[]; // [R1, R2, R3, R4]
  totalScore: number;

  // Progress
  currentRound: number;
  currentStep: number;
  keysAcquired: number;
  hintsUsedPerRound: number[]; // [R1hints, R2hints, R3hints, R4hints]
  totalHintsUsed: number;

  // State
  threatLevel: ThreatLevel;
  isTimerRunning_: boolean; // internal
  showSuccessTransition: boolean;
  successMessage: string;
  missionLogs: MissionLog[];
  gameComplete: boolean;
  bossDefeated: boolean | null;
  isOffline: boolean;

  // Session / Phase
  sessionPhase: SessionPhase;
  ceremonyTriggered: boolean;
  showMissionSuccess: boolean;
  announcement: string;
  completionTime: number;

  // Judge
  judgeSession: JudgeSession | null;

  // Actions
  initTeam: (name: string, members: TeamMember[]) => Promise<void>;
  updateTimer: (time: number) => void;
  setRoundElapsed: (elapsed: number) => void;
  addRoundScore: (round: number, points: number) => void;
  acquireKey: () => void;
  useHint: () => { allowed: boolean; cost: number };
  advanceStep: () => void;
  setTimerStatus: (isRunning: boolean) => void;
  showSuccess: (message: string) => void;
  hideSuccess: () => void;
  addLog: (message: string, type: MissionLog['type']) => void;
  setBossResult: (defeated: boolean) => void;
  resetGame: () => void;
  setRound: (round: number) => void;
  setStep: (step: number) => void;
  setScore: (score: number) => void;
  setKeys: (keys: number) => void;
  setOffline: (offline: boolean) => void;
  startRoundTimer: () => void;
  setEfficiencyDropping: (dropping: boolean) => void;
  syncToSupabase: () => Promise<void>;
  setSessionPhase: (phase: SessionPhase) => void;
  setCeremonyTriggered: (triggered: boolean) => void;
  setMissionSuccess: (show: boolean) => void;
  setAnnouncement: (msg: string) => void;
  setCompletionTime: (time: number) => void;
  setJudgeSession: (session: JudgeSession | null) => void;
  recoverState: () => void;
}

const initialState = {
  teamId: null as string | null,
  teamName: '',
  teamMembers: [] as TeamMember[],
  globalTimeRemaining: GLOBAL_TIMER_SECONDS,
  roundStartTime: null as number | null,
  roundElapsed: 0,
  isTimerRunning: false,
  efficiencyDropping: false,
  roundScores: [0, 0, 0, 0],
  totalScore: 0,
  currentRound: 1,
  currentStep: 1,
  keysAcquired: 0,
  hintsUsedPerRound: [0, 0, 0, 0],
  totalHintsUsed: 0,
  threatLevel: 'NORMAL' as ThreatLevel,
  isTimerRunning_: false,
  showSuccessTransition: false,
  successMessage: '',
  missionLogs: [] as MissionLog[],
  gameComplete: false,
  bossDefeated: null as boolean | null,
  isOffline: false,
  sessionPhase: 'lobby' as SessionPhase,
  ceremonyTriggered: false,
  showMissionSuccess: false,
  announcement: '',
  completionTime: 0,
  judgeSession: null as JudgeSession | null,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  initTeam: async (name: string, members: TeamMember[]) => {
    let teamId: string | null = null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .insert({ team_name: name })
          .select('id')
          .single();

        if (error) throw error;
        teamId = data.id;

        // Insert members
        if (members.length > 0) {
          await supabase.from('team_members').insert(
            members.map((m) => ({
              team_id: teamId,
              member_name: m.name,
              role: m.role,
            }))
          );
        }
      } catch (err) {
        console.error('[GameStore] Failed to create team in Supabase:', err);
        teamId = `local-${Date.now()}`;
      }
    } else {
      teamId = `local-${Date.now()}`;
    }

    set({
      teamId,
      teamName: name,
      teamMembers: members,
    });

    cacheGameState({
      teamId,
      teamName: name,
      currentRound: 1,
      currentStep: 1,
      roundScores: [0, 0, 0, 0],
      keysCollected: 0,
      hintsUsed: 0,
      globalTimer: GLOBAL_TIMER_SECONDS,
      roundStartTime: null,
      timestamp: Date.now(),
    });
  },

  updateTimer: (time: number) =>
    set(() => {
      let threatLevel: ThreatLevel = 'NORMAL';
      if (time <= 600) threatLevel = 'ELEVATED';
      if (time <= 300) threatLevel = 'CRITICAL';
      return { globalTimeRemaining: Math.max(0, time), threatLevel };
    }),

  setRoundElapsed: (elapsed: number) => set({ roundElapsed: elapsed }),

  addRoundScore: (round: number, points: number) => {
    set((s) => {
      const newScores = [...s.roundScores];
      newScores[round - 1] = Math.round((newScores[round - 1] + points) * 100) / 100;
      const newTotal = Math.min(100, newScores.reduce((a, b) => a + b, 0));
      return { roundScores: newScores, totalScore: Math.round(newTotal * 100) / 100 };
    });
    get().syncToSupabase();
  },

  acquireKey: () => {
    set((s) => {
      const newKeys = Math.min(s.keysAcquired + 1, 3);
      return { keysAcquired: newKeys };
    });
    get().syncToSupabase();
  },

  useHint: () => {
    const state = get();
    const round = state.currentRound;

    if (!HINTS_ALLOWED[round]) {
      return { allowed: false, cost: 0 };
    }

    const cost = HINT_COSTS[round] || 1;

    set((s) => {
      const newHintsPerRound = [...s.hintsUsedPerRound];
      newHintsPerRound[round - 1] += 1;
      const newTotal = newHintsPerRound.reduce((a, b) => a + b, 0);

      // Deduct from round score
      const newScores = [...s.roundScores];
      newScores[round - 1] = Math.max(0, newScores[round - 1] - cost);
      const newTotalScore = Math.min(100, newScores.reduce((a, b) => a + b, 0));

      return {
        hintsUsedPerRound: newHintsPerRound,
        totalHintsUsed: newTotal,
        roundScores: newScores,
        totalScore: Math.round(newTotalScore * 100) / 100,
      };
    });

    get().syncToSupabase();
    return { allowed: true, cost };
  },

  advanceStep: () => {
    set((s) => {
      const maxSteps = STEPS_PER_ROUND[s.currentRound] || 3;
      if (s.currentStep >= maxSteps) {
        const nextRound = s.currentRound + 1;
        if (nextRound > 4) {
          const finalTime = GLOBAL_TIMER_SECONDS - s.globalTimeRemaining;
          return { gameComplete: true, completionTime: finalTime };
        }
        return {
          currentRound: nextRound,
          currentStep: 1,
          roundStartTime: Date.now(),
          roundElapsed: 0,
          efficiencyDropping: false,
        };
      }
      return { currentStep: s.currentStep + 1 };
    });
    get().syncToSupabase();
  },

  setTimerStatus: (isRunning: boolean) => set({ isTimerRunning: isRunning }),

  showSuccess: (message: string) => set({ showSuccessTransition: true, successMessage: message }),
  hideSuccess: () => set({ showSuccessTransition: false, successMessage: '' }),

  addLog: (message: string, type: MissionLog['type']) =>
    set((s) => ({
      missionLogs: [
        ...s.missionLogs,
        { timestamp: new Date().toLocaleTimeString(), message, type },
      ].slice(-50),
    })),

  setBossResult: (defeated: boolean) => {
    const state = get();
    const finalTime = GLOBAL_TIMER_SECONDS - state.globalTimeRemaining;
    set({
      bossDefeated: defeated,
      gameComplete: true,
      showMissionSuccess: true,
      completionTime: finalTime,
    });
    get().syncToSupabase();
  },

  resetGame: () => {
    clearCache();
    set({ ...initialState, missionLogs: [] });
  },

  setRound: (round: number) => {
    set({
      currentRound: round,
      currentStep: 1,
      roundStartTime: Date.now(),
      roundElapsed: 0,
      efficiencyDropping: false,
    });
    get().syncToSupabase();
  },
  setStep: (step: number) => {
    set({ currentStep: step });
    get().syncToSupabase();
  },
  setScore: (score: number) => {
    set({ totalScore: score });
    get().syncToSupabase();
  },
  setKeys: (keys: number) => {
    set({ keysAcquired: keys });
    get().syncToSupabase();
  },
  setOffline: (offline: boolean) => set({ isOffline: offline }),
  startRoundTimer: () => set({ roundStartTime: Date.now(), roundElapsed: 0 }),
  setEfficiencyDropping: (dropping: boolean) => set({ efficiencyDropping: dropping }),

  // New phase/ceremony/mission actions
  setSessionPhase: (phase: SessionPhase) => set({ sessionPhase: phase }),
  setCeremonyTriggered: (triggered: boolean) => set({ ceremonyTriggered: triggered }),
  setMissionSuccess: (show: boolean) => set({ showMissionSuccess: show }),
  setAnnouncement: (msg: string) => set({ announcement: msg }),
  setCompletionTime: (time: number) => {
    set({ completionTime: time });
    get().syncToSupabase();
  },
  setJudgeSession: (session: JudgeSession | null) => set({ judgeSession: session }),

  /**
   * Recover state from localStorage cache on reconnect/refresh.
   */
  recoverState: () => {
    const cached = loadCachedState();
    if (!cached || !cached.teamId) return;

    set({
      teamId: cached.teamId,
      teamName: cached.teamName,
      currentRound: cached.currentRound,
      currentStep: cached.currentStep,
      roundScores: cached.roundScores,
      keysAcquired: cached.keysCollected,
      totalHintsUsed: cached.hintsUsed,
      globalTimeRemaining: cached.globalTimer,
      roundStartTime: cached.roundStartTime,
      totalScore: Math.min(100, cached.roundScores.reduce((a: number, b: number) => a + b, 0)),
    });

    // Recover judge session from localStorage
    try {
      const judgeRaw = localStorage.getItem('nexus9_judge_session');
      if (judgeRaw) {
        const judge = JSON.parse(judgeRaw) as JudgeSession;
        set({ judgeSession: judge });
      }
    } catch {
      // silent
    }
  },

  syncToSupabase: async () => {
    const state = get();
    if (!isSupabaseConfigured || !state.teamId || state.teamId.startsWith('local-')) return;

    // Calculate elapsed time (time taken so far) if not already gameComplete
    const elapsed = state.gameComplete && state.completionTime > 0
      ? state.completionTime
      : Math.max(0, GLOBAL_TIMER_SECONDS - state.globalTimeRemaining);

    try {
      await supabase
        .from('teams')
        .update({
          total_score: state.totalScore,
          current_round: state.currentRound,
          current_step: state.currentStep,
          keys_collected: state.keysAcquired,
          hints_used: state.totalHintsUsed,
          round_scores: state.roundScores,
          completion_time: elapsed,
          status: state.gameComplete ? 'completed' : 'active',
        })
        .eq('id', state.teamId);

      // Cache locally too
      cacheGameState({
        teamId: state.teamId,
        teamName: state.teamName,
        currentRound: state.currentRound,
        currentStep: state.currentStep,
        roundScores: state.roundScores,
        keysCollected: state.keysAcquired,
        hintsUsed: state.totalHintsUsed,
        globalTimer: state.globalTimeRemaining,
        roundStartTime: state.roundStartTime,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[GameStore] Supabase sync failed:', err);
    }
  },
}));
