import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { fetchRoom, leaveRoom, RoomRequestError, type JoinedRoom } from '../api/gameApi';

interface RoomSessionOptions {
  initialRoom: JoinedRoom;
  onLeft: () => void;
  onRoomChange?: (room: JoinedRoom) => void;
}

export function useRoomSession({ initialRoom, onLeft, onRoomChange }: RoomSessionOptions) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const actionPending = useRef(false);
  const revision = useRef(0);
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

  async function runAction(action: () => Promise<JoinedRoom | void>, onError: (cause: unknown) => void) {
    if (actionPending.current || closed) return;
    actionPending.current = true;
    revision.current += 1;
    setBusy(true);
    setError('');
    try {
      const updated = await action();
      if (updated) {
        setRoom(updated);
        onRoomChange?.(updated);
      }
    } catch (cause) {
      if (cause instanceof RoomRequestError && [403, 404].includes(cause.status)) setClosed(true);
      else onError(cause);
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }
  async function leave() {
    await runAction(
      async () => {
        await leaveRoom(room);
        onLeft();
      },
      () => setError('Could not leave. Please try again.'),
    );
  }
  return { room, error, closed, busy, runAction, setError, leave };
}
