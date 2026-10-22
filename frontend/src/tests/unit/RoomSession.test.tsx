import { useState } from 'react';
import type * as RoomApi from '../../features/game/api/gameApi';
import { act, render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomSession } from '../../features/game/components/room/RoomSession';
import {
  fetchRoom,
  fetchBoardState,
  startRoom,
  leaveRoom,
  RoomRequestError,
  type JoinedRoom,
} from '../../features/game/api/gameApi';
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

const readyRoom: JoinedRoom = {
  gameId: 'game-1',
  roomCode: 'ABC234',
  playerId: 'host-1',
  hostPlayerId: 'host-1',
  status: 'WAITING',
  players: [
    { playerId: 'host-1', playerName: 'Host', avatarId: 1, startPosition: { x: 0, y: 1 } },
    { playerId: 'guest-1', playerName: 'Friend', avatarId: 2, startPosition: { x: 0, y: 2 } },
  ],
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

describe('room lifecycle', () => {
  it('keeps the polling interval when a parent returns fresh room objects and callbacks', async () => {
    vi.useFakeTimers();

    vi.mocked(fetchRoom).mockImplementation(async () => {
      // Bound a regression's immediate loop so the test fails instead of hanging.
      if (vi.mocked(fetchRoom).mock.calls.length > 5) return new Promise(() => {});

      return { ...host, players: [...host.players] };
    });

    function StatefulLobby() {
      const [room, setRoom] = useState(host);

      return <RoomSession initialRoom={room} onLeft={() => {}} onRoomChange={(updated) => setRoom(updated)} />;
    }

    const { unmount } = render(<StatefulLobby />);

    await act(async () => {});
    expect(fetchRoom).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1999);
    });
    expect(fetchRoom).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchRoom).toHaveBeenCalledTimes(2);

    const signal = vi.mocked(fetchRoom).mock.calls[1][1];
    unmount();
    expect(signal?.aborted).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(fetchRoom).toHaveBeenCalledTimes(2);
  });

  it('refreshes the host player list and aborts polling on unmount', async () => {
    vi.mocked(fetchRoom).mockResolvedValue({
      ...host,
      players: [...host.players, { playerId: 'guest', playerName: 'Friend', avatarId: null }],
    });

    const { unmount } = render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);

    expect(await screen.findByText('Friend')).toBeInTheDocument();

    const signal = vi.mocked(fetchRoom).mock.calls[0][1];
    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('starts the match when all players are ready and passes actual identifiers to the game', async () => {
    vi.mocked(fetchRoom).mockResolvedValue(readyRoom);
    vi.mocked(startRoom).mockResolvedValue({ ...readyRoom, status: 'STARTED' });

    render(<RoomSession initialRoom={readyRoom} onLeft={vi.fn()} />);

    expect(screen.queryByText(/Waiting for/i)).not.toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: 'Start Battle' });
    expect(startButton).not.toBeDisabled();

    await userEvent.click(startButton);

    expect(await screen.findByText('Game board')).toBeInTheDocument();
    expect(await screen.findByText('game-1/round-1')).toBeInTheDocument();
    expect(fetchBoardState).toHaveBeenCalledWith('game-1', expect.any(AbortSignal));
    expect(startRoom).toHaveBeenCalledWith(readyRoom);
  });

  it('disables Start Battle and explains when fewer than 2 players are present', async () => {
    render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);

    expect(screen.getByText('Waiting for at least 2 players to join.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
    expect(screen.getByText('No robot')).toBeInTheDocument();
    expect(screen.getByText('No tile')).toBeInTheDocument();
    expect(screen.getByText('Not ready')).toBeInTheDocument();
  });

  it('disables Start Battle and lists players missing robot or start tile', async () => {
    const unreadyRoom: JoinedRoom = {
      ...host,
      players: [
        { playerId: 'host-1', playerName: 'Host', avatarId: 1, startPosition: null },
        { playerId: 'guest-1', playerName: 'Alice', avatarId: null, startPosition: { x: 0, y: 1 } },
      ],
    };
    vi.mocked(fetchRoom).mockResolvedValue(unreadyRoom);

    render(<RoomSession initialRoom={unreadyRoom} onLeft={vi.fn()} />);

    expect(screen.getByText('Waiting for Host to select a start tile, Alice to select a robot.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
  });

  it('displays readiness badges for all players in the lobby', async () => {
    render(<RoomSession initialRoom={readyRoom} onLeft={vi.fn()} />);

    expect(screen.getByText('Robot 1')).toBeInTheDocument();
    expect(screen.getByText('Robot 2')).toBeInTheDocument();
    expect(screen.getAllByText('Tile')).toHaveLength(2);
    expect(screen.getAllByText('Ready')).toHaveLength(2);
  });

  it('shows guests the same game as the host, without a start button', async () => {
    const guest = {
      ...host,
      playerId: 'guest',
      players: [...host.players, { playerId: 'guest', playerName: 'Friend', avatarId: null }],
    };

    vi.mocked(fetchRoom).mockResolvedValue({ ...guest, status: 'STARTED' });

    render(<RoomSession initialRoom={guest} onLeft={vi.fn()} />);

    expect(await screen.findByText('Game board')).toBeInTheDocument();
    expect(screen.getByText('game-1/round-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Battle' })).not.toBeInTheDocument();
  });

  it('shows the current player when it is their turn', async () => {
    vi.mocked(fetchRoom).mockResolvedValue({ ...host, status: 'STARTED' });

    render(<RoomSession initialRoom={{ ...host, status: 'STARTED' }} onLeft={vi.fn()} />);

    expect(await screen.findByText('Your turn')).toBeInTheDocument();
    expect(screen.getByText('Choose 5 cards')).toBeInTheDocument();
  });

  it('shows pilots from live robot assignments even when room avatars are unavailable', async () => {
    vi.mocked(fetchRoom).mockResolvedValue({ ...host, status: 'STARTED' });
    vi.mocked(fetchBoardState).mockResolvedValue({
      ...boardState,
      robots: [{ playerId: 'host-1', x: 1, y: 1, direction: 'NORTH' }],
    });

    render(<RoomSession initialRoom={{ ...host, status: 'STARTED' }} onLeft={vi.fn()} />);

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

    render(<RoomSession initialRoom={room} onLeft={vi.fn()} />);

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

    expect(await screen.findByText('This room has closed, or you are no longer a participant.')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Start Battle' })).not.toBeInTheDocument();
  });
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

  render(<RoomSession initialRoom={room} onLeft={vi.fn()} />);

  expect(await screen.findByRole('region', { name: 'Match winner' })).toBeInTheDocument();
  expect(screen.getByText('Host · Robot 3')).toBeInTheDocument();
  expect(screen.queryByText('game-1/round-1')).not.toBeInTheDocument();
  expect(screen.queryByText('Your turn')).not.toBeInTheDocument();
});

it('waits for every register to replay before showing the winner', async () => {
  vi.useFakeTimers();

  const room = {
    ...host,
    status: 'STARTED' as const,
    players: [{ ...host.players[0], avatarId: 3 }],
  };
  const robot = { playerId: 'host-1', x: 1, y: 1, direction: 'NORTH' as const };
  const winningState: BoardStateDto = {
    ...boardState,
    winner: { playerId: 'host-1' },
    robots: [robot],
    round: 2,
    lastResolution: {
      round: 1,
      startingRobots: [robot],
      steps: Array.from({ length: 5 }, (_, index) => ({
        registerNumber: index + 1,
        phases: [{ phase: 'CARD' as const, robots: [{ ...robot, card: 'TURN_LEFT' as const }] }],
      })),
    },
  };

  vi.mocked(fetchRoom).mockResolvedValue(room);
  vi.mocked(fetchBoardState)
    .mockResolvedValueOnce({ ...boardState, robots: [robot] })
    .mockResolvedValue(winningState);

  render(<RoomSession initialRoom={room} onLeft={vi.fn()} />);
  await act(async () => {});

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });

  expect(screen.getByText('Resolving moves…')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Match winner' })).not.toBeInTheDocument();
  expect(screen.queryByText('game-1/round-2')).not.toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1750);
  });

  expect(screen.getByText('Resolving moves…')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Match winner' })).not.toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });

  expect(screen.getByRole('region', { name: 'Match winner' })).toBeInTheDocument();
  expect(screen.getByText('Host · Robot 3')).toBeInTheDocument();
  expect(screen.queryByText('Resolving moves…')).not.toBeInTheDocument();
});
