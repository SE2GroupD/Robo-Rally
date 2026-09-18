import type * as RoomApi from '../../features/game/api/gameApi';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomSession } from '../../features/game/components/room/RoomSession';
import { fetchRoom, startRoom, leaveRoom, RoomRequestError, type JoinedRoom } from '../../features/game/api/gameApi';

vi.mock('../../features/game/api/gameApi', async (original) => ({
  ...(await original<typeof RoomApi>()),
  fetchRoom: vi.fn(),
  startRoom: vi.fn(),
  leaveRoom: vi.fn(),
}));
vi.mock('../../features/game/components/map/Map', () => ({ Map: () => <div>Game board</div> }));
vi.mock('../../features/game/components/programming/ProgrammingPhase', () => ({
  ProgrammingPhase: ({ roomId, playerId }: { roomId: string; playerId: string }) => (
    <div>
      {roomId}/{playerId}
    </div>
  ),
}));
const host: JoinedRoom = {
  gameId: 'game-1',
  roomCode: 'ABC234',
  playerId: 'host-1',
  hostPlayerId: 'host-1',
  status: 'WAITING',
  players: [{ playerId: 'host-1', playerName: 'Host' }],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchRoom).mockResolvedValue(host);
});
afterEach(cleanup);

describe('room lifecycle', () => {
  it('refreshes the host player list and aborts polling on unmount', async () => {
    vi.mocked(fetchRoom).mockResolvedValue({ ...host, players: [...host.players, { playerId: 'guest', playerName: 'Friend' }] });
    const { unmount } = render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
    expect(await screen.findByText('Friend')).toBeInTheDocument();
    const signal = vi.mocked(fetchRoom).mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('starts alone and passes actual identifiers to the game', async () => {
    vi.mocked(startRoom).mockResolvedValue({ ...host, status: 'STARTED' });
    render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
    expect(await screen.findByText('Game board')).toBeInTheDocument();
    expect(screen.getByText('game-1/host-1')).toBeInTheDocument();
    expect(startRoom).toHaveBeenCalledWith(host);
  });

  it('shows guests the started status without game controls', async () => {
    const guest = { ...host, playerId: 'guest', players: [...host.players, { playerId: 'guest', playerName: 'Friend' }] };
    vi.mocked(fetchRoom).mockResolvedValue({ ...guest, status: 'STARTED' });
    render(<RoomSession initialRoom={guest} onLeft={vi.fn()} />);
    expect(await screen.findByText('The host is running a training game.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Battle' })).not.toBeInTheDocument();
    expect(screen.queryByText('Game board')).not.toBeInTheDocument();
  });

  it('only exits after leaving succeeds and allows retry after failure', async () => {
    const onLeft = vi.fn();
    vi.mocked(leaveRoom).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    render(<RoomSession initialRoom={host} onLeft={onLeft} />);
    await userEvent.click(screen.getByRole('button', { name: 'Leave Room' }));
    expect(await screen.findByText('Could not leave. Please try again.')).toBeInTheDocument();
    expect(onLeft).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Leave Room' }));
    await waitFor(() => expect(onLeft).toHaveBeenCalledOnce());
  });

  it('shows closure after the host leaves or the backend loses the room', async () => {
    vi.mocked(fetchRoom).mockRejectedValue(new RoomRequestError('gone', 404));
    render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
    expect(await screen.findByText('This room has closed or you are no longer a participant.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Battle' })).not.toBeInTheDocument();
  });
});
