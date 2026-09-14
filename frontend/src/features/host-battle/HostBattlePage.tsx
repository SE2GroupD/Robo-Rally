import { useState } from 'react';
import roboRallyImage from '../../assets/hero.png';
import { Button } from '../../foundation/components/button/Button';
import { MenuScreen } from '../../shared/components/menu-screen/MenuScreen';
import type { CreatedRoom } from '../api/gameApi';

interface HostBattlePageProps {
  username: string;
  room: CreatedRoom | null;
  isCreating: boolean;
  error: string;
  onRetry: () => void;
  onBack: () => void;
}

export function HostBattlePage({ username, room, isCreating, error, onRetry, onBack }: HostBattlePageProps) {
  const [copyMessage, setCopyMessage] = useState('');

  async function handleCopyCode() {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopyMessage('Room code copied.');
    } catch {
      setCopyMessage('Could not copy. Select and copy the code manually.');
    }
  }

  return (
    <MenuScreen img={roboRallyImage} subtitle={`Pilot ${username}`} title="Battle Room">
      {isCreating && <p role="status" className="m-0 text-center">Creating room…</p>}

      {error && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="m-0 text-center text-hazard">{error}</p>
          <Button className="w-full" onClick={onRetry} disabled={isCreating}>Retry</Button>
        </div>
      )}

      {room && (
        <>
          <section className="rounded border border-metal-light p-4 text-center">
            <h2 className="m-0 text-sm font-bold text-text-muted">Room code</h2>
            <p className="my-3 select-text text-3xl font-bold tracking-widest">{room.roomCode}</p>
            <Button className="w-full" onClick={handleCopyCode} variant="secondary">Copy Code</Button>
            <p className="mb-0 mt-3 text-sm text-text-muted">Share this code so friends can join.</p>
            <p role="status" className="mb-0 mt-2 text-sm text-text-muted">{copyMessage}</p>
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

          <Button className="w-full" disabled size="large">Start Battle</Button>
        </>
      )}

      <Button className="w-full" onClick={onBack} disabled={isCreating} variant="secondary">
        Back to Menu
      </Button>
    </MenuScreen>
  );
}
