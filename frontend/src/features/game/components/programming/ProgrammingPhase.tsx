import { useRef } from 'react';
import { ProgramRegisters } from './register/ProgramRegisters';
import { RegisterButtons } from './register/RegisterButtons';
import { DrawRegister } from './register/DrawRegister';
import { useProgramming } from '../../hooks/useProgramming';
import type { CardType } from '../../types/CardType';

interface ProgrammingPhaseProps {
  roomId: string;
  onLockIn?: (registers: CardType[]) => void;
}

export function ProgrammingPhase({ roomId, onLockIn }: ProgrammingPhaseProps) {
  const root = useRef<HTMLDivElement>(null);

  // We omit playerId here to maintain the secure JWT-based backend extraction
  const { hand, registers, isLockedIn, isSubmitting, placeCardInRegister, returnCardToHand, clearProgram, submitProgram } =
    useProgramming(roomId, onLockIn);
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
      <DrawRegister cards={hand} disabled={isDisabled} onSelectCard={(index) => restoreFocus(() => placeCardInRegister(index))} />
      <footer
        aria-label="Programming controls"
        className="absolute inset-x-0 bottom-0 grid h-[25dvh] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] items-end max-sm:min-h-56 max-sm:grid-rows-[8rem_minmax(0,1fr)]"
      >
        <div aria-hidden="true" className="col-start-1 row-start-1" />
        <div className="col-start-2 row-start-1 h-full w-[min(60vw,calc(100vw-18rem))] [container-type:size] max-sm:col-span-3 max-sm:col-start-1 max-sm:row-start-2 max-sm:w-[calc(100%-12rem)] max-sm:justify-self-center">
          <h2 className="sr-only">Your program</h2>
          <ProgramRegisters
            cards={registers}
            disabled={isDisabled}
            onRemoveCard={(index) => restoreFocus(() => returnCardToHand(index))}
          />
        </div>
        <div className="col-start-3 row-start-1 mr-2 mb-2 w-32 justify-self-end">
          <RegisterButtons
            onSubmit={submitProgram}
            onClear={clearProgram}
            selectedCount={selectedCount}
            isSubmitting={isSubmitting}
            isLockedIn={isLockedIn}
          />
        </div>
      </footer>
    </div>
  );
}
