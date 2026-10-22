import { useRoomSession } from '../hooks/useRoomSession';
import { useGameState } from '../hooks/useGameState';
import { useGameReplay } from '../hooks/useGameReplay';
import { useInGameSocket } from '../hooks/useInGameSocket';
import { toTileData } from '../data/serverTiles';
import type { AvatarId } from '../types/Board';
import { Map } from '../components/map/Map';
import { ProgrammingPhase } from '../components/programming/ProgrammingPhase';
import { CheckpointProgress } from '../components/gameplay/CheckpointProgress';
import { RoundStatus } from '../components/gameplay/RoundStatus';
import { PilotLegend } from '../components/gameplay/PilotLegend';
import { MatchWinner } from '../components/gameplay/MatchWinner';
import { RoomUnavailable } from '../components/room/RoomUnavailable';
import { Navigate } from 'react-router-dom';
import { Button } from '../../../foundation/components/button/Button';

import type { JoinedRoom } from '../api/gameApi';

interface GamePageProps {
  room: JoinedRoom | null;
  isStarting: boolean;
  error: string;
  onRetry: () => void;
  onBack: () => void;
}

// Solo and multiplayer games share the same active-game view.
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
      {room && <ActiveGame key={room.gameId} initialRoom={room} onLeft={onBack} />}
    </div>
  );
}

function ActiveGame({ initialRoom, onLeft }: { initialRoom: JoinedRoom; onLeft: () => void }) {
  const { room, busy, error, closed, leave } = useRoomSession({ initialRoom, onLeft });
  const started = room.status === 'STARTED';
  const { state, error: gameError } = useGameState(room.gameId, started && !closed);
  const { robots, isReplaying, programmingRound } = useGameReplay(state);

  const { readinessState, sendReadyStatus } = useInGameSocket(
    started && !closed ? room.gameId : undefined,
    room.playerId,
    state?.round,
  );

  const mapRobots = robots.map((robot) => {
    const index = Math.max(
      0,
      room.players.findIndex((player) => player.playerId === robot.playerId),
    );

    const player = room.players.find((roomPlayer) => roomPlayer.playerId === robot.playerId);

    return {
      ...robot,
      avatarId: (player?.avatarId ?? (index % 6) + 1) as AvatarId,
      hue: index * 60,
    };
  });

  const rosterPlayers = mapRobots
    .map((robot) => {
      const player = room.players.find((roomPlayer) => roomPlayer.playerId === robot.playerId);
      return player ? { ...player, avatarId: robot.avatarId } : null;
    })
    .filter((player): player is JoinedRoom['players'][number] & { avatarId: AvatarId } => player !== null)
    .sort((first, second) => Number(second.playerId === room.playerId) - Number(first.playerId === room.playerId));

  if (closed) return <RoomUnavailable onLeft={onLeft} />;
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

      {gameError && (
        <p role="alert" className="m-0 text-hazard">
          {gameError}
        </p>
      )}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-slate-950">
        {state ? (
          <>
            <Map
              layout={state.layout}
              width={state.width}
              height={state.height}
              tiles={state.tiles.map(toTileData)}
              robots={mapRobots}
              currentPlayerId={room.playerId}
            />
            <CheckpointProgress
              players={room.players}
              progress={state.checkpointProgress}
              totalCheckpoints={state.totalCheckpoints}
            />

            <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex flex-col items-center gap-1">
              {state.layout?.name && <div className="text-center text-sm font-semibold text-white">{state.layout.name}</div>}
              <RoundStatus state={state} players={room.players} currentPlayerId={room.playerId} isReplaying={isReplaying} />
            </div>

            <PilotLegend
              rosterPlayers={rosterPlayers}
              currentPlayerId={room.playerId}
              lockedInPlayerIds={state.lockedInPlayerIds}
              readinessState={readinessState}
            />
            {state.winner && !isReplaying ? (
              <MatchWinner state={state} players={room.players} />
            ) : !state.winner ? (
              <div className="pointer-events-none absolute inset-0 z-10">
                <ProgrammingPhase roomId={room.gameId} round={programmingRound} onCardsLocked={() => sendReadyStatus(true)} />
              </div>
            ) : null}
          </>
        ) : (
          <output className="absolute inset-0 flex items-center justify-center text-white">Loading game…</output>
        )}
      </div>

      <Button disabled={busy} onClick={leave} variant="secondary">
        Leave Room
      </Button>
    </div>
  );
}
