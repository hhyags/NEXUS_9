import React from 'react';
import { JUDGE_CRITERIA, JUDGE_MAX_TOTAL } from '../config/gameConfig';
import { Lock, Unlock } from 'lucide-react';

interface JudgeScoreCardProps {
  judgeName: string;
  teamName: string;
  scores: { logic: number; ethics: number; creativity: number; emotional: number; persuasiveness: number; comment: string };
  isLocked: boolean;
  onScoreChange: (key: string, value: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
  saving: boolean;
  saved: boolean;
}

export const JudgeScoreCard = React.memo(function JudgeScoreCard({
  judgeName, teamName, scores, isLocked, onScoreChange, onCommentChange, onSubmit, saving, saved,
}: JudgeScoreCardProps) {
  const total = scores.logic + scores.ethics + scores.creativity + scores.emotional + scores.persuasiveness;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm tracking-widest text-neon-cyan">EVALUATING: {teamName}</h3>
          <div className="text-[10px] text-white/30 mt-1">Judge: {judgeName}</div>
        </div>
        <div className="flex items-center gap-3">
          {isLocked && <Lock className="w-4 h-4 text-danger-red" />}
          {!isLocked && <Unlock className="w-4 h-4 text-neon-green" />}
          <div className={`text-2xl font-bold ${total >= 20 ? 'text-neon-green' : total >= 10 ? 'text-warning-amber' : 'text-white/50'}`}>
            {total}/{JUDGE_MAX_TOTAL}
          </div>
        </div>
      </div>

      {/* Score Sliders */}
      <div className="space-y-4">
        {JUDGE_CRITERIA.map(c => {
          const val = scores[c.key as keyof Omit<typeof scores, 'comment'>] as number;
          return (
            <div key={c.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{c.label}</span>
                <span className="text-neon-cyan font-bold">{val}/5</span>
              </div>
              <input
                type="range" min="0" max="5" step="1"
                value={val}
                onChange={(e) => onScoreChange(c.key, parseInt(e.target.value))}
                disabled={isLocked}
                className="w-full accent-neon-cyan h-2 cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[9px] text-white/20">
                {[0, 1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Bar */}
      <div className="space-y-1">
        <div className="text-xs text-white/40 tracking-widest">TOTAL JUDGE SCORE</div>
        <div className="h-3 bg-white/10 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-300"
            style={{ width: `${(total / JUDGE_MAX_TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-xs text-white/40 tracking-widest block mb-2">JUDGE COMMENTS</label>
        <textarea
          value={scores.comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={3}
          disabled={isLocked}
          placeholder="Optional evaluation notes..."
          className="w-full bg-black/50 border border-white/20 text-white p-3 text-sm font-mono focus:outline-none focus:border-neon-cyan resize-none disabled:opacity-40"
        />
      </div>

      {/* Submit */}
      {isLocked ? (
        <div className="w-full p-4 text-center border border-neon-green/50 text-neon-green/70 text-sm tracking-widest bg-neon-green/5">
          <Lock className="w-4 h-4 inline mr-2" />
          SCORES LOCKED — ADMIN OVERRIDE REQUIRED TO EDIT
        </div>
      ) : (
        <button
          onClick={onSubmit}
          disabled={saving}
          className={`w-full p-4 font-bold tracking-widest transition-all ${saved ? 'bg-neon-green/20 border border-neon-green text-neon-green' : 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black'} disabled:opacity-50`}
        >
          {saving ? 'SAVING...' : saved ? '✓ SCORES SUBMITTED & LOCKED' : 'SUBMIT EVALUATION'}
        </button>
      )}
    </div>
  );
});
