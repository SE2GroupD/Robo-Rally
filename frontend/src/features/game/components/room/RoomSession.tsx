import { Button } from '../../../../foundation/components/button/Button';
import type { JoinedRoom } from '../../api/gameApi';
import { useRoomSession } from '../../hooks/useRoomSession';
import { useRoomSetup } from '../../hooks/useRoomSetup';
import { RoomUnavailable } from './RoomUnavailable';
import { RoomCode } from './room-code/RoomCode';
import { PlayerSection } from './player-section/PlayerSection';
import { RobotSelection } from './robot-section/RobotSelection';
import { RoomVisibility } from './room-visability/RoomVisibility';
import { MapSelection } from './map-selection/MapSelection';

interface RoomSessionProps {
  initialRoom: JoinedRoom;
  onLeft: () => void;
  onRoomChange?: (room: JoinedRoom) => void;
}

export function RoomSession(props: RoomSessionProps) {
  const session = useRoomSession(props);
  const setup = useRoomSetup(session);
  const { room, busy, error, closed } = session;
  const { isHost, selectedAvatarId, takenAvatarIds, setupError, startBlockReason } = setup;
  if (closed) return <RoomUnavailable onLeft={props.onLeft} />;
  return (
    <div className="relative flex flex-1 flex-col min-h-0 gap-3">
      {busy && (
        <div className="pointer-events-none absolute top-2 right-2 z-30 flex items-center gap-2 rounded bg-slate-900/90 px-3 py-1 text-xs text-text-muted border border-metal-light shadow-md backdrop-blur-sm">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-hazard" />
          Updating room…
        </div>
      )}

      {error && (
        <p role="alert" className="m-0 text-hazard">
          {error}
        </p>
      )}

      <RoomCode roomCode={room.roomCode} />
      {isHost && <RoomVisibility publicRoom={Boolean(room.publicRoom)} disabled={busy} onChange={setup.changeVisibility} />}
      <PlayerSection room={room} />
      <MapSelection
        room={room}
        disabled={busy}
        error={setupError}
        onMap={(mapId) => setup.updateSetup('map', { mapId })}
        onStart={(position) => setup.updateSetup('start-tile', { mapId: room.mapId!, position })}
      />

      <RobotSelection
        selectedAvatarId={selectedAvatarId}
        takenAvatarIds={takenAvatarIds}
        disabled={busy}
        onSelect={setup.chooseRobot}
      />

      {!isHost && <output className="m-0 text-center text-text-muted">Waiting for the host to start the battle.</output>}

      {isHost && (
        <div className="flex flex-col gap-2">
          {startBlockReason && <output className="m-0 text-center text-sm font-medium text-amber-400">{startBlockReason}</output>}
          <Button size="large" disabled={busy || Boolean(startBlockReason)} onClick={setup.start}>
            Start Battle
          </Button>
        </div>
      )}

      {isHost && <p className="m-0 text-sm text-text-muted">Leaving closes this room for everyone.</p>}
      <Button disabled={busy} onClick={session.leave} variant="secondary">
        Leave Room
      </Button>
    </div>
  );
}
