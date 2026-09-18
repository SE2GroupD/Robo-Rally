import { useEffect, useRef, useState } from 'react';
import { fetchRoom, leaveRoom, startRoom, RoomRequestError, type JoinedRoom } from '../../api/gameApi';
import { Button } from '../../../../foundation/components/button/Button';
import { Map } from '../map/Map';
import { useRobotMovement } from '../../hooks/useRobotMovement';
import { ProgrammingPhase } from '../programming/ProgrammingPhase';

interface RoomSessionProps {
  initialRoom: JoinedRoom;
  onLeft: () => void;
}

export function RoomSession({ initialRoom, onLeft }: RoomSessionProps) {
  const { robot, runProgram } = useRobotMovement();
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const actionPending = useRef(false);
  const revision = useRef(0);
  const isHost = room.playerId === room.hostPlayerId;

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
        <Button onClick={onLeft}>Back to Menu</Button>
      </>
    );

  return (
    <>
      {error && (
        <p role="alert" className="m-0 text-hazard">
          {error}
        </p>
      )}
      {busy && <output className="m-0">Updating room…</output>}
      {room.status === 'STARTED' && isHost ? (
        <div className="relative h-[75dvh] overflow-hidden bg-slate-950">
          <Map robot={robot} />
          <div className="pointer-events-none absolute inset-0 z-10">
            <ProgrammingPhase roomId={room.gameId} playerId={room.playerId} onLockIn={runProgram} />
          </div>
        </div>
      ) : (
        <>
          <section className="rounded border border-metal-light p-4 text-center">
            <h2 className="m-0 text-sm font-bold text-text-muted">Room code</h2>
            <p className="my-3 select-text text-3xl font-bold tracking-widest">{room.roomCode}</p>
            {room.status === 'WAITING' && (
              <>
                <Button className="w-full" onClick={copyCode} variant="secondary">
                  Copy Code
                </Button>
                <p className="mb-0 mt-3 text-sm text-text-muted">Share this code so friends can join.</p>
                <output className="mb-0 mt-2 text-sm">{copyMessage}</output>
              </>
            )}
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
          {!isHost && (
            <output className="m-0 text-center text-text-muted">
              {room.status === 'STARTED'
                ? 'The host is running a training game.'
                : 'Waiting for the host to start. Only the host can play this run.'}
            </output>
          )}
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
