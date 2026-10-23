import { useEffect, useState } from 'react';
import { fetchBoardState } from '../api/gameApi';
import type { BoardStateDto } from '../types/GameStateDto';

const POLL_INTERVAL_MS = 1000;

/**
 * Polls the server's board state. This is the ONLY place that knows how updates
 * arrive, so switching to SSE/WebSocket later means rewriting just this hook.
 */
export function useGameState(gameId: string, enabled: boolean) {
  const [state, setState] = useState<BoardStateDto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const next = await fetchBoardState(gameId, controller.signal);
        if (!controller.signal.aborted) {
          setState(next);
          setError('');
        }
      } catch {
        if (!controller.signal.aborted) setError('Unable to refresh the game. Reconnecting…');
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [gameId, enabled]);

  return { state, error };
}
