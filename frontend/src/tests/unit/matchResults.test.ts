import { describe, expect, it } from 'vitest';
import { createMatchResults } from '../../features/game/data/matchResults';
import type { BoardStateDto } from '../../features/game/types/GameStateDto';

function race(scores: number[], winner = 'p0') {
  const players = scores.map((_, i) => ({ playerId: `p${i}`, playerName: `Pilot ${i}`, avatarId: i + 1 }));
  const state: BoardStateDto = {
    gameId: 'race',
    winner: { playerId: winner },
    round: 3,
    totalCheckpoints: 4,
    width: 10,
    height: 10,
    robots: [],
    tiles: [],
    lockedInPlayerIds: [],
    lastResolution: null,
    checkpointProgress: scores.map((count, i) => ({
      playerId: `p${i}`,
      nextCheckpoint: count + 1,
      completedCheckpoints: Array.from({ length: count }, (_, n) => n + 1),
    })),
  };
  return { state, players };
}

describe('final standings', () => {
  it('ranks by progress, forces the declared winner first and retains tie order', () => {
    const { state, players } = race([1, 3, 2, 3, 0]);
    const results = createMatchResults(state, players)!;
    expect(results.standings.map((p) => p.playerId)).toEqual(['p0', 'p1', 'p3', 'p2', 'p4']);
    expect(results.standings.map((p) => p.rank)).toEqual([1, 2, 2, 4, 5]);
    expect(results.standings.some((p) => p.rank === 3)).toBe(false);
  });
  it.each([1, 2, 3, 4, 5, 6])('includes all %i participants without inventing podium places', (count) => {
    const { state, players } = race(Array(count).fill(0));
    expect(createMatchResults(state, players)!.standings).toHaveLength(count);
    expect(createMatchResults(state, players)!.standings.map((p) => p.rank)).toEqual([1, ...Array(count - 1).fill(2)]);
  });
  it('copies names, robots and progress into a stable snapshot', () => {
    const { state, players } = race([4, 2]);
    const results = createMatchResults(state, players)!;
    players[0].playerName = 'Changed';
    players[0].avatarId = 6;
    state.checkpointProgress[0].completedCheckpoints.pop();
    expect(results.standings[0]).toMatchObject({ playerName: 'Pilot 0', avatarId: 1, completedCheckpoints: 4 });
  });
  it('requires a server winner and retains a missing winner with a placeholder', () => {
    const { state, players } = race([2]);
    expect(createMatchResults({ ...state, winner: null }, players)).toBeNull();
    expect(createMatchResults({ ...state, winner: { playerId: 'gone' } }, players)!.standings[0]).toMatchObject({
      playerId: 'gone',
      rank: 1,
      avatarId: null,
    });
  });
});

it('uses the board robot fallback in room order even when podium order differs', () => {
  const { state, players } = race([1, 4], 'p1');
  const unselected = players.map((player) => ({ ...player, avatarId: null }));
  const results = createMatchResults(state, unselected)!;
  expect(results.standings.map((player) => [player.playerId, player.avatarId])).toEqual([
    ['p1', 2],
    ['p0', 1],
  ]);
});

it('keeps an explicitly selected robot instead of using the fallback', () => {
  const { state, players } = race([4, 1]);
  players[0].avatarId = 6;
  expect(createMatchResults(state, players)!.standings[0].avatarId).toBe(6);
});
