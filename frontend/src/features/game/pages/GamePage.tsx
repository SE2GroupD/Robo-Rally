import { Navigate } from 'react-router-dom';
import { Button } from '../../../foundation/components/button/Button';
import { RoomSession } from '../components/room/RoomSession';
import type { JoinedRoom } from '../api/gameApi';

interface GamePageProps {
  room: JoinedRoom | null;
  isStarting: boolean;
  error: string;
  onRetry: () => void;
  onBack: () => void;
}

// Solo play: App creates a real room and starts it immediately, so the server
// runs the game exactly as it does for a hosted battle. RoomSession's own
// "Leave Room" button closes the room and calls onBack.
export function GamePage({ room, isStarting, error, onRetry, onBack }: GamePageProps) {
  // A refresh loses the in-memory room, so there is nothing to show.
  if (!room && !isStarting && !error) return <Navigate to="/main-menu" replace />;

  return (
    <div className="flex h-dvh flex-col gap-3 bg-slate-950 p-3 text-white">
      {isStarting && <output className="m-0">Starting game…</output>}
      {error && (
        <>
          <p role="alert" className="m-0 text-hazard">
            {error}
          </p>
          <Button onClick={onRetry}>Try Again</Button>
          <Button variant="secondary" onClick={onBack}>
            Back to Menu
          </Button>
        </>
      )}
      {room && <RoomSession initialRoom={room} onLeft={onBack} />}
    </div>
  );
}
