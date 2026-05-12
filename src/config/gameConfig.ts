import type { JudgeCriterion } from '../types';

// ─── Scoring Configuration ───
// Total game: 100 points maximum

export const ROUND_MAX_SCORES: Record<number, number> = {
  1: 20,
  2: 25,
  3: 25,
  4: 30,
};

export const TOTAL_MAX_SCORE = 100;

// ─── Timer Configuration ───

export const GLOBAL_TIMER_SECONDS = 6000; // 100 minutes

export const ROUND_EXPECTED_TIMES: Record<number, number> = {
  1: 1200, // 20 minutes
  2: 1500, // 25 minutes
  3: 1500, // 25 minutes
  4: 900,  // 15 minutes
};

// Points lost per extra minute beyond expected time
export const OVERTIME_PENALTY_PER_MINUTE = 0.5;

// ─── Hint Configuration ───

export const HINT_COSTS: Record<number, number> = {
  1: 1,  // Round 1: -1pt
  2: 2,  // Round 2: -2pts
  3: 3,  // Round 3: -3pts
  4: 0,  // Round 4: NO HINTS ALLOWED
};

export const HINTS_ALLOWED: Record<number, boolean> = {
  1: true,
  2: true,
  3: true,
  4: false,
};

// ─── Step Configuration ───
// Each round has 3 steps (except Round 4 which is 1 boss encounter)

export const STEPS_PER_ROUND: Record<number, number> = {
  1: 3,
  2: 3,
  3: 3,
  4: 1,
};

// Score weight per step within a round (should sum to 1.0)
export const STEP_WEIGHTS: Record<number, number[]> = {
  1: [0.30, 0.40, 0.30], // Binary, Matrix, Password
  2: [0.35, 0.35, 0.30], // Image Detection, Prompt Engineering, Access Code
  3: [0.30, 0.35, 0.35], // Caesar Cipher, Password Engineering, Memory Token
  4: [1.0],               // Final Boss
};

// ─── Round Titles & Themes ───

export const ROUND_TITLES: Record<number, string> = {
  1: 'ROUND 1 — ACCESS TERMINAL',
  2: 'ROUND 2 — HALLUCINATION LAB',
  3: 'ROUND 3 — CYBER VAULT',
  4: 'FINAL BOSS — STOP NEXUS-9',
};

export const ROUND_THEMES: Record<number, string> = {
  1: 'Repairing corrupted systems',
  2: 'Truth instability zone',
  3: 'AI military vault',
  4: 'Final confrontation',
};

// ─── Judge Criteria ───

export const JUDGE_CRITERIA: JudgeCriterion[] = [
  { key: 'logic', label: 'Logic', description: 'Logical reasoning and problem-solving approach', maxScore: 5 },
  { key: 'ethics', label: 'Ethics', description: 'Ethical considerations and moral reasoning', maxScore: 5 },
  { key: 'creativity', label: 'Creativity', description: 'Creative thinking and innovative solutions', maxScore: 5 },
  { key: 'emotional', label: 'Emotional Reasoning', description: 'Emotional intelligence and empathy', maxScore: 5 },
  { key: 'persuasiveness', label: 'Persuasiveness', description: 'Ability to construct compelling arguments', maxScore: 5 },
];

export const JUDGE_MAX_TOTAL = 25;

// ─── Auth Passwords ───

export const ADMIN_PASSWORD = 'NEXUS9ADMIN';
export const JUDGE_PASSWORD = 'NEXUS9JUDGE';

// ─── Roles ───

export const TEAM_ROLES = [
  { id: 'decoder', name: 'Decoder', desc: 'Decodes encrypted signals' },
  { id: 'prompt', name: 'Prompt Engineer', desc: 'Interfaces with AI entities' },
  { id: 'investigator', name: 'Investigator', desc: 'Identifies logic traps' },
  { id: 'repair', name: 'Repair Specialist', desc: 'Restores core systems' },
  { id: 'operator', name: 'Operator', desc: 'General mission support' },
];
