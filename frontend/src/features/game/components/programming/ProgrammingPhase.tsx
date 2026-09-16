import { useRef } from 'react';
import { ProgramRegisters } from './register/ProgramRegisters';
import { ProgrammingHand } from './register/ProgrammingHand';
import { useProgramming } from '../../hooks/useProgramming';
import type { CardType } from '../../types/CardType';

interface ProgrammingPhaseProps {
  roomId: string;
  onLockIn?: (registers: CardType[]) => void;
}

export function ProgrammingPhase({ roomId, playerId, onLockIn }: ProgrammingPhaseProps) {
  const root = useRef<HTMLDivElement>(null);
  const {
    hand,
    registers,
    isLockedIn,
    isSubmitting,
    drawPileCount,
    discardPileCount,
    placeCardInRegister,
    returnCardToHand,
    clearProgram,
    submitProgram,
  } = useProgramming(roomId, playerId, onLockIn);
  const isDisabled = isLockedIn || isSubmitting;
  const selectedCount = registers.filter(Boolean).length;
  const restoreFocus = (action: () => void) => {
    const keyboard = document.activeElement?.matches(':focus-visible');
    action();
    if (keyboard)
      requestAnimationFrame(() => {
        root.current
          ?.querySelector<HTMLButtonElement>(
            '[aria-label="Programming Hand"] button:not(:disabled), [aria-label="Program Register"] button:not(:disabled), button[data-ready]',
          )
          ?.focus();
      });
  };

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 text-white">
      <ProgrammingHand
        cards={hand}
        disabled={isDisabled || selectedCount === 5}
        onSelectCard={(index) => restoreFocus(() => placeCardInRegister(index))}
      />
      <footer
        aria-label="Programming controls"
        className="absolute bottom-0 right-0 left-[var(--hand-rail,64px)] flex h-[20dvh] items-center-safe gap-2 overflow-auto p-2"
      >
        <div className="min-w-max flex-1">
          <h2 className="sr-only">Your program</h2>
          <ProgramRegisters
            cards={registers}
            disabled={isDisabled}
            onRemoveCard={(index) => restoreFocus(() => returnCardToHand(index))}
          />
        </div>
        <div className="grid w-45 min-w-40 grid-cols-2 gap-1 [&>p]:col-span-full [&>p]:text-center">
          <p aria-live="polite" className="rounded bg-slate-950/90 px-2 py-1 text-xs">
            {selectedCount}/5 cards selected
          </p>
          <button
            data-ready
            type="button"
            onClick={submitProgram}
            disabled={isDisabled || selectedCount < 5}
            className="pointer-events-auto min-h-11 rounded-md bg-emerald-600 px-5 font-bold text-white shadow-lg hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : isLockedIn ? 'Ready ✓' : 'Ready'}
          </button>
          <button
            type="button"
            onClick={clearProgram}
            disabled={isDisabled || selectedCount === 0}
            className="pointer-events-auto min-h-11 rounded-md bg-slate-900/95 px-4 text-sm text-white shadow-lg hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-60"
          >
            Clear
          </button>
          <p className="rounded bg-slate-950/90 px-2 py-1 text-[11px]">
            Draw: {drawPileCount} · Discard: {discardPileCount}
          </p>
        </div>
      </footer>
    </div>
  );
}
