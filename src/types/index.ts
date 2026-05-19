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
  completion_time: number;
  completed_at: string | null;
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
  judge_name: string;
  logic_score: number;
  ethics_score: number;
  creativity_score: number;
  emotional_score: number;
  persuasiveness_score: number;
  judge_comment: string;
  is_locked: boolean;
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
  current_phase: SessionPhase;
  is_paused: boolean;
  game_started: boolean;
  restart_trigger: number;
  ceremony_triggered: boolean;
  announcement: string;
  bonus_time_added: number;
  ceremony_timer: number;
  forced_ceremony: boolean;
}

export interface DbMissionLog {
  id: string;
  log_type: 'info' | 'success' | 'danger' | 'system';
  message: string;
  team_id: string;
  created_at: string;
}

export interface DbSecurityLog {
  id: string;
  team_id: string;
  event_type: 'excessive_refresh' | 'multi_tab' | 'rapid_submission' | 'abnormal_activity' | 'suspicious_scoring' | 'tab_switch';
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface DbEventReplay {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  team_id: string | null;
  created_at: string;
}

// ─── Session Phase State Machine ───

export type SessionPhase =
  | 'lobby'
  | 'onboarding'
  | 'active'
  | 'round_transition'
  | 'critical_state'
  | 'mission_success'
  | 'judging'
  | 'ceremony'
  | 'results'
  | 'archived';

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

// ─── Judge Types ───

export interface JudgeCriterion {
  key: string;
  label: string;
  description: string;
  maxScore: number;
}

export interface JudgeSession {
  judgeName: string;
  authenticated: boolean;
  loginTime: number;
}

// ─── Ceremony Types ───

export interface CeremonyTeam {
  id: string;
  name: string;
  gameScore: number;
  judgeAverage: number;
  normalizedJudgeScore: number;
  finalScore: number;
  completionTime: number;
  roundsCleared: number;
  hintsUsed: number;
  roundScores: number[];
  membersCount: number;
  status: string;
}

// ─── Event Summary / Winner Announcement ───

export interface EventSummary {
  totalTeams: number;
  avgGameScore: number;
  avgJudgeScore: number;
  avgNormalizedJudge: number;
  avgFinalScore: number;
  highestGameScore: { teamName: string; score: number };
  highestJudgeScore: { teamName: string; score: number };
  winner: { teamName: string; finalScore: number; gameScore: number; judgeAvg: number } | null;
}

// ─── Analytics Types ───

export interface AnalyticsData {
  avgCompletionTime: number;
  hardestPuzzle: string;
  mostFailedChallenge: string;
  hintUsageByRound: number[];
  fastestTeam: { name: string; time: number } | null;
  bestCreativityScore: { teamName: string; score: number } | null;
  bestEthicsScore: { teamName: string; score: number } | null;
  judgeVariance: number;
  roundCompletionRates: number[];
}

// ─── Replay Types ───

export interface ReplayEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  teamId: string | null;
  timestamp: string;
}
