import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { fetchAllTeams, subscribeToTable } from '../services/realtimeService';
import { fetchAllJudgeScores } from '../services/judgeService';
import { ROUND_MAX_SCORES, JUDGE_MAX_TOTAL } from '../config/gameConfig';

export function LeaderboardPage() {
  const localState = useGameStore();
  const navigate = useNavigate();
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [judgeScores, setJudgeScores] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const t = await fetchAllTeams();
      const j = await fetchAllJudgeScores();
      setDbTeams(t);
      setJudgeScores(j);
    };
    load();

    // Realtime subscription
    subscribeToTable('teams', () => fetchAllTeams().then(setDbTeams));
    subscribeToTable('judge_scores', () => fetchAllJudgeScores().then(setJudgeScores));

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Build leaderboard: merge DB teams with local state
  const buildTeams = () => {
    const teamsMap: Record<string, any> = {};

    // Add DB teams
    dbTeams.forEach((t: any) => {
      const js = judgeScores.find((j: any) => j.team_id === t.id);
      teamsMap[t.id] = {
        id: t.id,
        name: t.team_name,
        score: t.total_score || 0,
        keys: t.keys_collected || 0,
        hints: t.hints_used || 0,
        round: t.current_round || 1,
        roundScores: t.round_scores || [0, 0, 0, 0],
        judgeScore: js?.total || 0,
        members: t.team_members?.length || 0,
        status: t.status || 'active',
      };
    });

    // Add/update local team
    if (localState.teamId) {
      const js = judgeScores.find((j: any) => j.team_id === localState.teamId);
      teamsMap[localState.teamId] = {
        id: localState.teamId,
        name: localState.teamName || 'Agent',
        score: localState.totalScore,
        keys: localState.keysAcquired,
        hints: localState.totalHintsUsed,
        round: localState.currentRound,
        roundScores: localState.roundScores,
        judgeScore: js?.total || 0,
        members: localState.teamMembers.length,
        status: 'active',
      };
    }

    return Object.values(teamsMap).sort((a, b) => (b.score + b.judgeScore) - (a.score + a.judgeScore));
  };

  const teams = buildTeams();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-12 relative overflow-hidden">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h1 className="text-3xl tracking-widest text-neon-cyan">LEADERBOARD</h1>
          <button onClick={() => navigate('/game')} className="px-4 py-2 border border-white/20 text-white/50 hover:text-white hover:border-white/50 text-sm tracking-widest transition-all">
            RETURN TO MISSION
          </button>
        </div>

        {/* Score Legend */}
        <div className="flex gap-4 text-[10px] text-white/30 tracking-widest">
          <span>GAME: /100</span>
          <span>JUDGE: /{JUDGE_MAX_TOTAL}</span>
          <span>COMBINED: /{100 + JUDGE_MAX_TOTAL}</span>
        </div>

        <div className="space-y-4">
          {teams.length === 0 && (
            <div className="text-center text-white/30 py-12">No teams registered yet.</div>
          )}
          {teams.map((t, i) => {
            const combinedScore = t.score + t.judgeScore;
            const isLocal = t.id === localState.teamId;
            return (
              <div key={t.id} className={`border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                i === 0 ? 'border-neon-green/50 bg-neon-green/5 shadow-[0_0_20px_rgba(0,255,157,0.1)]' :
                isLocal ? 'border-neon-cyan/30 bg-neon-cyan/5' : 'border-white/10 bg-black/30'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${i === 0 ? 'text-neon-green' : i === 1 ? 'text-neon-cyan' : 'text-white/30'}`}>#{i + 1}</div>
                  <div>
                    <div className="font-bold tracking-widest">
                      {t.name}
                      {isLocal && <span className="text-neon-cyan text-xs ml-2">[YOU]</span>}
                    </div>
                    <div className="text-xs text-white/30">
                      Round {t.round} · {t.keys}/3 Keys · {t.hints} Hints · {t.members} Members
                    </div>
                    {/* Per-round breakdown */}
                    <div className="flex gap-1 mt-1">
                      {(t.roundScores || [0,0,0,0]).map((s: number, ri: number) => (
                        <span key={ri} className="text-[9px] text-white/20 border border-white/5 px-1">
                          R{ri + 1}: {s > 0 ? s.toFixed(1) : '—'}/{ROUND_MAX_SCORES[ri + 1]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className={`text-2xl font-bold ${i === 0 ? 'text-neon-green' : 'text-white/70'}`}>
                    {combinedScore.toFixed(1)} PTS
                  </div>
                  <div className="text-[10px] text-white/30">
                    Game: {t.score.toFixed(1)} · Judge: {t.judgeScore}/{JUDGE_MAX_TOTAL}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
