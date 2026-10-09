import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGameReplay } from '../../features/game/hooks/useGameReplay';
import type { BoardStateDto, TurnResolutionDto } from '../../features/game/types/GameStateDto';

const start = { playerId: 'A', x: 1, y: 1, direction: 'EAST' as const };

const resolution: TurnResolutionDto = {
  round: 1,
  startingRobots: [start],
  steps: [
    {
      registerNumber: 1,
      phases: [
        { phase: 'CARD', robots: [{ playerId: 'A', card: 'MOVE_2', x: 3, y: 1, direction: 'EAST' }] },
        { phase: 'BELT', robots: [{ playerId: 'A', card: null, x: 3, y: 2, direction: 'SOUTH' }] },
      ],
    },
  ],
};

const before: BoardStateDto = {
  gameId: 'g',
  width: 12,
  height: 12,
  robots: [start],
  tiles: [],
  round: 1,
  lockedInPlayerIds: [],
  lastResolution: null,
};
const after: BoardStateDto = {
  ...before,
  round: 2,
  robots: [{ playerId: 'A', x: 3, y: 2, direction: 'SOUTH' }],
  lastResolution: resolution,
};

const tick = () => act(async () => void (await vi.advanceTimersByTimeAsync(350)));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('replays card movement tile by tile, then the belt phase, then settles on the server state', async () => {
  const { result, rerender } = renderHook(({ s }) => useGameReplay(s), { initialProps: { s: before } });
  expect(result.current.robots).toEqual([start]);
  expect(result.current.programmingRound).toBe(1);

  rerender({ s: after });
  expect(result.current.isReplaying).toBe(true);
  expect(result.current.programmingRound).toBeNull();
  expect(result.current.robots[0]).toMatchObject({ x: 1, y: 1 });

  await tick();
  expect(result.current.robots[0]).toMatchObject({ x: 2, y: 1 }); // first tile of MOVE_2
  await tick();
  expect(result.current.robots[0]).toMatchObject({ x: 3, y: 1 });
  await tick();
  expect(result.current.robots[0]).toMatchObject({ x: 3, y: 2, direction: 'SOUTH' }); // belt phase
  await tick();

  expect(result.current.isReplaying).toBe(false);
  expect(result.current.robots).toEqual(after.robots);
  expect(result.current.programmingRound).toBe(2);
});

it('does not replay a resolution that was already there on first load', () => {
  const { result } = renderHook(() => useGameReplay(after));
  expect(result.current.isReplaying).toBe(false);
  expect(result.current.robots).toEqual(after.robots);
});
