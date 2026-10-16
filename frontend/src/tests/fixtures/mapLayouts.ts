import type { MapLayoutData } from '../../features/game/types/MapLayout';

/** Synthetic renderer fixture; production courses come exclusively from the backend. */
export const defaultMapLayout: MapLayoutData = {
  id: 'extra-crispy',
  name: 'Extra Crispy',
  boards: [
    {
      id: 'start',
      kind: 'start',
      x: 0,
      y: 0,
      rotation: 0,
      tiles: [
        { x: 1, y: 1, isSpawnPoint: true },
        { x: 0, y: 3, isSpawnPoint: true },
        { x: 1, y: 4, isSpawnPoint: true },
        { x: 1, y: 5, isSpawnPoint: true },
        { x: 0, y: 6, isSpawnPoint: true },
        { x: 1, y: 8, isSpawnPoint: true },
      ],
    },
    {
      id: 'game-1',
      kind: 'game',
      x: 3,
      y: 0,
      rotation: 0,
      tiles: [
        { x: 3, y: 2, hasPit: true },
        { x: 7, y: 2, checkpointNumber: 1 },
      ],
    },
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
