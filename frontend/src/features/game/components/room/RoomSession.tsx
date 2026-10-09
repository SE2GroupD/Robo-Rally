import { useEffect, useRef, useState } from 'react';
import { fetchRoom, leaveRoom, startRoom, selectRobot, RoomRequestError, type JoinedRoom } from '../../api/gameApi';
import { Button } from '../../../../foundation/components/button/Button';
import { Map } from '../map/Map';
import { useGameState } from '../../hooks/useGameState';
import { useGameReplay } from '../../hooks/useGameReplay';
import { toTileData } from '../../data/serverTiles';
import { ProgrammingPhase } from '../programming/ProgrammingPhase';
import { RobotSelection } from './RobotSelection';
import type { AvatarId } from '../../types/Board';
import type { BoardStateDto } from '../../types/GameStateDto';

import avatar1 from '../../../../assets/avatars/avatar1.svg';
import avatar2 from '../../../../assets/avatars/avatar2.svg';
import avatar3 from '../../../../assets/avatars/avatar3.svg';
import avatar4 from '../../../../assets/avatars/avatar4.svg';
import avatar5 from '../../../../assets/avatars/avatar5.svg';
import avatar6 from '../../../../assets/avatars/avatar6.svg';

const AVATAR_MAP: Record<number, string> = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
};

interface RoomSessionProps {
  initialRoom: JoinedRoom;
  onLeft: () => void;
  onRoomChange?: (room: JoinedRoom) => void;
}

function describeStatus(state: BoardStateDto, players: JoinedRoom['players'], isReplaying: boolean) {
  if (isReplaying) return `Round ${state.round - 1} resolving…`;

  const waitingFor = players
    .filter((player) => !state.lockedInPlayerIds.includes(player.playerId))
    .map((player) => player.playerName);

  return waitingFor.length > 0 ? `Round ${state.round} · Waiting for ${waitingFor.join(', ')}` : '';
}

export function RoomSession({ initialRoom, onLeft, onRoomChange }: RoomSessionProps) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const actionPending = useRef(false);
  const revision = useRef(0);

  const isHost = room.playerId === room.hostPlayerId;
  const started = room.status === 'STARTED';

  const currentPlayer = room.players.find((player) => player.playerId === room.playerId);
  const selectedAvatarId = currentPlayer?.avatarId ?? null;

  const takenAvatarIds = room.players
    .filter((player) => player.playerId !== room.playerId && player.avatarId !== null)
    .map((player) => player.avatarId as number);

  const { state, error: gameError } = useGameState(room.gameId, started && !closed);
  const { robots, isReplaying, programmingRound } = useGameReplay(state);

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
            onRoomChange?.(updated);
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
  }, [initialRoom, closed, onRoomChange]);

  async function handleAction(action: 'start' | 'leave') {
    if (actionPending.current) return;

    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setError('');

    try {
      if (action === 'start') {
        const updated = await startRoom(room);
        setRoom(updated);
        onRoomChange?.(updated);
      } else {
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

  async function handleSelectRobot(avatarId: number) {
    if (actionPending.current) return;

    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setError('');

    try {
      const updated = await selectRobot(room, avatarId);
      setRoom(updated);
      onRoomChange?.(updated);
    } catch (cause) {
      if (cause instanceof RoomRequestError && cause.status === 409) {
        setError('That robot has already been selected.');
      } else {
        setError('Could not select robot. Please try again.');
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

  if (closed) {
    return (
      <>
        <output>This room has closed or you are no longer a participant.</output>
        <Button onClick={onLeft}>Back to Menu</Button>
      </>
    );
  }

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

      {started ? (
        <div className="relative flex-1 min-h-0 overflow-hidden bg-slate-950">
          {state ? (
            <>
              <Map width={state.width} height={state.height} tiles={state.tiles.map(toTileData)} robots={mapRobots} />

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

          <RobotSelection
            selectedAvatarId={selectedAvatarId}
            takenAvatarIds={takenAvatarIds}
            disabled={busy}
            onSelect={handleSelectRobot}
          />

          <section className="rounded border border-metal-light p-4">
            <h2 className="mb-3 mt-0 text-lg font-bold">Players</h2>

            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {room.players.map((player) => (
                <li key={player.playerId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {player.avatarId && AVATAR_MAP[player.avatarId] ? (
                      <img
                        src={AVATAR_MAP[player.avatarId]}
                        alt={`Robot ${player.avatarId}`}
                        className="h-7 w-7 rounded border border-metal-light bg-slate-800 p-0.5 object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded border border-dashed border-metal-light bg-slate-900 text-xs text-text-muted"
                        title="No robot selected"
                      >
                        ?
                      </div>
                    )}
                    <span>{player.playerName}</span>
                  </div>

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

      {isHost && !started && <p className="m-0 text-sm text-text-muted">Leaving closes this room for everyone.</p>}

      <Button disabled={busy} onClick={() => handleAction('leave')} variant="secondary">
        Leave Room
      </Button>
    </div>
  );
}
