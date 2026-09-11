import { ProgramRegister } from '../../../shared/components/program-register/ProgramRegister';
import { ProgrammingCard } from './ProgrammingCard';
import { useProgramming } from '../../../hooks/game/useProgramming';

interface ProgrammingPhaseProps {
  roomId: string;
  playerId: string;
}

export function ProgrammingPhase({ roomId, playerId }: ProgrammingPhaseProps) {
  // 1. Grab all the logic and state from the custom hook
  const { hand, registers, isLockedIn, drawPileCount, discardPileCount, selectCard, removeFromRegister, clearRegisters, lockIn } =
    useProgramming(roomId, playerId);

  // 2. Map the data for the UI
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

  // 3. Render
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 rounded-xl bg-slate-800 p-6 text-white shadow-xl">
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
            <ProgrammingCard key={`${card}-${idx}`} type={card} onClick={() => selectCard(card, idx)} disabled={isLockedIn} />
          ))}
          {hand.length === 0 && <span className="mt-10 italic text-slate-500">Hand is empty</span>}
        </div>
      </div>
    </div>
  );
}
