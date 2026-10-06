import { useEffect, useRef, useState } from 'react';
import { fetchRoom, leaveRoom, startRoom, RoomRequestError, type JoinedRoom } from '../../api/gameApi';
import { Button } from '../../../../foundation/components/button/Button';
import { Map as GameMap } from '../map/Map';
import { useGameState } from '../../hooks/useGameState';
import { useGameReplay } from '../../hooks/useGameReplay';
import { toTileData } from '../../data/serverTiles';
import { ProgrammingPhase } from '../programming/ProgrammingPhase';
import type { AvatarId } from '../../types/Board';
import type { BoardStateDto, CheckpointProgressDto } from '../../types/GameStateDto';

interface RoomSessionProps {
  initialRoom: JoinedRoom;
  onLeft: () => void;
}

function describeStatus(state: BoardStateDto, players: JoinedRoom['players'], isReplaying: boolean) {
  if (isReplaying) return `Round ${state.round - 1} resolving…`;
  const waitingFor = players.filter((p) => !state.lockedInPlayerIds.includes(p.playerId)).map((p) => p.playerName);
  return waitingFor.length > 0 ? `Round ${state.round} · Waiting for ${waitingFor.join(', ')}` : '';
}

function completedLabel(progress: CheckpointProgressDto) {
  return progress.completedCheckpoints.length > 0 ? progress.completedCheckpoints.join(', ') : 'None';
}

function CheckpointProgress({
  players,
  progress,
}: {
  players: JoinedRoom['players'];
  progress: readonly CheckpointProgressDto[];
}) {
  const progressByPlayer = new Map(progress.map((entry) => [entry.playerId, entry]));

  return (
    <section
      aria-label="Checkpoint progress"
      className="absolute left-3 top-3 z-20 w-64 max-w-[calc(100%-1.5rem)] rounded border border-metal-light bg-slate-950/90 p-3 text-sm text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
    >
      <h2 className="m-0 text-sm font-bold text-metal-light">Checkpoint progress</h2>
      <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
        {players.map((player) => {
          const playerProgress = progressByPlayer.get(player.playerId);
          return (
            <li key={player.playerId} className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-bold">{player.playerName}</span>
                <span className="shrink-0 text-metal-light">Next {playerProgress?.nextCheckpoint ?? '-'}</span>
              </div>
              <p className="m-0 mt-1 text-xs text-text-muted">
                Completed: {playerProgress ? completedLabel(playerProgress) : 'None'}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RoomSession({ initialRoom, onLeft }: RoomSessionProps) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const actionPending = useRef(false);
  const revision = useRef(0);
  const isHost = room.playerId === room.hostPlayerId;
  const started = room.status === 'STARTED';

  const { state, error: gameError } = useGameState(room.gameId, started && !closed);
  const { robots, isReplaying, programmingRound } = useGameReplay(state);

  // Avatar and hue come from the player's position in the room (max 6 players).
  const mapRobots = robots.map((robot) => {
    const index = Math.max(
      0,
      room.players.findIndex((p) => p.playerId === robot.playerId),
    );
    return { ...robot, avatarId: ((index % 6) + 1) as AvatarId, hue: index * 60 };
  });

  useEffect(() => {
    if (closed) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      const version = revision.current;
      try {
        if (!actionPending.current) {
          const updated = await fetchRoom(initialRoom, controller.signal);
          if (!controller.signal.aborted && version === revision.current) {
            setRoom(updated);
            setError('');
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted && version === revision.current) {
          if (cause instanceof RoomRequestError && [403, 404].includes(cause.status)) {
            setClosed(true);
          } else {
            setError('Unable to refresh the room. Reconnecting…');
          }
        }
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 2000);
      }
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [initialRoom, closed]);

  async function handleAction(action: 'start' | 'leave') {
    if (actionPending.current) return;
    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setError('');
    try {
      if (action === 'start') setRoom(await startRoom(room));
      else {
        await leaveRoom(room);
        onLeft();
      }
    } catch (cause) {
      if (cause instanceof RoomRequestError && [403, 404].includes(cause.status)) {
        setClosed(true);
      } else {
        setError(action === 'start' ? 'Could not start. Please try again.' : 'Could not leave. Please try again.');
      }
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopyMessage('Room code copied.');
    } catch {
      setCopyMessage('Could not copy. Select and copy the code manually.');
    }
  }

  if (closed)
    return (
      <>
        <output>This room has closed or you are no longer a participant.</output>
        <Button onClick={onLeft}>Back to Meu</Button>
      </>
    );

  return (
    <>
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
      {busy && <output className="m-0">Updating room…</output>}
      {started ? (
        <div className="relative h-[75dvh] overflow-hidden bg-slate-950">
          {state ? (
            <>
              <GameMap width={state.width} height={state.height} tiles={state.tiles.map(toTileData)} robots={mapRobots} />
              <CheckpointProgress players={room.players} progress={state.checkpointProgress} />
              <div className="pointer-events-none absolute inset-x-0 top-2 z-20 text-center text-sm text-white">
                {describeStatus(state, room.players, isReplaying)}
              </div>
              <div className="pointer-events-none absolute inset-0 z-10">
                <ProgrammingPhase roomId={room.gameId} round={programmingRound} />
              </div>
            </>
          ) : (
            <output className="absolute inset-0 flex items-center justify-center text-white">Loading game…</output>
          )}
        </div>
      ) : (
        <>
          <section className="rounded border border-metal-light p-4 text-center">
            <h2 className="m-0 text-sm font-bold text-text-muted">Room code</h2>
            <p className="my-3 select-text text-3xl font-bold tracking-widest">{room.roomCode}</p>
            <Button className="w-full" onClick={copyCode} variant="secondary">
              Copy Code
            </Button>
            <p className="mb-0 mt-3 text-sm text-text-muted">Share this code so friends can join.</p>
            <output className="mb-0 mt-2 text-sm">{copyMessage}</output>
          </section>
          <section className="rounded border border-metal-light p-4">
            <h2 className="mb-3 mt-0 text-lg font-bold">Players</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {room.players.map((player) => (
                <li key={player.playerId} className="flex justify-between gap-3">
                  <span>{player.playerName}</span>
                  <span>
                    {player.playerId === room.hostPlayerId ? 'Host' : 'Guest'}
                    {player.playerId === room.playerId ? ' · You' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {!isHost && <output className="m-0 text-center text-text-muted">Waiting for the host to start the battle.</output>}
          {isHost && (
            <Button size="large" disabled={busy} onClick={() => handleAction('start')}>
              Start Battle
            </Button>
          )}
        </>
      )}
      {isHost && <p className="m-0 text-sm text-text-muted">Leaving closes this room for everyone.</p>}
      <Button disabled={busy} onClick={() => handleAction('leave')} variant="secondary">
        Leave Room
      </Button>
    </>
  );
}
