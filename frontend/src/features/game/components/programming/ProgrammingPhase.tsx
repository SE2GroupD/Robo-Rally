import { useState } from 'react';
import { ProgramRegisters } from './register/ProgramRegisters';
import { ProgrammingHand } from './register/ProgrammingHand';
import { useProgramming } from '../../hooks/useProgramming';
import type { CardType } from '../../types/CardType';

interface ProgrammingPhaseProps {
  roomId: string;
  onLockIn?: (registers: CardType[]) => void;
}

export function ProgrammingPhase({ roomId, onLockIn }: ProgrammingPhaseProps) {
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

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 text-white">
      <DrawRegister cards={hand} disabled={isDisabled} onSelectCard={(index) => restoreFocus(() => placeCardInRegister(index))} />
      <footer
        aria-label="Programming controls"
        className="absolute inset-x-0 bottom-0 grid h-[25dvh] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] items-end max-sm:min-h-56 max-sm:grid-rows-[8rem_minmax(0,1fr)]"
      >
        {/* SVG Arrow that rotates based on state */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* 3. The Animated Panel Wrapper */}
      {/* 
        Using grid-rows-[0fr] vs [1fr] is a modern CSS trick to animate height 
        from 0 to auto without needing JavaScript measurements.
      */}
      <div
        className={`grid w-full transition-all duration-500 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {/* 
            Notice: Removed rounded-t-xl here so it attaches seamlessly to the button above 
          */}
          <div className="flex w-full flex-col items-center gap-8 rounded-b-xl rounded-t-none bg-slate-800 p-6 text-white shadow-xl">
            {/* Header & Actions */}
            <div className="flex w-full items-center justify-between border-b border-slate-600 pb-4">
              <div className="flex gap-4 text-sm font-bold text-slate-300">
                <div className="rounded bg-slate-700 px-3 py-1">Draw Pile: {drawPileCount}</div>
                <div className="rounded bg-slate-700 px-3 py-1">Discard Pile: {discardPileCount}</div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearProgram}
                  disabled={isDisabled}
                  className="rounded bg-slate-600 px-4 py-2 font-bold text-white hover:bg-slate-500 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={submitProgram}
                  disabled={isDisabled || registers.includes(null)}
                  className="rounded bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {isLockedIn ? 'Locked In ✓' : 'Lock In'}
                </button>
              </div>
            </div>

            {/* Registers */}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Registers</h2>
              <ProgramRegisters cards={registers} disabled={isDisabled} onRemoveCard={returnCardToHand} />
            </div>

            <ProgrammingHand cards={hand} disabled={isDisabled || !registers.includes(null)} onSelectCard={placeCardInRegister} />
          </div>
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
