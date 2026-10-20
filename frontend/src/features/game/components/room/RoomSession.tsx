import { LegacyStartSelection } from './map-selection/LegacyStartSelection';
import { MapSelection } from './map-selection/MapSelection';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  updateRoomSetup,
  selectStartTile,
  fetchRoom,
  leaveRoom,
  startRoom,
  selectRobot,
  RoomRequestError,
  type JoinedRoom,
} from '../../api/gameApi';
import { Button } from '../../../../foundation/components/button/Button';
import { Map } from '../map/Map';
import { useGameState } from '../../hooks/useGameState';
import { useGameReplay } from '../../hooks/useGameReplay';
import { toTileData } from '../../data/serverTiles';
import { ProgrammingPhase } from '../programming/ProgrammingPhase';
import { RobotSelection } from './RobotSelection';
import type { AvatarId } from '../../types/Board';
import type { BoardStateDto, CheckpointProgressDto } from '../../types/GameStateDto';

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

interface RoundStatusProps {
  state: BoardStateDto;
  players: JoinedRoom['players'];
  currentPlayerId: string;
  isReplaying: boolean;
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
  const progressByPlayer = new globalThis.Map(progress.map((entry) => [entry.playerId, entry]));

  return (
    <section
      aria-label="Checkpoint progress"
      className="absolute left-3 top-28 z-20 w-64 max-w-[calc(100%-1.5rem)] rounded border border-metal-light bg-slate-950/90 p-3 text-sm text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
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

function RoundStatus({ state, players, currentPlayerId, isReplaying }: RoundStatusProps) {
  if (isReplaying) {
    return (
      <section
        aria-live="polite"
        className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-1.5 text-sm text-slate-200 shadow-lg"
      >
        <span className="font-black text-cyan-300">Round {state.round - 1}</span>
        <span className="mx-2 text-slate-500">•</span>
        Resolving moves…
      </section>
    );
  }

  const waitingFor = players.filter((player) => !state.lockedInPlayerIds.includes(player.playerId));
  const isYourTurn = waitingFor.some((player) => player.playerId === currentPlayerId);

  return (
    <section
      aria-live="polite"
      className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-sm text-slate-200 shadow-lg backdrop-blur-sm"
    >
      <span className="font-black text-cyan-300">Round {state.round}</span>
      <span className="text-slate-500">•</span>
      {isYourTurn ? (
        <>
          <span className="font-black text-cyan-300">Your turn</span>
          <span className="text-slate-300">Choose 5 cards</span>
        </>
      ) : waitingFor.length > 0 ? (
        <>
          <span className="text-slate-300">Waiting for</span>
          <span className="font-medium text-white">{waitingFor.map((player) => player.playerName).join(', ')}</span>
        </>
      ) : (
        <span className="text-slate-300">All players are ready</span>
      )}
    </section>
  );
}

export function RoomSession({ initialRoom, onLeft, onRoomChange }: RoomSessionProps) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState('');
  const [setupError, setSetupError] = useState('');
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

  const rosterPlayers = mapRobots
    .map((robot) => {
      const player = room.players.find((roomPlayer) => roomPlayer.playerId === robot.playerId);
      return player ? { ...player, avatarId: robot.avatarId } : null;
    })
    .filter((player): player is JoinedRoom['players'][number] & { avatarId: AvatarId } => player !== null)
    .sort((first, second) => Number(second.playerId === room.playerId) - Number(first.playerId === room.playerId));

  const { gameId, playerId } = initialRoom;

  const refreshRoom = useEffectEvent(async (signal: AbortSignal, version: number) => {
    const updated = await fetchRoom(initialRoom, signal);

    if (!signal.aborted && version === revision.current) {
      setRoom(updated);
      onRoomChange?.(updated);
      setError('');
    }
  });

  useEffect(() => {
    if (closed || !gameId || !playerId) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      const version = revision.current;

      try {
        if (!actionPending.current) {
          await refreshRoom(controller.signal, version);
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
  }, [gameId, playerId, closed]);

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

  async function handleLegacyStart(x: number, y: number) {
    if (actionPending.current) return;

    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setSetupError('');

    try {
      const updated = await selectStartTile(room, x, y);
      setRoom(updated);
      onRoomChange?.(updated);
    } catch {
      setSetupError('Could not select this start tile. Refresh and choose an available tile.');
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

  async function handleSetup(
    action: 'map' | 'start-tile',
    value: { mapId: string } | { mapId: string; position: { x: number; y: number } | null },
  ) {
    if (actionPending.current) return;

    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setSetupError('');

    try {
      const updated = await updateRoomSetup(room, action, value);
      setRoom(updated);
      onRoomChange?.(updated);
    } catch (cause) {
      setSetupError(
        cause instanceof RoomRequestError && cause.status === 409
          ? 'The tile is taken or the setup changed. Choose an available tile after the room refreshes.'
          : 'Could not update your selection. Please try again.',
      );
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
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded border border-metal-light bg-black/25 px-6 py-10 text-center shadow-lg">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hazard bg-hazard/15 text-2xl text-hazard">
          !
        </div>
        <div>
          <h2 className="m-0 text-2xl font-black uppercase">Room unavailable</h2>
          <p className="mb-0 mt-3 text-text-muted">This room has closed, or you are no longer a participant.</p>
        </div>
        <Button className="w-full max-w-sm" onClick={onLeft} size="large">
          Back to Menu
        </Button>
      </section>
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
              <Map
                layout={state.layout}
                width={state.width}
                height={state.height}
                tiles={state.tiles.map(toTileData)}
                robots={mapRobots}
                currentPlayerId={room.playerId}
              />
              <CheckpointProgress players={room.players} progress={state.checkpointProgress} />

              <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex flex-col items-center gap-1">
                {state.layout?.name && <div className="text-center text-sm font-semibold text-white">{state.layout.name}</div>}
                <RoundStatus state={state} players={room.players} currentPlayerId={room.playerId} isReplaying={isReplaying} />
              </div>

              <aside
                aria-label="Pilot robot legend"
                className="pointer-events-none absolute left-1/2 top-14 z-20 flex max-w-[calc(100%-12rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white shadow-lg backdrop-blur-sm"
              >
                <h2 className="m-0 shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Pilots</h2>
                <ul className="m-0 flex min-w-0 list-none items-center gap-4 border-l border-slate-700/80 pl-3">
                  {rosterPlayers.map((player) => (
                    <li key={player.playerId} className="flex min-w-0 items-center gap-2">
                      <img src={AVATAR_MAP[player.avatarId as AvatarId]} alt="" className="h-8 w-8 shrink-0 object-contain" />
                      <span
                        className={
                          player.playerId === room.playerId ? 'truncate font-bold text-cyan-200' : 'truncate text-slate-200'
                        }
                      >
                        {player.playerId === room.playerId ? 'You' : player.playerName}
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>

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

          {room.mapId || !room.startBoardConfig ? (
            <MapSelection
              room={room}
              disabled={busy}
              error={setupError}
              onMap={(mapId) => handleSetup('map', { mapId })}
              onStart={(position) => handleSetup('start-tile', { mapId: room.mapId!, position })}
            />
          ) : (
            <LegacyStartSelection room={room} disabled={busy} onSelect={handleLegacyStart} error={setupError} />
          )}

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
