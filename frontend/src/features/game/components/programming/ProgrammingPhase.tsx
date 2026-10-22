import { useRef, type ReactNode } from 'react';
import { ProgramRegisters } from './register/ProgramRegisters';
import { RegisterButtons } from './register/RegisterButtons';
import { CardPiles } from './CardPiles';
import { DrawRegister } from './register/DrawRegister';
import { useProgramming } from '../../hooks/useProgramming';

interface ProgrammingPhaseProps {
  board?: ReactNode;
  roomId: string;
  round: number | null;
  completed?: boolean;
  onCardsLocked?: () => void; // Made optional
}

export function ProgrammingPhase({ board, roomId, round, completed = false, onCardsLocked }: ProgrammingPhaseProps) {
  const root = useRef<HTMLDivElement>(null);
  const {
    hand,
    registers,
    drawPileCount,
    discardPileCount,
    isLockedIn,
    isSubmitting,
    placeCardInRegister,
    returnCardToHand,
    clearProgram,
    submitProgram,
  } = useProgramming(roomId, completed ? null : round);

  const isDisabled = completed || isLockedIn || isSubmitting;
  const selectedCount = registers.filter(Boolean).length;

  const restoreFocus = (action: () => void, keyboard: boolean) => {
    action();
    if (keyboard)
      requestAnimationFrame(() => {
        const target =
          root.current?.querySelector<HTMLButtonElement>('[aria-label="Programming Hand"] button:not(:disabled)') ??
          root.current?.querySelector<HTMLButtonElement>('[aria-label="Program Register"] button:not(:disabled)') ??
          root.current?.querySelector<HTMLButtonElement>('button[data-ready]');
        target?.focus();
      });
  };

  const handleSubmit = () => {
    submitProgram();
    onCardsLocked?.(); // Safe optional call
  };

  return (
    <div ref={root} className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_240px] bg-factory-bg text-white">
      <div className="relative min-h-0 min-w-0 overflow-hidden" aria-label="Board area">
        <h2 className="pointer-events-none absolute left-4 top-4 z-20 text-[10px] uppercase tracking-wide text-metal-light">
          Factory floor
        </h2>
        {board}
      </div>
      <footer
        aria-label="Programming controls"
        className="grid min-h-0 min-w-0 grid-cols-[336px_minmax(0,1fr)] gap-3 bg-[#161d23] p-3 xl:grid-cols-[376px_minmax(0,1fr)]"
      >
        <section
          aria-label="Program registers"
          className="flex min-h-0 min-w-0 flex-col rounded-lg border border-hazard/40 bg-hazard/5 p-3"
        >
          <div className="flex items-center gap-3 text-xs font-bold">
            <h2 className="uppercase text-hazard">Program registers</h2>
            <span className="tabular-nums text-text-muted">{selectedCount} / 5</span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <ProgramRegisters
              cards={registers}
              disabled={isDisabled}
              onRemoveCard={(index, keyboard) => restoreFocus(() => returnCardToHand(index), keyboard)}
            />
          </div>
          <RegisterButtons
            completed={completed}
            onSubmit={handleSubmit}
            onClear={clearProgram}
            selectedCount={selectedCount}
            isSubmitting={isSubmitting}
            isLockedIn={isLockedIn}
          />
        </section>
        <section
          aria-label="Your hand and piles"
          className="flex min-h-0 min-w-0 flex-col rounded-lg border border-cyan-300/30 bg-cyan-300/5 p-3"
        >
          <div className="flex min-w-0 items-center gap-3 text-xs">
            <h2 className="shrink-0 font-bold uppercase text-cyan-300">Your hand</h2>
            <span className="truncate text-text-muted">{hand.filter(Boolean).length} cards · Select to fill a register</span>
          </div>
          <DrawRegister
            cards={hand}
            disabled={isDisabled}
            onSelectCard={(index, keyboard) => restoreFocus(() => placeCardInRegister(index), keyboard)}
          />
          <CardPiles drawPileCount={drawPileCount} discardPileCount={discardPileCount} />
        </section>
      </footer>
    </div>
  );
}
