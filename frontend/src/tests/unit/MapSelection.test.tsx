import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MapCarusel } from '../../features/game/components/room/map-selection/MapCarusel';
import { MapSelection } from '../../features/game/components/room/map-selection/MapSelection';
import { defaultMapLayout } from '../fixtures/mapLayouts';
import type { JoinedRoom } from '../../features/game/api/gameApi';

vi.mock('../../features/game/hooks/useMapCatalog', () => ({
  useMapCatalog: () => ({ maps: [defaultMapLayout], loading: false, error: '', retry: vi.fn() }),
}));

afterEach(cleanup);

it('centres one map and hides navigation', () => {
  render(<MapCarusel maps={[defaultMapLayout]} selectedId="extra-crispy" disabled={false} onSelect={vi.fn()} />);
  expect(screen.getByText('Extra Crispy')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next map' })).not.toBeInTheDocument();
});

it('supports arrows, keyboard, swipe and at most three previews', async () => {
  const maps = Array.from({ length: 5 }, (_, i) => ({ ...defaultMapLayout, id: String(i), name: `Map ${i}` }));
  const select = vi.fn();
  const { container, rerender } = render(<MapCarusel maps={maps} selectedId="2" disabled={false} onSelect={select} />);
  expect(container.querySelectorAll('foreignObject')).toHaveLength(3);
  await userEvent.click(screen.getByRole('button', { name: 'Next map' }));
  expect(select).toHaveBeenLastCalledWith('3');
  fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' });
  expect(select).toHaveBeenLastCalledWith('1');
  fireEvent.pointerDown(screen.getByRole('region'), { clientX: 200 });
  fireEvent.pointerUp(screen.getByRole('region'), { clientX: 100 });
  expect(select).toHaveBeenLastCalledWith('3');
  rerender(<MapCarusel maps={maps} selectedId="2" disabled onSelect={select} />);
  select.mockClear();
  fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
  expect(select).not.toHaveBeenCalled();
});

it('shows reservations and submits only available or own start tiles', async () => {
  const room: JoinedRoom = {
    gameId: 'g',
    roomCode: 'ABC234',
    playerId: 'host',
    hostPlayerId: 'host',
    status: 'WAITING',
    mapId: 'extra-crispy',
    players: [
      { playerId: 'host', playerName: 'Host', avatarId: null },
      { playerId: 'guest', playerName: 'Guest', avatarId: null, startPosition: { x: 1, y: 1 } },
    ],
  };
  const onStart = vi.fn();
  render(<MapSelection room={room} disabled={false} error="" onMap={vi.fn()} onStart={onStart} />);
  expect(screen.getAllByRole('button', { name: 'Start 1 · Guest' }).every((button) => button.hasAttribute('disabled'))).toBe(
    true,
  );
  await userEvent.click(screen.getAllByRole('button', { name: 'Start 2 · Available' })[1]);
  expect(onStart).toHaveBeenLastCalledWith({ x: 0, y: 3 });
  await userEvent.click(screen.getByRole('button', { name: /Assign me/ }));
  expect(onStart).toHaveBeenLastCalledWith(null);
});
