import { Map } from '../components/map/Map';
import { ProgrammingPhase } from '../components/programming/ProgrammingPhase';
import type { RobotState } from '../types/board';
import type { CardType } from '../types/CardType';

interface GamePageProps {
  onBack: () => void;
  playerId: string;
  robot: RobotState;
  runProgram: (cards: readonly CardType[]) => void;
}

export function GamePage({ onBack, playerId, robot, runProgram }: GamePageProps) {
  // Temporary room ID until room creation is implemented.
  return (
    <div className="relative h-dvh overflow-hidden bg-slate-950">
      <button
        type="button"
        onClick={onBack}
        className="absolute right-28 top-3 z-20 rounded bg-slate-950/90 px-3 py-2 text-sm text-slate-200 underline focus-visible:outline-2 focus-visible:outline-cyan-300"
      >
        &larr; Back to Menu
      </button>

      <Map robot={robot} />

      <div className="pointer-events-none absolute inset-0 z-10">
        <ProgrammingPhase roomId="123e4567-e89b-12d3-a456-426614174000" playerId={playerId} onLockIn={runProgram} />
      </div>
    </div>
  );
}
