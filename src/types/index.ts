// ─── Database Table Types ───

export interface DbTeam {
  id: string;
  team_name: string;
  total_score: number;
  current_round: number;
  current_step: number;
  keys_collected: number;
  hints_used: number;
  round_scores: number[];
  created_at: string;
  status: 'active' | 'completed' | 'eliminated';
}

export interface DbTeamMember {
  id: string;
  team_id: string;
  member_name: string;
  role: string;
}

export interface DbRound {
  id: string;
  team_id: string;
  round_number: number;
  started_at: string;
  completed_at: string | null;
  expected_time: number;
  time_taken: number;
  score: number;
}

export interface DbPuzzleAttempt {
  id: string;
  team_id: string;
  round_id: string;
  puzzle_id: string;
  submission: string;
  is_correct: boolean;
  points_awarded: number;
  created_at: string;
}

export interface DbHintUsed {
  id: string;
  team_id: string;
  round_id: string;
  hint_level: number;
  points_deducted: number;
  used_at: string;
}

export interface DbJudgeScore {
  id: string;
  team_id: string;
  logic_score: number;
  ethics_score: number;
  creativity_score: number;
  emotional_score: number;
  persuasiveness_score: number;
  judge_comment: string;
  total: number;
  created_at: string;
}

export interface DbFinalSubmission {
  id: string;
  team_id: string;
  submission_text: string;
  ai_feedback: AiFeedback | null;
  submitted_at: string;
}

export interface DbSessionState {
  id: number;
  global_timer: number;
  current_phase: string;
  is_paused: boolean;
  game_started: boolean;
  restart_trigger: number;
}

export interface DbMissionLog {
  id: string;
  log_type: 'info' | 'success' | 'danger' | 'system';
  message: string;
  team_id: string;
  created_at: string;
}

// ─── AI Feedback ───

export interface AiFeedback {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  accepted: boolean;
}

// ─── Game State Types ───

export interface TeamMember {
  name: string;
  role: string;
}

export interface MissionLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'danger' | 'system';
}

export type ThreatLevel = 'NORMAL' | 'ELEVATED' | 'CRITICAL';

// ─── Image Detection Types ───

export interface ImageArtifact {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  label: string;
  description: string;
}

export interface DetectionImage {
  id: string;
  src: string;
  isAI: boolean;
  artifacts: ImageArtifact[];
  difficulty: 'medium' | 'hard' | 'expert';
}

// ─── Judge Criteria ───

export interface JudgeCriterion {
  key: string;
  label: string;
  description: string;
  maxScore: number;
}
