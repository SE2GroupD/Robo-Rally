import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import roboRallyImage from '../../../assets/hero.png';
import { Button } from '../../../foundation/components/button/Button';
import { TextInput } from '../../../foundation/components/text-input/TextInput';
import { MenuScreen } from '../../../shared/components/menu-screen/MenuScreen';
import {
  createPublicRoom,
  joinPublicRoom,
  listPublicRooms,
  type CreatedRoom,
  type JoinedRoom,
  type PublicRoom,
} from '../api/gameApi';

interface StartPlatformPageProps {
  username: string;
  onBack: () => void;
  onCreated: (room: CreatedRoom) => void;
  onJoined: (room: JoinedRoom) => void;
}

export function StartPlatformPage({ username, onBack, onCreated, onJoined }: StartPlatformPageProps) {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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
    const refreshTimer = window.setInterval(() => void loadRooms(controller.signal, false), 5000);
    return () => {
      mounted.current = false;
      controller.abort();
      window.clearInterval(refreshTimer);
    };
  }, [loadRooms]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;
    if (!roomName.trim()) {
      setError('Enter a name for your public room.');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      onCreated(await createPublicRoom(roomName, username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create a public room.');
      setIsCreating(false);
    }
  }

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
      <p className="m-0 text-center text-text-muted">Find a public match or host one for other pilots.</p>
      {error && (
        <p className="m-0 text-center text-sm text-hazard" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded border border-metal-dark bg-black/15 p-4" aria-labelledby="public-rooms-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-black uppercase" id="public-rooms-heading">
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
          <div className="mt-4 flex flex-col gap-3" aria-live="polite">
            {!isLoading && rooms.length === 0 && <p className="m-0 text-text-muted">No public rooms are waiting for players.</p>}
            {rooms.map((room) => (
              <article
                className="flex items-center justify-between gap-3 rounded border border-metal-dark bg-input-bg p-3"
                key={room.gameId}
              >
                <div>
                  <h3 className="m-0 font-bold">{room.roomName}</h3>
                  <p className="m-1 text-sm text-text-muted">
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

        <form className="rounded border border-metal-dark bg-black/15 p-4" onSubmit={handleCreate} noValidate>
          <h2 className="m-0 text-xl font-black uppercase">Host a public room</h2>
          <p className="mt-2 text-sm text-text-muted">
            Your room will appear in the public list while it is waiting for players.
          </p>
          <div className="mt-4">
            <TextInput
              disabled={isCreating}
              label="Room name"
              maxLength={40}
              name="roomName"
              onChange={(event) => {
                setRoomName(event.target.value);
                setError('');
              }}
              placeholder="e.g. Friday factory race"
              required
              value={roomName}
            />
          </div>
          <Button className="mt-4 w-full" disabled={isCreating} size="large" type="submit">
            {isCreating ? 'Creating room…' : 'Create public room'}
          </Button>
        </form>
      </div>
      <Button className="w-full" disabled={isCreating || Boolean(joiningGameId)} onClick={onBack} variant="secondary">
        Back to Menu
      </Button>
    </MenuScreen>
  );
}
