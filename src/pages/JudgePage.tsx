import { useState, useEffect, useCallback, useRef } from 'react';

import { saveJudgeScores, lockJudgeScore, fetchAllJudgeScores, getJudgeSubmissionCount } from '../services/judgeService';
import { fetchAllTeams, subscribeToTable, unsubscribeChannel } from '../services/realtimeService';
import { useGameStore } from '../store/gameStore';
import { JudgeLoginModal } from '../components/JudgeLoginModal';
import { TeamIntelPanel } from '../components/TeamIntelPanel';
import { JudgeScoreCard } from '../components/JudgeScoreCard';
import type { DbJudgeScore } from '../types';
import { Shield } from 'lucide-react';

interface TeamScores {
  logic: number;
  ethics: number;
  creativity: number;
  emotional: number;
  persuasiveness: number;
  comment: string;
}

export function JudgePage() {
  const { judgeSession, setJudgeSession, recoverState } = useGameStore();
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [scores, setScores] = useState<TeamScores>({ logic: 0, ethics: 0, creativity: 0, emotional: 0, persuasiveness: 0, comment: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [allJudgeScores, setAllJudgeScores] = useState<DbJudgeScore[]>([]);
  const channelsRef = useRef<any[]>([]);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and recover
  useEffect(() => {
    recoverState();
  }, [recoverState]);

  // Data fetching
  useEffect(() => {
    if (!judgeSession?.authenticated) return;
    
    const load = async () => {
      const t = await fetchAllTeams();
      setTeams(t);
      const js = await fetchAllJudgeScores();
      setAllJudgeScores(js);
    };
    
    load();
    
    // Faster polling to complement real-time (1 second for judge scoring)
    pollIntervalRef.current = setInterval(load, 1000);

    // Real-time subscriptions for judge_scores
    const judgeScoresChannel = subscribeToTable('judge_scores', () => {
      fetchAllJudgeScores().then(setAllJudgeScores);
    });
    if (judgeScoresChannel) channelsRef.current.push(judgeScoresChannel);

    // Real-time subscriptions for teams
    const teamsChannel = subscribeToTable('teams', () => {
      fetchAllTeams().then(setTeams);
    });
    if (teamsChannel) channelsRef.current.push(teamsChannel);

    return () => {
      // Cleanup polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      
      // Cleanup real-time subscriptions
      channelsRef.current.forEach(channel => {
        unsubscribeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [judgeSession]);

  // Load team's existing scores when selected
  useEffect(() => {
    if (!selectedTeam || !judgeSession) return;
    const myScore = allJudgeScores.find(s => s.team_id === selectedTeam && s.judge_name === judgeSession.judgeName);
    if (myScore) {
      setScores({
        logic: myScore.logic_score,
        ethics: myScore.ethics_score,
        creativity: myScore.creativity_score,
        emotional: myScore.emotional_score,
        persuasiveness: myScore.persuasiveness_score,
        comment: myScore.judge_comment,
      });
      setIsLocked(myScore.is_locked);
      setSaved(true);
    } else {
      setScores({ logic: 0, ethics: 0, creativity: 0, emotional: 0, persuasiveness: 0, comment: '' });
      setIsLocked(false);
      setSaved(false);
    }
  }, [selectedTeam, allJudgeScores, judgeSession]);

  const handleLogin = (judgeName: string) => {
    setJudgeSession({ judgeName, authenticated: true, loginTime: Date.now() });
  };

  const handleSave = useCallback(async () => {
    if (!selectedTeam || !judgeSession || isLocked) return;
    setSaving(true);
    
    const success = await saveJudgeScores({
      team_id: selectedTeam,
      judge_name: judgeSession.judgeName,
      logic_score: scores.logic,
      ethics_score: scores.ethics,
      creativity_score: scores.creativity,
      emotional_score: scores.emotional,
      persuasiveness_score: scores.persuasiveness,
      judge_comment: scores.comment,
    });

    if (success) {
      // Auto-lock after submit
      await lockJudgeScore(selectedTeam, judgeSession.judgeName);
      setSaved(true);
      setIsLocked(true);
      const js = await fetchAllJudgeScores();
      setAllJudgeScores(js);
    }
    
    setSaving(false);
  }, [selectedTeam, scores, judgeSession, isLocked]);

  const updateScore = (key: string, value: number) => {
    if (isLocked) return;
    setScores(prev => ({ ...prev, [key]: Math.max(0, Math.min(5, value)) }));
    setSaved(false);
  };

  if (!judgeSession?.authenticated) {
    return <JudgeLoginModal onLogin={handleLogin} />;
  }

  // Get selected team details for the intel panel
  const selectedTeamData = teams.find(t => t.id === selectedTeam) || null;
  // Final submissions would ideally come from the teams payload if we join it, 
  // but for now we'll pass null or fetch it separately. 
  // Assuming teams table includes final_submissions relation if requested, else null.
  const finalSub = (selectedTeamData?.final_submissions as Record<string, unknown>[])?.[0] || null;
  const missionLogs = (selectedTeamData?.mission_logs as Record<string, unknown>[]) || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 scanline pointer-events-none opacity-10" />
      
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neon-cyan/30 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-neon-cyan" />
            <h1 className="text-2xl tracking-widest text-neon-cyan">JUDGE DASHBOARD</h1>
          </div>
          <div className="text-sm tracking-widest text-white/50 bg-black/50 px-4 py-2 border border-white/10">
            LOGGED IN AS: <span className="text-neon-cyan font-bold">{judgeSession.judgeName}</span>
          </div>
        </div>

        {/* 3-Panel Tactical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          
          {/* LEFT: Teams List */}
          <div className="border border-white/10 p-4 bg-black/30 flex flex-col min-h-0">
            <h3 className="text-xs tracking-widest text-white/50 mb-4 shrink-0">ACTIVE DEPLOYMENTS</h3>
            <div className="overflow-y-auto space-y-2 pr-2 flex-1">
              {teams.length === 0 && <div className="text-white/30 text-sm">No teams found.</div>}
              {teams.map((t) => {
                // Submission tracking
                const { submitted } = getJudgeSubmissionCount(allJudgeScores, t.id as string, 3);
                const myScore = allJudgeScores.find(s => s.team_id === t.id && s.judge_name === judgeSession.judgeName);

                return (
                  <button 
                    key={t.id as string} 
                    onClick={() => setSelectedTeam(t.id as string)} 
                    className={`w-full text-left p-3 border transition-all ${selectedTeam === t.id ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm truncate">{t.team_name as string}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 border ${myScore?.is_locked ? 'border-neon-green text-neon-green' : 'border-warning-amber text-warning-amber'}`}>
                        {myScore?.is_locked ? 'LOCKED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>R{t.current_round as number} · {((t.team_members as any[]) || []).length} agents</span>
                      <span className={submitted >= 3 ? 'text-neon-green' : 'text-neon-cyan'}>
                        {submitted} Judge{submitted !== 1 ? 's' : ''} Submitted
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: Team Intel */}
          <div className="lg:col-span-2 border border-white/10 p-4 bg-black/30 flex flex-col min-h-0">
            <h3 className="text-xs tracking-widest text-white/50 mb-4 shrink-0">TACTICAL INTEL</h3>
            <div className="flex-1 overflow-hidden">
              <TeamIntelPanel team={selectedTeamData} finalSubmission={finalSub} missionLogs={missionLogs} />
            </div>
          </div>

          {/* RIGHT: Scoring Controls */}
          <div className="border border-white/10 p-4 bg-black/30 flex flex-col min-h-0">
            <h3 className="text-xs tracking-widest text-white/50 mb-4 shrink-0">EVALUATION MATRIX</h3>
            <div className="overflow-y-auto flex-1 pr-2">
              {!selectedTeam ? (
                <div className="h-full flex items-center justify-center text-white/20 text-sm text-center">
                  SELECT TEAM<br/>TO ENABLE SCORING
                </div>
              ) : (
                <JudgeScoreCard
                  judgeName={judgeSession.judgeName}
                  teamName={(selectedTeamData?.team_name as string) || '—'}
                  scores={scores}
                  isLocked={isLocked}
                  onScoreChange={updateScore}
                  onCommentChange={(comment) => { if (!isLocked) { setScores(s => ({ ...s, comment })); setSaved(false); } }}
                  onSubmit={handleSave}
                  saving={saving}
                  saved={saved}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
