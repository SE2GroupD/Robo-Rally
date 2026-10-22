import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HostBattlePage } from '../../features/game/pages/HostBattlePage';
import { JoinBattlePage } from '../../features/game/pages/JoinBattlePage';
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
  setRoomVisibility,
  selectRobot,
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
  setRoomVisibility: vi.fn(),
  selectRobot: vi.fn(),
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

  it('starts a ready match and reports the started room without rendering gameplay', async () => {
    const started = { ...readyRoom, status: 'STARTED' as const };
    vi.mocked(fetchRoom).mockResolvedValue(readyRoom);
    const onRoomChange = vi.fn();
    vi.mocked(startRoom).mockResolvedValue(started);
    render(<RoomSession initialRoom={readyRoom} onLeft={vi.fn()} onRoomChange={onRoomChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
    await waitFor(() => expect(onRoomChange).toHaveBeenCalledWith(started));
    expect(startRoom).toHaveBeenCalledWith(readyRoom);
    expect(fetchBoardState).not.toHaveBeenCalled();
    expect(screen.queryByText('Game board')).not.toBeInTheDocument();
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

it('keeps the mutation result when an older room poll completes later', async () => {
  let finishPoll!: (room: JoinedRoom) => void;
  vi.mocked(fetchRoom).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishPoll = resolve;
      }),
  );
  vi.mocked(setRoomVisibility).mockResolvedValue({ ...host, publicRoom: true });
  render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Public' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Public' })).toHaveAttribute('aria-pressed', 'true'));
  await act(async () => finishPoll({ ...host, publicRoom: false }));
  expect(screen.getByRole('button', { name: 'Public' })).toHaveAttribute('aria-pressed', 'true');
});

it('locks other room actions while a visibility change is pending', async () => {
  let finish!: (room: JoinedRoom) => void;
  vi.mocked(setRoomVisibility).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.mocked(fetchRoom).mockResolvedValue(readyRoom);
  render(<RoomSession initialRoom={readyRoom} onLeft={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Public' }));
  expect(screen.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Leave Room' })).toBeDisabled();
  await act(async () => finish({ ...readyRoom, publicRoom: true }));
  expect(screen.getByRole('button', { name: 'Start Battle' })).toBeEnabled();
});

it('copies the room code and reports clipboard failure', async () => {
  const user = userEvent.setup();
  const copy = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('blocked'));
  render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Copy Code' }));
  expect(copy).toHaveBeenCalledWith('ABC234');
  expect(screen.getByText('Room code copied.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Copy Code' }));
  expect(screen.getByText('Could not copy. Select and copy the code manually.')).toBeInTheDocument();
});

it('updates the player section after choosing a robot', async () => {
  vi.mocked(selectRobot).mockResolvedValue({ ...host, players: [{ ...host.players[0], avatarId: 2 }] });
  render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /Robot 2/i }));
  await waitFor(() => expect(selectRobot).toHaveBeenCalledWith(host, 2));
  expect(screen.getByRole('button', { name: /Robot 2/i })).toHaveAttribute('aria-pressed', 'true');
});

it.each(['host', 'guest'])('navigates the %s lobby to the game when the room starts', async (role) => {
  const initial =
    role === 'host'
      ? host
      : { ...host, playerId: 'guest', players: [...host.players, { playerId: 'guest', playerName: 'Guest', avatarId: null }] };
  vi.mocked(fetchRoom).mockResolvedValue({ ...initial, status: 'STARTED' });
  function Lobby() {
    const [room, setRoom] = useState(initial);
    return role === 'host' ? (
      <HostBattlePage
        username="Host"
        room={room}
        isCreating={false}
        error=""
        onRetry={vi.fn()}
        onBack={vi.fn()}
        onRoomChange={setRoom}
      />
    ) : (
      <JoinBattlePage username="Guest" room={room} onJoined={setRoom} onBack={vi.fn()} onRoomChange={setRoom} />
    );
  }
  render(
    <MemoryRouter initialEntries={['/lobby']}>
      <Routes>
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<div>Active game route</div>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText('Active game route')).toBeInTheDocument();
});

it('updates readiness from polling and disables starting again after a player loses their selection', async () => {
  vi.useFakeTimers();
  vi.mocked(fetchRoom)
    .mockResolvedValueOnce(readyRoom)
    .mockResolvedValueOnce({ ...readyRoom, players: readyRoom.players.map((player) => ({ ...player, startPosition: null })) });
  render(<RoomSession initialRoom={host} onLeft={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
  await act(async () => {});
  expect(screen.getByRole('button', { name: 'Start Battle' })).toBeEnabled();
  expect(screen.getAllByText('Ready')).toHaveLength(2);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(screen.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
  expect(screen.getAllByText('No tile')).toHaveLength(2);
  expect(startRoom).not.toHaveBeenCalled();
});
