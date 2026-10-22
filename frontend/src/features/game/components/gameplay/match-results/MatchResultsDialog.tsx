import { useEffect, useRef, type RefObject } from 'react';
import { Button } from '../../../../../foundation/components/button/Button';
import type { MatchResults } from '../../../types/MatchResults';
import { RacePodium } from './RacePodium';
import { RaceStandings } from './RaceStandings';

interface MatchResultsDialogProps {
  results: MatchResults;
  currentPlayerId: string;
  open: boolean;
  busy: boolean;
  error: string;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onDismiss: () => void;
  onLeave: () => void;
}

export function MatchResultsDialog({
  results,
  currentPlayerId,
  open,
  busy,
  error,
  returnFocusRef,
  onDismiss,
  onLeave,
}: MatchResultsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const returnFocus = returnFocusRef.current;
    dialog.showModal();
    titleRef.current?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    return () => {
      dialog.close();
      returnFocus?.focus();
    };
  }, [open, returnFocusRef]);

  const winner = results.standings.find((entry) => entry.playerId === results.winnerId);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="race-results-title"
      aria-describedby="race-results-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onDismiss();
      }}
      className="match-results-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded border border-metal-light bg-factory-bg p-0 text-text-light shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="border-t-4 border-hazard p-4 sm:p-7">
        <header className="mb-6 border-b border-metal-dark pb-5">
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-hazard">Race complete · Round {results.round}</p>
          <h2
            ref={titleRef}
            tabIndex={-1}
            id="race-results-title"
            className="m-0 mt-2 break-words outline-none text-3xl font-black uppercase sm:text-5xl"
          >
            {results.winnerId === currentPlayerId ? 'You won!' : `${winner?.playerName ?? 'Unknown player'} wins!`}
          </h2>
          <p id="race-results-description" className="m-0 mt-2 break-words text-sm text-text-muted">
            {results.courseName} · Final positions at the finish
          </p>
        </header>
        <RacePodium results={results} currentPlayerId={currentPlayerId} />
        <RaceStandings results={results} currentPlayerId={currentPlayerId} />
        {error && (
          <p role="alert" className="mb-0 mt-4 text-sm text-hazard">
            {error}
          </p>
        )}
        <footer className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={busy} onClick={onDismiss}>
            View board
          </Button>
          <Button disabled={busy} onClick={onLeave}>
            {busy ? 'Leaving…' : 'Back to menu'}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
