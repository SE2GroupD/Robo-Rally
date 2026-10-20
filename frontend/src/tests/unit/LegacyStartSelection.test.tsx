import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LegacyStartSelection } from '../../features/game/components/room/map-selection/LegacyStartSelection';
import type { JoinedRoom } from '../../features/game/api/gameApi';

it('preserves standalone spawn selection, ownership and locking after game start', async () => {
  const room: JoinedRoom = {
    gameId: 'game',
    roomCode: 'ABC234',
    playerId: 'host',
    hostPlayerId: 'host',
    status: 'WAITING',
    players: [
      { playerId: 'host', playerName: 'Host', avatarId: null },
      { playerId: 'guest', playerName: 'Guest', avatarId: null, startPosition: { x: 1, y: 1 } },
    ],
    startBoardConfig: [
      { x: 1, y: 1, isSpawnPoint: true },
      { x: 1, y: 2, isSpawnPoint: true },
    ],
  };
  const onSelect = vi.fn();
  const { rerender } = render(<LegacyStartSelection room={room} disabled={false} error="" onSelect={onSelect} />);

  expect(screen.getByRole('button', { name: 'Start 1 · Guest' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Start 2 · Available' }));
  expect(onSelect).toHaveBeenCalledWith(1, 2);

  rerender(<LegacyStartSelection room={{ ...room, status: 'STARTED' }} disabled={false} error="" onSelect={onSelect} />);
  expect(screen.getByRole('button', { name: 'Start 2 · Available' })).toBeDisabled();
});
