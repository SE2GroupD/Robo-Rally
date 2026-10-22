import { playerAvatar } from '../data/avatars';
import { useRef } from 'react';
import { useRoomSession } from '../hooks/useRoomSession';
import { useGameState } from '../hooks/useGameState';
import { useGameReplay } from '../hooks/useGameReplay';
import { useInGameSocket } from '../hooks/useInGameSocket';
import { toTileData } from '../data/serverTiles';
import { Map } from '../components/map/Map';
import { ProgrammingPhase } from '../components/programming/ProgrammingPhase';
import { RaceProgress } from '../components/gameplay/race-progress/RaceProgress';
import { RoundStatus } from '../components/gameplay/RoundStatus';
import { MatchResultsDialog } from '../components/gameplay/match-results/MatchResultsDialog';
import { useMatchResults } from '../hooks/useMatchResults';
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
    <div className="flex h-dvh flex-col bg-factory-bg text-white">
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
  const { robots, progressState, isReplaying, programmingRound } = useGameReplay(state);
  const showResultsRef = useRef<HTMLButtonElement>(null);
  const results = useMatchResults(state, room.players, isReplaying);

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

    return {
      ...robot,
      avatarId: playerAvatar(robot.playerId, room.players) ?? 1,
      hue: index * 60,
    };
  });

  if (closed) return <RoomUnavailable onLeft={onLeft} />;
  return (
    <div className="relative flex flex-1 flex-col min-h-0">
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
      {results.results && (
        <MatchResultsDialog
          results={results.results}
          currentPlayerId={room.playerId}
          open={results.open}
          busy={busy}
          error={error}
          returnFocusRef={showResultsRef}
          onDismiss={results.dismiss}
          onLeave={leave}
        />
      )}
      <header className="flex min-h-16 shrink-0 items-center gap-4 border-b border-metal-dark/60 bg-[#161d23] px-5">
        <div className="shrink-0 border-r border-metal-dark/60 pr-4 font-bold">
          ROBO <span className="ml-2 text-hazard">RALLY</span>
        </div>
        <p className="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-white" title={state?.layout?.name}>
          {state?.layout?.name}
        </p>
        {state && (
          <div className="min-w-0 max-w-sm">
            <RoundStatus state={state} players={room.players} currentPlayerId={room.playerId} isReplaying={isReplaying} />
          </div>
        )}
        {results.available && (
          <Button ref={showResultsRef} size="small" className="shrink-0" disabled={busy} onClick={results.show}>
            Show results
          </Button>
        )}
        <Button size="small" className="shrink-0" disabled={busy} onClick={leave} variant="secondary">
          Leave Room
        </Button>
      </header>
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[176px_minmax(0,1fr)] xl:grid-cols-[216px_minmax(0,1fr)]">
        <aside aria-label="Race standings" className="min-h-0 overflow-y-auto border-r border-metal-dark/40 bg-[#161d23] p-4">
          <h2 className="mb-3 text-[10px] uppercase tracking-wide text-metal-light">Players · {room.players.length}</h2>
          {state && (
            <RaceProgress
              players={room.players}
              progress={progressState?.checkpointProgress ?? []}
              totalCheckpoints={progressState?.totalCheckpoints ?? state.totalCheckpoints}
              currentPlayerId={room.playerId}
              winnerId={progressState?.winner?.playerId}
              lockedInPlayerIds={state.lockedInPlayerIds}
              readinessState={readinessState}
            />
          )}
        </aside>
        {state ? (
          <ProgrammingPhase
            roomId={room.gameId}
            round={state.winner ? null : programmingRound}
            completed={Boolean(state.winner) && !isReplaying}
            onCardsLocked={() => sendReadyStatus(true)}
            board={
              <Map
                layout={state.layout}
                width={state.width}
                height={state.height}
                tiles={state.tiles.map(toTileData)}
                robots={mapRobots}
                currentPlayerId={room.playerId}
              />
            }
          />
        ) : (
          <output className="flex items-center justify-center text-white">Loading game…</output>
        )}
      </div>
    </div>
  );
}
