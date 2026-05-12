import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { TEAM_ROLES } from '../config/gameConfig';
import { ShieldAlert, Terminal, Fingerprint, Wrench, Users, Plus, X, Zap } from 'lucide-react';
import type { TeamMember } from '../types';

const ROLE_ICONS: Record<string, any> = {
  decoder: Terminal,
  prompt: Fingerprint,
  investigator: ShieldAlert,
  repair: Wrench,
  operator: Zap,
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const initTeam = useGameStore((s) => s.initTeam);

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([{ name: '', role: 'Operator' }]);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    if (members.length < 6) {
      setMembers([...members, { name: '', role: 'Operator' }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleDeploy = async () => {
    if (!teamName.trim()) { setError('TEAM NAME REQUIRED'); return; }
    if (teamName.trim().length < 2) { setError('TEAM NAME TOO SHORT'); return; }

    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) { setError('AT LEAST ONE TEAM MEMBER REQUIRED'); return; }

    setDeploying(true);
    setError('');

    try {
      await initTeam(teamName.trim(), validMembers);
      navigate('/game');
    } catch {
      setError('DEPLOYMENT FAILED — RETRY');
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-6 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 scanline pointer-events-none opacity-50" />

      <div className="glass-panel max-w-4xl w-full p-6 md:p-8 space-y-6 relative z-10 border-t-4 border-t-neon-cyan">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-white/10 pb-6">
          <h2 className="text-2xl md:text-3xl tracking-widest text-white">INITIALIZE CONNECTION</h2>
          <p className="text-danger-red animate-pulse text-sm">WARNING: ACTIVE AI THREAT DETECTED — NEXUS-9 ONLINE</p>
        </div>

        <div className="space-y-6">
          {/* Team Name */}
          <div>
            <label className="block text-neon-green mb-2 tracking-widest text-sm">&gt; ENTER TEAM DESIGNATION_</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => { setTeamName(e.target.value); setError(''); }}
              className="w-full bg-black/50 border border-neon-green/50 text-white p-3 font-mono focus:outline-none focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,157,0.5)] transition-all text-lg tracking-widest"
              placeholder="e.g. SHADOW PROTOCOL, CIPHER UNIT..."
              maxLength={30}
            />
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-neon-green tracking-widest text-sm">&gt; SQUAD ROSTER_</label>
              <button
                onClick={addMember}
                disabled={members.length >= 6}
                className="flex items-center gap-1 px-3 py-1 text-xs border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" /> ADD MEMBER
              </button>
            </div>

            <div className="space-y-3">
              {members.map((member, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-white/10 bg-black/30">
                  <Users className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateMember(i, 'name', e.target.value)}
                    placeholder={`Agent ${i + 1} callsign...`}
                    className="flex-1 bg-transparent border-b border-white/20 text-white p-1 font-mono text-sm focus:outline-none focus:border-neon-green transition-all"
                    maxLength={25}
                  />
                  <select
                    value={member.role}
                    onChange={(e) => updateMember(i, 'role', e.target.value)}
                    className="bg-black border border-white/20 text-white/70 p-1 text-xs font-mono focus:outline-none"
                  >
                    {TEAM_ROLES.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  {members.length > 1 && (
                    <button onClick={() => removeMember(i)} className="text-danger-red/50 hover:text-danger-red transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Role Legend */}
          <div className="space-y-2">
            <label className="block text-neon-green tracking-widest text-sm">&gt; AVAILABLE ROLES_</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {TEAM_ROLES.map((role) => {
                const Icon = ROLE_ICONS[role.id] || Zap;
                return (
                  <div key={role.id} className="p-2 border border-white/10 bg-black/20 text-center">
                    <Icon className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
                    <div className="text-[10px] font-bold text-white/70">{role.name}</div>
                    <div className="text-[9px] text-white/30">{role.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-danger-red font-bold animate-pulse text-sm text-center border border-danger-red/30 p-2 bg-danger-red/5">
              {error}
            </div>
          )}

          {/* Deploy Button */}
          <div className="pt-4">
            <button
              onClick={handleDeploy}
              disabled={deploying || !teamName.trim()}
              className="w-full p-4 bg-danger-red/20 border-2 border-danger-red text-danger-red font-bold tracking-widest hover:bg-danger-red hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-lg"
            >
              {deploying ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-danger-red/30 border-t-danger-red rounded-full animate-spin" />
                  DEPLOYING SQUAD...
                </span>
              ) : (
                'DEPLOY TO GRID'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
