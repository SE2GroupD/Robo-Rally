import { useEffect, useState } from 'react';
import type { JoinedRoom } from '../api/gameApi';
import type { BoardStateDto } from '../types/GameStateDto';
import type { MatchResults } from '../types/MatchResults';
import { createMatchResults } from '../data/matchResults';

export function useMatchResults(state: BoardStateDto | null, players: JoinedRoom['players'], isReplaying: boolean) {
  const [results, setResults] = useState<MatchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  if (!results && state?.winner) setResults(createMatchResults(state, players));

  useEffect(() => {
    if (!results || isReplaying || revealed) return;
    // Let the replay hook settle before presenting the modal; cancel if replay begins.
    const frame = requestAnimationFrame(() => {
      setRevealed(true);
      setOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [results, isReplaying, revealed]);

  return {
    results,
    open: open && !isReplaying,
    available: Boolean(results) && !isReplaying,
    show: () => setOpen(true),
    dismiss: () => setOpen(false),
  };
}
