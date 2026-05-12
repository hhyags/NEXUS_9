import { useState, useEffect, useCallback } from 'react';
import { JUDGE_PASSWORD, JUDGE_CRITERIA, JUDGE_MAX_TOTAL } from '../config/gameConfig';
import { saveJudgeScores, fetchAllJudgeScores } from '../services/judgeService';
import { fetchAllTeams, subscribeToTable } from '../services/realtimeService';

interface TeamScores {
  logic: number;
  ethics: number;
  creativity: number;
  emotional: number;
  persuasiveness: number;
  comment: string;
}

export function JudgePage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [scores, setScores] = useState<TeamScores>({ logic: 0, ethics: 0, creativity: 0, emotional: 0, persuasiveness: 0, comment: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allJudgeScores, setAllJudgeScores] = useState<any[]>([]);

  const handleAuth = () => {
    if (password === JUDGE_PASSWORD) setAuthed(true);
  };

  // Fetch teams and judge scores
  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      const t = await fetchAllTeams();
      setTeams(t);
      const js = await fetchAllJudgeScores();
      setAllJudgeScores(js);
    };
    load();
    const interval = setInterval(load, 5000);

    // Realtime subscription
    subscribeToTable('judge_scores', () => {
      fetchAllJudgeScores().then(setAllJudgeScores);
    });

    return () => {
      clearInterval(interval);
      // channel cleanup handled by service
    };
  }, [authed]);

  const total = scores.logic + scores.ethics + scores.creativity + scores.emotional + scores.persuasiveness;

  const handleSave = useCallback(async () => {
    if (!selectedTeam) return;
    setSaving(true);
    await saveJudgeScores({
      team_id: selectedTeam,
      logic_score: scores.logic,
      ethics_score: scores.ethics,
      creativity_score: scores.creativity,
      emotional_score: scores.emotional,
      persuasiveness_score: scores.persuasiveness,
      judge_comment: scores.comment,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Refresh
    const js = await fetchAllJudgeScores();
    setAllJudgeScores(js);
  }, [selectedTeam, scores]);

  const updateScore = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: Math.max(0, Math.min(5, value)) }));
    setSaved(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-md w-full space-y-6 border-t-4 border-t-neon-cyan">
          <h2 className="text-2xl tracking-widest text-neon-cyan text-center">JUDGE ACCESS</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} placeholder="ENTER JUDGE PASSWORD" className="w-full bg-black border border-neon-cyan/50 text-white text-center p-4 font-mono focus:outline-none" />
          <button onClick={handleAuth} className="w-full p-4 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-bold tracking-widest hover:bg-neon-cyan hover:text-black transition-all">AUTHENTICATE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl tracking-widest text-neon-cyan border-b border-neon-cyan/30 pb-4">JUDGE DASHBOARD</h1>

        {/* Criteria Legend */}
        <div className="border border-neon-cyan/20 p-4 bg-black/30">
          <h3 className="text-xs tracking-widest text-white/50 mb-3">SCORING CRITERIA (0-5 EACH · {JUDGE_MAX_TOTAL} MAX)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {JUDGE_CRITERIA.map(c => (
              <div key={c.key} className="border border-white/10 p-2 text-center">
                <div className="text-neon-cyan text-xs font-bold">{c.label}</div>
                <div className="text-[9px] text-white/30 mt-1">{c.description}</div>
                <div className="text-neon-cyan/50 text-[10px] mt-1">0-{c.maxScore} pts</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team List */}
          <div className="border border-white/10 p-4 bg-black/30 space-y-3">
            <h3 className="text-xs tracking-widest text-white/50">ACTIVE TEAMS</h3>
            {teams.length === 0 && <div className="text-white/30 text-sm">No teams registered yet.</div>}
            {teams.map((t: any) => {
              const js = allJudgeScores.find((j: any) => j.team_id === t.id);
              return (
                <button key={t.id} onClick={() => setSelectedTeam(t.id)} className={`w-full text-left p-3 border transition-all ${selectedTeam === t.id ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/10 hover:border-white/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t.team_name}</span>
                    <span className="text-neon-green text-xs">{t.total_score}/100</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">
                    R{t.current_round} · {t.team_members?.length || 0} members
                    {js && <span className="text-neon-cyan ml-2">· Judge: {js.total}/{JUDGE_MAX_TOTAL}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scoring Panel */}
          <div className="lg:col-span-2 border border-white/10 p-6 bg-black/30 space-y-6">
            {!selectedTeam ? (
              <div className="text-center text-white/30 py-12">SELECT A TEAM TO EVALUATE</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm tracking-widest text-neon-cyan">
                    EVALUATING: {teams.find((t: any) => t.id === selectedTeam)?.team_name || '—'}
                  </h3>
                  <div className={`text-2xl font-bold ${total >= 20 ? 'text-neon-green' : total >= 10 ? 'text-warning-amber' : 'text-white/50'}`}>
                    {total}/{JUDGE_MAX_TOTAL}
                  </div>
                </div>

                {/* Score Sliders */}
                <div className="space-y-5">
                  {JUDGE_CRITERIA.map(c => {
                    const val = scores[c.key as keyof Omit<TeamScores, 'comment'>] as number;
                    return (
                      <div key={c.key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">{c.label}</span>
                          <span className="text-neon-cyan font-bold">{val}/5</span>
                        </div>
                        <input
                          type="range" min="0" max="5" step="1"
                          value={val}
                          onChange={(e) => updateScore(c.key, parseInt(e.target.value))}
                          className="w-full accent-neon-cyan h-2 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] text-white/20">
                          {[0, 1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Total Bar */}
                <div className="space-y-1">
                  <div className="text-xs text-white/40 tracking-widest">TOTAL JUDGE SCORE</div>
                  <div className="h-3 bg-white/10 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-300" style={{ width: `${(total / JUDGE_MAX_TOTAL) * 100}%` }} />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs text-white/40 tracking-widest block mb-2">JUDGE COMMENTS</label>
                  <textarea
                    value={scores.comment}
                    onChange={(e) => { setScores(prev => ({ ...prev, comment: e.target.value })); setSaved(false); }}
                    rows={3}
                    placeholder="Optional evaluation notes..."
                    className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm font-mono focus:outline-none focus:border-neon-cyan resize-none"
                  />
                </div>

                {/* Save */}
                <button onClick={handleSave} disabled={saving} className={`w-full p-4 font-bold tracking-widest transition-all ${saved ? 'bg-neon-green/20 border border-neon-green text-neon-green' : 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black'} disabled:opacity-50`}>
                  {saving ? 'SAVING...' : saved ? '✓ SCORES SAVED' : 'SUBMIT EVALUATION'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* All Judge Scores Summary */}
        {allJudgeScores.length > 0 && (
          <div className="border border-white/10 p-6 bg-black/30 space-y-4">
            <h3 className="text-xs tracking-widest text-white/50">ALL EVALUATIONS</h3>
            <div className="space-y-2">
              {allJudgeScores.map((js: any) => {
                const team = teams.find((t: any) => t.id === js.team_id);
                return (
                  <div key={js.id} className="flex items-center justify-between border border-white/5 p-3">
                    <span className="text-sm">{team?.team_name || 'Unknown'}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-white/40">L:{js.logic_score} E:{js.ethics_score} C:{js.creativity_score} Em:{js.emotional_score} P:{js.persuasiveness_score}</span>
                      <span className="text-neon-cyan font-bold">{js.total}/{JUDGE_MAX_TOTAL}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
