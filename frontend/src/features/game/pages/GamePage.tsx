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
    <div className="flex min-h-screen flex-col items-center bg-slate-950 p-4">
      <button type="button" onClick={onBack} className="self-start mb-4 text-slate-400 hover:text-white underline">
        &larr; Back to Menu
      </button>

      <Map robot={robot} />

      <div className="mt-8 w-full max-w-5xl">
        <ProgrammingPhase roomId="123e4567-e89b-12d3-a456-426614174000" playerId={playerId} onLockIn={runProgram} />
      </div>
    </div>
  );
}
