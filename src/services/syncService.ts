const STORAGE_KEY = 'nexus9_game_state';
const OFFLINE_QUEUE_KEY = 'nexus9_offline_queue';

export interface CachedGameState {
  teamId: string | null;
  teamName: string;
  currentRound: number;
  currentStep: number;
  roundScores: number[];
  keysCollected: number;
  hintsUsed: number;
  globalTimer: number;
  roundStartTime: number | null;
  timestamp: number;
}

/**
 * Save game state to localStorage.
 */
export function cacheGameState(state: CachedGameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }));
  } catch (err) {
    console.warn('[SyncService] Failed to cache state:', err);
  }
}

/**
 * Load cached game state from localStorage.
 */
export function loadCachedState(): CachedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGameState;
    // Expire after 4 hours
    if (Date.now() - parsed.timestamp > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear all cached game state.
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // silent
  }
}

/**
 * Queue an action for later sync when offline.
 */
export function queueOfflineAction(action: { type: string; payload: any }): void {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    existing.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch {
    // silent
  }
}

/**
 * Get queued offline actions.
 */
export function getOfflineQueue(): Array<{ type: string; payload: any; timestamp: number }> {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear offline queue after successful sync.
 */
export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // silent
  }
}

/**
 * Check if browser is online.
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Register online/offline event listeners.
 */
export function registerConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
