import { useRef, useState, type FormEvent } from 'react';
import roboRallyImage from '../../assets/hero.png';
import { Button } from '../../foundation/components/button/Button';
import { TextInput } from '../../foundation/components/text-input/TextInput';
import { MenuScreen } from '../../shared/components/menu-screen/MenuScreen';
import { joinRoom, type JoinedRoom } from '../api/gameApi';

interface JoinBattlePageProps {
  username: string;
  room: JoinedRoom | null;
  onJoined: (room: JoinedRoom) => void;
  onBack: () => void;
}

export function JoinBattlePage({ username, room, onJoined, onBack }: JoinBattlePageProps) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const joining = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (joining.current) return;
    const code = roomCode.trim();
    if (!code) {
      setError('Enter a room code.');
      return;
    }

    joining.current = true;
    setIsJoining(true);
    setError('');
    try {
      onJoined(await joinRoom(code, username));
    } catch (cause) {
      setError(cause instanceof Error && !(cause instanceof SyntaxError)
        ? cause.message : 'Could not join the room. Please try again.');
    } finally {
      joining.current = false;
      setIsJoining(false);
    }
  }

  return (
    <MenuScreen img={roboRallyImage} subtitle={`Pilot ${username}`} title={room ? 'Battle Room' : 'Join Battle'}>
      {room ? (
        <>
          <section className="rounded border border-metal-light p-4 text-center">
            <h2 className="m-0 text-sm font-bold text-text-muted">Room code</h2>
            <p className="my-3 select-text text-3xl font-bold tracking-widest">{room.roomCode}</p>
          </section>
          <section className="rounded border border-metal-light p-4">
            <h2 className="mb-3 mt-0 text-lg font-bold">Players</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {room.players.map((player) => (
                <li key={player.playerId} className="flex items-center justify-between gap-3">
                  <span>{player.playerName}</span>
                  <span className="text-sm font-bold text-text-muted">
                    {player.playerId === room.hostPlayerId ? 'Host' : 'Guest'}
                    {player.playerId === room.playerId ? ' · You' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <p className="m-0 text-center text-text-muted">Only the host can play this run.</p>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <p className="m-0 text-center text-text-muted">Enter the room code shared by your host.</p>
          <TextInput
            label="Room code"
            name="roomCode"
            value={roomCode}
            onChange={(event) => { setRoomCode(event.target.value); setError(''); }}
            disabled={isJoining}
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'join-error' : undefined}
          />
          {error && <p id="join-error" role="alert" className="m-0 text-sm text-hazard">{error}</p>}
          {isJoining && <p role="status" className="m-0 text-center">Joining room…</p>}
          <Button className="w-full" type="submit" size="large" disabled={isJoining}>
            {error ? 'Try Again' : 'Join Room'}
          </Button>
        </form>
      )}
      <Button className="w-full" onClick={onBack} disabled={isJoining} variant="secondary">
        Back to Menu
      </Button>
    </MenuScreen>
  );
}
