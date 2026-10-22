import userEvent from '@testing-library/user-event';
import type * as RoomApi from '../../features/game/api/gameApi';
import { act, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GamePage } from '../../features/game/pages/GamePage';
import { fetchRoom, fetchBoardState, leaveRoom, RoomRequestError, type JoinedRoom } from '../../features/game/api/gameApi';
import type { BoardStateDto } from '../../features/game/types/GameStateDto';

vi.mock('../../features/game/api/gameApi', async (original) => ({
  ...(await original<typeof RoomApi>()),
  fetchRoom: vi.fn(),
  fetchBoardState: vi.fn(),
  startRoom: vi.fn(),
  leaveRoom: vi.fn(),
}));

vi.mock('../../features/game/components/map/Map', () => ({
  Map: () => <div>Game board</div>,
}));

vi.mock('../../features/game/components/programming/ProgrammingPhase', () => ({
  ProgrammingPhase: ({ roomId, round }: { roomId: string; round: number | null }) => <div>{`${roomId}/round-${round}`}</div>,
}));

vi.mock('@neondatabase/neon-js/auth', () => ({
  createAuthClient: () => ({
    getSession: vi.fn().mockResolvedValue({
      data: { session: { token: 'mock-jwt-token' } },
      error: null,
    }),
  }),
}));

const host: JoinedRoom = {
  gameId: 'game-1',
  roomCode: 'ABC234',
  playerId: 'host-1',
  hostPlayerId: 'host-1',
  status: 'WAITING',
  players: [{ playerId: 'host-1', playerName: 'Host', avatarId: null }],
};

const boardState: BoardStateDto = {
  winner: null,
  gameId: 'game-1',
  width: 12,
  height: 12,
  robots: [],
  tiles: [],
  round: 1,
  lockedInPlayerIds: [],
  checkpointProgress: [{ playerId: 'host-1', nextCheckpoint: 1, completedCheckpoints: [] }],
  totalCheckpoints: 4,
  lastResolution: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchRoom).mockResolvedValue(host);
  vi.mocked(fetchBoardState).mockResolvedValue(boardState);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('active game', () => {
  it('shows guests the same game as the host, without a start button', async () => {
    const guest = {
      ...host,
      playerId: 'guest',
      players: [...host.players, { playerId: 'guest', playerName: 'Friend', avatarId: null }],
    };

    vi.mocked(fetchRoom).mockResolvedValue({ ...guest, status: 'STARTED' });

    render(<GamePage room={guest} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('Game board')).toBeInTheDocument();
    expect(screen.getByText('game-1/round-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Battle' })).not.toBeInTheDocument();
  });

  it('shows the current player when it is their turn', async () => {
    vi.mocked(fetchRoom).mockResolvedValue({ ...host, status: 'STARTED' });

    render(<GamePage room={{ ...host, status: 'STARTED' }} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('Your turn')).toBeInTheDocument();
    expect(screen.getByText('Choose 5 cards')).toBeInTheDocument();
  });

  it('shows pilots from live robot assignments even when room avatars are unavailable', async () => {
    vi.mocked(fetchRoom).mockResolvedValue({ ...host, status: 'STARTED' });
    vi.mocked(fetchBoardState).mockResolvedValue({
      ...boardState,
      robots: [{ playerId: 'host-1', x: 1, y: 1, direction: 'NORTH' }],
    });

    render(<GamePage room={{ ...host, status: 'STARTED' }} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText('Pilot robot legend')).toHaveTextContent('You'));
  });

  it('shows checkpoint progress for every player', async () => {
    const room = {
      ...host,
      status: 'STARTED' as const,
      players: [...host.players, { playerId: 'guest-1', playerName: 'Friend', avatarId: null }],
    };
    vi.mocked(fetchRoom).mockResolvedValue(room);
    vi.mocked(fetchBoardState).mockResolvedValue({
      ...boardState,
      checkpointProgress: [
        { playerId: 'host-1', nextCheckpoint: 2, completedCheckpoints: [1] },
        { playerId: 'guest-1', nextCheckpoint: 1, completedCheckpoints: [] },
      ],
    });

    render(<GamePage room={room} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByRole('region', { name: 'Checkpoint progress' })).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Next 2')).toBeInTheDocument();
    expect(screen.getByText('1 out of 4 checkpoints completed')).toBeInTheDocument();
    expect(screen.getByText('Claimed: 1')).toBeInTheDocument();
    expect(screen.getByText('Friend')).toBeInTheDocument();
    expect(screen.getByText('Next 1')).toBeInTheDocument();
    expect(screen.getByText('0 out of 4 checkpoints completed')).toBeInTheDocument();
    expect(screen.getByText('Claimed: None')).toBeInTheDocument();
  });

  it('shows the winner and hides programming after the match is complete', async () => {
    const room = {
      ...host,
      status: 'STARTED' as const,
      players: [{ ...host.players[0], avatarId: 3 }],
    };
    vi.mocked(fetchRoom).mockResolvedValue(room);
    vi.mocked(fetchBoardState).mockResolvedValue({
      ...boardState,
      winner: { playerId: 'host-1' },
    });

    render(<GamePage room={room} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByRole('region', { name: 'Match winner' })).toBeInTheDocument();
    expect(screen.getByText('Host · Robot 3')).toBeInTheDocument();
    expect(screen.queryByText('game-1/round-1')).not.toBeInTheDocument();
    expect(screen.queryByText('Your turn')).not.toBeInTheDocument();
  });
});

it('preserves replay status and resumes programming after resolution', async () => {
  vi.useFakeTimers();
  const room = { ...host, status: 'STARTED' as const };
  vi.mocked(fetchRoom).mockResolvedValue(room);
  vi.mocked(fetchBoardState)
    .mockResolvedValueOnce(boardState)
    .mockResolvedValue({
      ...boardState,
      round: 2,
      lastResolution: { round: 1, startingRobots: [], steps: [] },
    });
  const { unmount } = render(<GamePage room={room} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);
  await act(async () => {});
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(screen.getByText('Resolving moves…')).toBeInTheDocument();
  expect(screen.getByText('game-1/round-null')).toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
  expect(screen.getByText('game-1/round-2')).toBeInTheDocument();
  expect(screen.queryByText('Resolving moves…')).not.toBeInTheDocument();
  const roomSignal = vi.mocked(fetchRoom).mock.calls[0][1];
  const boardSignal = vi.mocked(fetchBoardState).mock.calls[0][1];
  unmount();
  expect(roomSignal.aborted).toBe(true);
  expect(boardSignal?.aborted).toBe(true);
});

it('shows ready pilots from the server state', async () => {
  const room = { ...host, status: 'STARTED' as const };
  vi.mocked(fetchRoom).mockResolvedValue(room);
  vi.mocked(fetchBoardState).mockResolvedValue({
    ...boardState,
    robots: [{ playerId: 'host-1', x: 1, y: 1, direction: 'NORTH' }],
    lockedInPlayerIds: ['host-1'],
  });
  render(<GamePage room={room} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);
  expect(await screen.findByTitle('Ready')).toBeInTheDocument();
  expect(screen.getByText('All players are ready')).toBeInTheDocument();
});

it('keeps the game open after a failed leave and allows retry', async () => {
  const room = { ...host, status: 'STARTED' as const };
  const onBack = vi.fn();
  vi.mocked(fetchRoom).mockResolvedValue(room);
  vi.mocked(leaveRoom).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  render(<GamePage room={room} isStarting={false} error="" onRetry={vi.fn()} onBack={onBack} />);
  await userEvent.click(screen.getByRole('button', { name: 'Leave Room' }));
  expect(await screen.findByText('Could not leave. Please try again.')).toBeInTheDocument();
  expect(onBack).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Leave Room' }));
  await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
});

it('shows room closure during a running game', async () => {
  vi.mocked(fetchRoom).mockRejectedValue(new RoomRequestError('gone', 404));
  render(<GamePage room={{ ...host, status: 'STARTED' }} isStarting={false} error="" onRetry={vi.fn()} onBack={vi.fn()} />);
  expect(await screen.findByText('Room unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Game board')).not.toBeInTheDocument();
});
