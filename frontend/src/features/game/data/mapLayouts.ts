import type { MapLayoutData } from '../types/MapLayout';

export const defaultMapLayout: MapLayoutData = {
  boards: [
    {
      id: 'start',
      kind: 'start',
      x: 0,
      y: 0,
      rotation: 0,
      tiles: [
        { x: 0, y: 0, hasAntenna: true },
        { x: 1, y: 4, isSpawnPoint: true },
      ],
    },
    { id: 'game-1', kind: 'game', x: 3, y: 0, rotation: 0, tiles: [{ x: 8, y: 4, checkpointNumber: 1 }] },
  ],
};

/** Rotation, negative coordinates, and partial-edge connections. */
export const offsetMapLayout: MapLayoutData = {
  boards: [
    { ...defaultMapLayout.boards[0], x: -5, y: -3, rotation: 90 },
    { ...defaultMapLayout.boards[1], x: 0, y: 0, rotation: 90 },
    { id: 'game-2', kind: 'game', x: 10, y: 5, rotation: 180, tiles: [{ x: 1, y: 2, conveyor: { direction: 'NORTH' } }] },
  ],
};
