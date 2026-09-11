import { useState } from 'react';
import { ProgramRegister } from '../../../shared/components/program-register/ProgramRegister';
import { ProgrammingCard } from './ProgrammingCard';
import { useProgramming } from '../../../hooks/game/useProgramming';

interface ProgrammingPhaseProps {
  roomId: string;
  playerId: string;
}

export function ProgrammingPhase({ roomId, playerId }: ProgrammingPhaseProps) {
  // 1. Use React State to track visibility instead of DOM manipulation
  const [isOpen, setIsOpen] = useState(true);

  const { hand, registers, isLockedIn, drawPileCount, discardPileCount, selectCard, removeFromRegister, clearRegisters, lockIn } =
    useProgramming(roomId, playerId);

  const registerCards = registers.map((card, idx) =>
    card ? (
      <ProgrammingCard
        key={`register-slot-${idx}`}
        type={card}
        onClick={() => removeFromRegister(card, idx)}
        disabled={isLockedIn}
      />
    ) : null,
  ) as [
    React.ReactElement | null,
    React.ReactElement | null,
    React.ReactElement | null,
    React.ReactElement | null,
    React.ReactElement | null,
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
      {/* 2. The Poke-Out Arrow Tab */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-t-xl bg-slate-700 px-8 py-2 font-bold text-slate-300 shadow-lg transition-colors hover:bg-slate-600 hover:text-white"
        aria-expanded={isOpen}
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
                  onClick={clearRegisters}
                  disabled={isLockedIn}
                  className="rounded bg-slate-600 px-4 py-2 font-bold text-white hover:bg-slate-500 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={lockIn}
                  disabled={isLockedIn || registers.includes(null)}
                  className="rounded bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {isLockedIn ? 'Locked In ✓' : 'Lock In'}
                </button>
              </div>
            </div>

            {/* Registers */}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-slate-400">Registers</h2>
              <ProgramRegister cards={registerCards} />
            </div>

            {/* Hand */}
            <div className="flex w-full flex-col items-center gap-4 rounded-lg bg-slate-900 p-4">
              <h2 className="text-lg font-bold text-slate-400">Your Hand</h2>
              <div className="flex min-h-37.5 flex-wrap justify-center gap-3">
                {hand.map((card, idx) => (
                  <ProgrammingCard
                    key={`${card}-${idx}`}
                    type={card}
                    onClick={() => selectCard(card, idx)}
                    disabled={isLockedIn}
                  />
                ))}
                {hand.length === 0 && <span className="mt-10 italic text-slate-500">Hand is empty</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
