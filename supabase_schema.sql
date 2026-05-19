-- STOP NEXUS-9: Complete Database Schema v3.0
-- Run this in Supabase SQL Editor
-- Supports: Multi-judge, Anti-cheat, Event Replay, State Machine

-- ============================================
-- TEAMS
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  total_score NUMERIC DEFAULT 0,
  current_round INTEGER DEFAULT 1,
  current_step INTEGER DEFAULT 1,
  keys_collected INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  round_scores JSONB DEFAULT '[0,0,0,0]'::jsonb,
  completion_time INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','eliminated'))
);

-- ============================================
-- TEAM MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  role TEXT DEFAULT 'Operator'
);

-- ============================================
-- ROUNDS
-- ============================================
CREATE TABLE IF NOT EXISTS rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 4),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expected_time INTEGER NOT NULL, -- in seconds
  time_taken INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  UNIQUE(team_id, round_number)
);

-- ============================================
-- PUZZLE ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  submission TEXT,
  is_correct BOOLEAN DEFAULT false,
  points_awarded NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- HINTS USED
-- ============================================
CREATE TABLE IF NOT EXISTS hints_used (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  hint_level INTEGER NOT NULL,
  points_deducted NUMERIC NOT NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- JUDGE SCORES (v3 — Multi-Judge)
-- ============================================
CREATE TABLE IF NOT EXISTS judge_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  logic_score INTEGER DEFAULT 0 CHECK (logic_score BETWEEN 0 AND 5),
  ethics_score INTEGER DEFAULT 0 CHECK (ethics_score BETWEEN 0 AND 5),
  creativity_score INTEGER DEFAULT 0 CHECK (creativity_score BETWEEN 0 AND 5),
  emotional_score INTEGER DEFAULT 0 CHECK (emotional_score BETWEEN 0 AND 5),
  persuasiveness_score INTEGER DEFAULT 0 CHECK (persuasiveness_score BETWEEN 0 AND 5),
  judge_comment TEXT DEFAULT '',
  is_locked BOOLEAN DEFAULT false,
  total INTEGER GENERATED ALWAYS AS (
    logic_score +
    ethics_score +
    creativity_score +
    emotional_score +
    persuasiveness_score
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, judge_name)
);

-- ============================================
-- FINAL SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS final_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submission_text TEXT NOT NULL,
  ai_feedback JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SESSION STATE (singleton row)
-- Phases: lobby, onboarding, active, round_transition,
--         critical_state, mission_success, judging,
--         ceremony, results, archived
-- ============================================
CREATE TABLE IF NOT EXISTS session_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  global_timer INTEGER DEFAULT 6000, -- 100 minutes in seconds
  current_phase TEXT DEFAULT 'lobby',
  is_paused BOOLEAN DEFAULT true,
  game_started BOOLEAN DEFAULT false,
  restart_trigger INTEGER DEFAULT 0,
  ceremony_triggered BOOLEAN DEFAULT false,
  announcement TEXT DEFAULT '',
  bonus_time_added INTEGER DEFAULT 0,
  ceremony_timer INTEGER DEFAULT 300,
  forced_ceremony BOOLEAN DEFAULT false
);

-- Insert default session state
INSERT INTO session_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MISSION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS mission_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type TEXT DEFAULT 'info' CHECK (log_type IN ('info','success','danger','system')),
  message TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SECURITY LOGS (Anti-Cheat)
-- ============================================
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'excessive_refresh', 'multi_tab', 'rapid_submission',
    'abnormal_activity', 'suspicious_scoring', 'tab_switch'
  )),
  details JSONB DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EVENT REPLAY
-- ============================================
CREATE TABLE IF NOT EXISTS event_replay (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hints_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_replay ENABLE ROW LEVEL SECURITY;

-- Allow anon access for the game (public event, no auth required)
CREATE POLICY "Allow all for anon" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON puzzle_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON hints_used FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON judge_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON final_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON session_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON mission_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON security_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON event_replay FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME PUBLICATIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE judge_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE session_state;
ALTER PUBLICATION supabase_realtime ADD TABLE mission_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE final_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE security_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE event_replay;
