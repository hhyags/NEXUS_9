import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-danger-red/90 text-white text-center py-2 px-4 flex items-center justify-center gap-3 animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-bold tracking-widest">
        OFFLINE MODE — NEXUS-9 DISRUPTED YOUR CONNECTION
      </span>
      <WifiOff className="w-4 h-4" />
    </div>
  );
}
