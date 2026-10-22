import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RaceProgress } from '../../features/game/components/gameplay/race-progress/RaceProgress';
import { rankRacePlayers } from '../../features/game/data/raceStandings';
const players = [
  { playerId: 'a', playerName: 'A very long pilot name that must not resize the widget', avatarId: null },
  { playerId: 'b', playerName: 'Leader', avatarId: 3 },
  { playerId: 'c', playerName: 'Tied leader', avatarId: 4 },
];
const progress = ['b', 'c'].map((playerId) => ({ playerId, nextCheckpoint: 3, completedCheckpoints: [1, 2] }));
const props = { players, progress, totalCheckpoints: 4, currentPlayerId: 'a', lockedInPlayerIds: [], readinessState: {} };
it('sorts with stable shared ranks, missing progress defaults and room-order robot fallbacks', () => {
  expect(rankRacePlayers(players, progress).map((p) => [p.playerId, p.rank, p.completedCheckpoints, p.avatarId])).toEqual([
    ['b', 1, 2, 3],
    ['c', 1, 2, 4],
    ['a', 3, 0, 1],
  ]);
  expect(rankRacePlayers(players, progress, 'a').map((p) => [p.playerId, p.rank])).toEqual([
    ['a', 1],
    ['b', 2],
    ['c', 2],
  ]);
});
it('keeps the current player ranked and exposes full details on keyboard focus', () => {
  render(<RaceProgress {...props} />);
  const widgets = screen.getAllByRole('button');
  expect(widgets[0]).toHaveAccessibleName('Leader, place 1, 2 of 4 checkpoints completed, Not ready');
  expect(widgets[2]).toHaveAccessibleName(`${players[0].playerName} (You), place 3, 0 of 4 checkpoints completed, Not ready`);
  expect(widgets[2]).toHaveClass('border-hazard');
  expect(widgets[0]).not.toHaveClass('border-hazard');
  act(() => widgets[2].focus());
  fireEvent.scroll(widgets[2].closest('ol')!);
  expect(screen.getByRole('tooltip')).toHaveTextContent(players[0].playerName);
  fireEvent.keyDown(widgets[2], { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
it('updates readiness from polling and socket notifications', () => {
  const { rerender } = render(<RaceProgress {...props} />);
  rerender(<RaceProgress {...props} lockedInPlayerIds={['a']} readinessState={{ b: true }} />);
  expect(screen.getAllByTitle('Ready')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Leader, place 1, 2 of 4 checkpoints completed, Ready' })).toBeInTheDocument();
  rerender(<RaceProgress {...props} />);
  expect(screen.queryByTitle('Ready')).not.toBeInTheDocument();
});
it.each([1, 2, 3, 4, 5, 6])('renders %i participants with robot fallbacks', (count) => {
  render(
    <RaceProgress
      {...props}
      players={Array.from({ length: count }, (_, i) => ({ playerId: String(i), playerName: `Pilot ${i}`, avatarId: null }))}
    />,
  );
  expect(screen.getAllByRole('button')).toHaveLength(count);
  expect(document.querySelectorAll('img')).toHaveLength(count);
});
it('uses a neutral placeholder for an absent winner', () => {
  render(<RaceProgress {...props} winnerId="gone" />);
  expect(screen.getByRole('button', { name: /Unknown player, place 1/ })).toHaveTextContent('?');
});
