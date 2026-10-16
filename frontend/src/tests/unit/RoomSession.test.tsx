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

const boardState: BoardStateDto = {
  gameId: 'game-1',
  width: 12,
  height: 12,
  robots: [],
  tiles: [],
  round: 1,
  lockedInPlayerIds: [],
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

  it('starts alone and passes actual identifiers to the game', async () => {
    vi.mocked(startRoom).mockResolvedValue({ ...host, status: 'STARTED' });

    render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Start Battle' }));

    expect(await screen.findByText('Game board')).toBeInTheDocument();
    expect(await screen.findByText('game-1/round-1')).toBeInTheDocument();
    expect(fetchBoardState).toHaveBeenCalledWith('game-1', expect.any(AbortSignal));
    expect(startRoom).toHaveBeenCalledWith(host);
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
