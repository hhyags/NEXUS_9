import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface RestartModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestartModal({ onConfirm, onCancel }: RestartModalProps) {
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 border-2 border-danger-red bg-[#0a0a0a] p-6 space-y-6 shadow-[0_0_60px_rgba(255,59,59,0.3)]">
        {/* Header */}
        <div className="text-center space-y-2">
          <AlertTriangle className="w-12 h-12 text-danger-red mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-danger-red tracking-widest">SYSTEM RESTART</h2>
          <p className="text-white/50 text-sm">This action cannot be undone.</p>
        </div>

        {/* Warning */}
        <div className="border border-danger-red/30 bg-danger-red/5 p-4 text-sm space-y-2">
          <div className="text-danger-red font-bold text-xs tracking-widest">WARNING: THIS WILL RESET</div>
          <ul className="text-white/60 text-xs space-y-1 list-disc list-inside">
            <li>Global timer → 100:00</li>
            <li>All team scores → 0</li>
            <li>All round progress → Round 1</li>
            <li>All security keys → Locked</li>
            <li>All submissions → Cleared</li>
            <li>Mission logs → Purged</li>
            <li>Local cache → Wiped</li>
          </ul>
        </div>

        {/* Confirmation */}
        <div>
          <label className="text-[10px] text-white/40 tracking-widest block mb-2">TYPE "RESTART" TO CONFIRM</label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            className="w-full bg-black border border-danger-red/50 text-danger-red text-center p-3 font-mono tracking-widest focus:outline-none focus:border-danger-red"
            placeholder="RESTART"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 p-3 border border-white/20 text-white/50 hover:text-white hover:border-white/50 tracking-widest text-sm transition-all"
          >
            ABORT
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'RESTART'}
            className="flex-1 p-3 bg-danger-red/20 border border-danger-red text-danger-red font-bold tracking-widest text-sm hover:bg-danger-red hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            EXECUTE RESTART
          </button>
        </div>
      </div>
    </div>
  );
}
