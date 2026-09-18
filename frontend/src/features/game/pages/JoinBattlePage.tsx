import { useRef, useState, type SubmitEvent } from 'react';
import roboRallyImage from '../../../assets/hero.png';
import { Button } from '../../../foundation/components/button/Button';
import { TextInput } from '../../../foundation/components/text-input/TextInput';
import { MenuScreen } from '../../../shared/components/menu-screen/MenuScreen';
import { RoomSession } from '../components/room/RoomSession';
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

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
      setError(
        cause instanceof Error && !(cause instanceof SyntaxError) ? cause.message : 'Could not join the room. Please try again.',
      );
    } finally {
      joining.current = false;
      setIsJoining(false);
    }
  }

  return (
    <MenuScreen img={roboRallyImage} subtitle={`Pilot ${username}`} title={room ? 'Battle Room' : 'Join Battle'}>
      {room ? (
        <RoomSession initialRoom={room} onLeft={onBack} />
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <p className="m-0 text-center text-text-muted">Enter the room code shared by your host.</p>
          <TextInput
            label="Room code"
            name="roomCode"
            value={roomCode}
            onChange={(event) => {
              setRoomCode(event.target.value);
              setError('');
            }}
            disabled={isJoining}
            autoComplete="off"
            spellCheck={false}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'join-error' : undefined}
          />
          {error && (
            <p id="join-error" role="alert" className="m-0 text-sm text-hazard">
              {error}
            </p>
          )}
          {isJoining && <output className="m-0 text-center">Joining room…</output>}
          <Button className="w-full" type="submit" size="large" disabled={isJoining}>
            {error ? 'Try Again' : 'Join Room'}
          </Button>
        </form>
      )}
      {!room && (
        <Button className="w-full" onClick={onBack} disabled={isJoining} variant="secondary">
          Back to Menu
        </Button>
      )}
    </MenuScreen>
  );
}
