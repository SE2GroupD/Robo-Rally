import { expect, it } from 'vitest';
import { toTileData } from '../../features/game/data/serverTiles';

it('maps conveyors and push panels and drops nulls', () => {
  const tile = toTileData({
    x: 2,
    y: 3,
    hasPit: false,
    walls: null,
    conveyor: { direction: 'EAST', isExpress: true },
    pushPanel: { direction: 'SOUTH', activeRegisters: [1, 3, 5] },
  });
  expect(tile.conveyor).toEqual({ direction: 'EAST', isExpress: true });
  expect(tile.pushPanel).toEqual({ direction: 'SOUTH', activeRegisters: [1, 3, 5] });
  expect(tile.hasPit).toBeUndefined();
  expect(tile.walls).toBeUndefined();
});
