import { useCallback, useEffect, useRef, useState } from 'react';
import roboRallyImage from '../../../assets/hero.png';
import { Button } from '../../../foundation/components/button/Button';
import { MenuScreen } from '../../../shared/components/menu-screen/MenuScreen';
import { joinPublicRoom, listPublicRooms, type JoinedRoom, type PublicRoom } from '../api/gameApi';

interface StartPlatformPageProps {
  username: string;
  onBack: () => void;
  onJoined: (room: JoinedRoom) => void;
}

export function StartPlatformPage({ username, onBack, onJoined }: StartPlatformPageProps) {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const mounted = useRef(true);

  const loadRooms = useCallback(async (signal?: AbortSignal, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setError('');
    }
    try {
      const publicRooms = await listPublicRooms(signal);
      if (mounted.current && !signal?.aborted) setRooms(publicRooms);
    } catch (cause) {
      if (mounted.current && !signal?.aborted) {
        setError(cause instanceof Error ? cause.message : 'Could not load public rooms.');
      }
    } finally {
      if (showLoading && mounted.current && !signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void Promise.resolve().then(() => loadRooms(controller.signal));
    const refreshTimer = window.setInterval(() => void loadRooms(undefined, false), 5000);
    return () => {
      mounted.current = false;
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, [loadRooms]);

  async function handleJoin(room: PublicRoom) {
    if (joiningGameId) return;
    setJoiningGameId(room.gameId);
    setError('');
    try {
      onJoined(await joinPublicRoom(room.gameId, username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not join the room.');
      setJoiningGameId(null);
      void loadRooms();
    }
  }

  return (
    <MenuScreen img={roboRallyImage} panelClassName="max-w-5xl" subtitle={`Pilot ${username}`} title="Start Platform">
      <p className="m-0 text-sm text-text-muted">Find a public match. To host one, choose Public in your Battle Room.</p>
      {error && (
        <p className="m-0 text-sm text-hazard" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-5">
        <section className="rounded border border-metal-light p-4" aria-labelledby="public-rooms-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-bold" id="public-rooms-heading">
              Public rooms
            </h2>
            <Button
              disabled={isLoading || Boolean(joiningGameId)}
              onClick={() => void loadRooms()}
              size="small"
              variant="secondary"
            >
              {isLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-3" aria-live="polite">
            {!isLoading && rooms.length === 0 && <p className="m-0 text-text-muted">No public rooms are waiting for players.</p>}
            {rooms.map((room) => (
              <article
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-metal-dark bg-black/15 p-3"
                key={room.gameId}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 break-words font-bold">{room.roomName}</h3>
                  <p className="mb-0 mt-1 text-sm text-text-muted">
                    Host: {room.hostPlayerName} · {room.playerCount}/{room.maxPlayers} pilots
                  </p>
                </div>
                <Button disabled={Boolean(joiningGameId)} onClick={() => void handleJoin(room)} size="small">
                  {joiningGameId === room.gameId ? 'Joining…' : 'Join'}
                </Button>
              </article>
            ))}
          </div>
        </section>
      </div>
      <Button className="w-full" disabled={Boolean(joiningGameId)} onClick={onBack} variant="secondary">
        Back to Menu
      </Button>
    </MenuScreen>
  );
}
