import { Navigate } from 'react-router-dom';
import roboRallyImage from '../../../assets/hero.png';
import { Button } from '../../../foundation/components/button/Button';
import { MenuScreen } from '../../../shared/components/menu-screen/MenuScreen';
import { RoomSession } from '../components/room/RoomSession';
import type { CreatedRoom, JoinedRoom } from '../api/gameApi';

interface HostBattlePageProps {
  username: string;
  room: CreatedRoom | null;
  isCreating: boolean;
  error: string;
  onRetry: () => void;
  onBack: () => void;
  onRoomChange?: (room: JoinedRoom) => void;
}

export function HostBattlePage({ username, room, isCreating, error, onRetry, onBack, onRoomChange }: HostBattlePageProps) {
  if (room?.status === 'STARTED') {
    return <Navigate to="/game" replace />;
  }

  return (
    <MenuScreen
      img={roboRallyImage}
      subtitle={`Pilot ${username}`}
      title="Battle Room"
      panelClassName={room ? 'max-w-6xl' : undefined}
    >
      {room ? (
        <RoomSession initialRoom={room} onLeft={onBack} onRoomChange={onRoomChange} />
      ) : (
        <>
          {isCreating && <output>Creating room…</output>}
          {error && (
            <>
              <p role="alert" className="m-0 text-hazard">
                {error}
              </p>
              <Button onClick={onRetry} disabled={isCreating}>
                Retry
              </Button>
            </>
          )}
          <Button onClick={onBack} disabled={isCreating} variant="secondary">
            Back to Menu
          </Button>
        </>
      )}
    </MenuScreen>
  );
}
