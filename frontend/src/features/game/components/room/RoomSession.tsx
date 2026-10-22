import { LegacyStartSelection } from './map-selection/LegacyStartSelection';
import { MapSelection } from './map-selection/MapSelection';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  updateRoomSetup,
  setRoomVisibility,
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
import { RoomVisibility } from './RoomVisibility';
import type { AvatarId } from '../../types/Board';
import { useInGameSocket } from '../../hooks/useInGameSocket';
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
  totalCheckpoints,
}: {
  players: JoinedRoom['players'];
  progress: readonly CheckpointProgressDto[];
  totalCheckpoints: number;
}) {
  const progressByPlayer = new globalThis.Map(progress.map((entry) => [entry.playerId, entry]));

  return (
    <section
      aria-label="Checkpoint progress"
      className="absolute right-3 top-28 z-20 max-h-[calc(75dvh-8rem)] w-60 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded border border-metal-light bg-slate-950/90 p-3 text-sm text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
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
                {playerProgress?.completedCheckpoints.length ?? 0} out of {totalCheckpoints} checkpoints completed
              </p>
              <p className="m-0 mt-0.5 text-xs text-text-muted">
                Claimed: {playerProgress ? completedLabel(playerProgress) : 'None'}
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
  if (state.winner) return null;

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

function winnerLabel(state: BoardStateDto, players: JoinedRoom['players']) {
  if (!state.winner) return null;
  const winner = players.find((player) => player.playerId === state.winner?.playerId);
  return `${winner?.playerName ?? 'Unknown player'}${winner?.avatarId ? ` · Robot ${winner.avatarId}` : ''}`;
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

  async function handleVisibility(publicRoom: boolean) {
    if (actionPending.current || publicRoom === Boolean(room.publicRoom)) return;
    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setError('');
    try {
      const updated = await setRoomVisibility(room, publicRoom);
      setRoom(updated);
      onRoomChange?.(updated);
    } catch {
      setError('Could not change room visibility. Please try again.');
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

  function getStartBlockReason(): string | null {
    if (room.players.length < 2) {
      return 'Waiting for at least 2 players to join.';
    }
    const unready = room.players.filter((player) => player.avatarId == null || player.startPosition == null);
    if (unready.length > 0) {
      const details = unready.map((player) => {
        const missing: string[] = [];
        if (player.avatarId == null) missing.push('a robot');
        if (player.startPosition == null) missing.push('a start tile');
        return `${player.playerName} to select ${missing.join(' and ')}`;
      });
      return `Waiting for ${details.join(', ')}.`;
    }
    return null;
  }

  const startBlockReason = getStartBlockReason();
  const canStart = !startBlockReason;

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
              <CheckpointProgress
                players={room.players}
                progress={state.checkpointProgress}
                totalCheckpoints={state.totalCheckpoints}
              />

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
                  {rosterPlayers.map((player) => {
                    const isReady = state?.lockedInPlayerIds.includes(player.playerId) || readinessState[player.playerId];

                    return (
                      <li
                        key={player.playerId}
                        className={`flex min-w-0 items-center gap-2 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}
                      >
                        <div className="relative">
                          <img src={AVATAR_MAP[player.avatarId as AvatarId]} alt="" className="h-8 w-8 shrink-0 object-contain" />
                          {/* Badge overlay on the avatar */}
                          {isReady && (
                            <span
                              className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow ring-2 ring-slate-900"
                              title="Ready"
                            >
                              ✓
                            </span>
                          )}
                        </div>

                        <span
                          className={
                            player.playerId === room.playerId ? 'truncate font-bold text-cyan-200' : 'truncate text-slate-200'
                          }
                        >
                          {player.playerId === room.playerId ? 'You' : player.playerName}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </aside>
              {state.winner && !isReplaying ? (
                <section
                  aria-label="Match winner"
                  className="absolute inset-x-3 top-28 z-30 mx-auto max-w-sm rounded border border-metal-light bg-slate-950/95 p-4 text-center text-white shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
                >
                  <h2 className="m-0 text-sm font-bold text-metal-light">Winner</h2>
                  <p className="m-0 mt-2 text-xl font-bold">{winnerLabel(state, room.players)}</p>
                </section>
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
      ) : (
        <>
          <section className="rounded border border-metal-light p-4">
            <div>
              <h2 className="m-0 text-lg font-bold">Room code</h2>
              <p className="mb-0 mt-1 text-sm text-text-muted">Share with friends to invite them.</p>
            </div>

            <div className="mt-3 flex flex-col items-start gap-1">
              <div className="flex items-center gap-3 rounded border border-dotted border-metal px-3 py-2">
                <span className="select-text text-2xl font-bold tracking-widest">{room.roomCode}</span>
                <Button onClick={copyCode} size="small" variant="secondary">
                  Copy Code
                </Button>
              </div>
              <output className="min-h-5 text-xs text-text-muted">{copyMessage}</output>
            </div>
          </section>

          {isHost && <RoomVisibility publicRoom={Boolean(room.publicRoom)} disabled={busy} onChange={handleVisibility} />}

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
              {room.players.map((player) => {
                const hasRobot = player.avatarId !== null && player.avatarId !== undefined;
                const hasPosition = player.startPosition !== null && player.startPosition !== undefined;
                const isReady = hasRobot && hasPosition;

                return (
                  <li
                    key={player.playerId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/5 bg-slate-900/40 p-2.5"
                  >
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
                      <span className="font-medium text-white">{player.playerName}</span>
                      <span className="text-xs text-text-muted">
                        {player.playerId === room.hostPlayerId ? 'Host' : 'Guest'}
                        {player.playerId === room.playerId ? ' · You' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {hasRobot ? (
                        <span className="rounded border border-emerald-500/40 bg-emerald-950/70 px-2 py-0.5 text-xs text-emerald-300">
                          Robot {player.avatarId}
                        </span>
                      ) : (
                        <span className="rounded border border-amber-500/40 bg-amber-950/70 px-2 py-0.5 text-xs text-amber-300">
                          No robot
                        </span>
                      )}

                      {hasPosition ? (
                        <span className="rounded border border-emerald-500/40 bg-emerald-950/70 px-2 py-0.5 text-xs text-emerald-300">
                          Tile
                        </span>
                      ) : (
                        <span className="rounded border border-amber-500/40 bg-amber-950/70 px-2 py-0.5 text-xs text-amber-300">
                          No tile
                        </span>
                      )}

                      {isReady ? (
                        <span className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          Ready
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-500/50 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                          Not ready
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {!isHost && <output className="m-0 text-center text-text-muted">Waiting for the host to start the battle.</output>}

          {isHost && (
            <div className="flex flex-col gap-2">
              {startBlockReason && (
                <output className="m-0 text-center text-sm font-medium text-amber-400">{startBlockReason}</output>
              )}
              <Button size="large" disabled={busy || !canStart} onClick={() => handleAction('start')}>
                Start Battle
              </Button>
            </div>
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
