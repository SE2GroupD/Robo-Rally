import type { MapLayoutData } from '../types/MapLayout';

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
        {
          x: 1,
          y: 1,
          isSpawnPoint: true,
        },
        {
          x: 0,
          y: 3,
          isSpawnPoint: true,
        },
        {
          x: 1,
          y: 4,
          isSpawnPoint: true,
        },
        {
          x: 1,
          y: 5,
          isSpawnPoint: true,
        },
        {
          x: 0,
          y: 6,
          isSpawnPoint: true,
        },
        {
          x: 1,
          y: 8,
          isSpawnPoint: true,
        },
        {
          x: 1,
          y: 2,
          walls: {
            north: true,
          },
        },
        {
          x: 2,
          y: 4,
          walls: {
            east: true,
          },
        },
        {
          x: 2,
          y: 5,
          walls: {
            east: true,
          },
        },
        {
          x: 1,
          y: 7,
          walls: {
            south: true,
          },
        },
      ],
    },
    {
      id: 'game-1',
      kind: 'game',
      x: 3,
      y: 0,
      rotation: 0,
      tiles: [
        {
          x: 3,
          y: 2,
          hasPit: true,
        },
        {
          x: 3,
          y: 3,
          hasPit: true,
        },
        {
          x: 3,
          y: 6,
          hasPit: true,
        },
        {
          x: 3,
          y: 7,
          hasPit: true,
        },
        {
          x: 6,
          y: 2,
          hasPit: true,
        },
        {
          x: 6,
          y: 3,
          hasPit: true,
        },
        {
          x: 6,
          y: 6,
          hasPit: true,
        },
        {
          x: 6,
          y: 7,
          hasPit: true,
        },
        {
          x: 7,
          y: 2,
          checkpointNumber: 1,
        },
        {
          x: 2,
          y: 7,
          checkpointNumber: 2,
        },
        {
          x: 7,
          y: 7,
          checkpointNumber: 3,
        },
        {
          x: 2,
          y: 2,
          checkpointNumber: 4,
        },
        {
          x: 1,
          y: 0,
          conveyor: {
            direction: 'SOUTH',
            isExpress: true,
          },
        },
        {
          x: 1,
          y: 1,
          conveyor: {
            direction: 'SOUTH',
            isExpress: true,
          },
        },
        {
          x: 1,
          y: 2,
          conveyor: {
            direction: 'SOUTH',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 1,
          conveyor: {
            direction: 'SOUTH',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 2,
          conveyor: {
            direction: 'SOUTH',
            isExpress: true,
          },
        },
        {
          x: 1,
          y: 7,
          conveyor: {
            direction: 'NORTH',
            isExpress: true,
          },
        },
        {
          x: 1,
          y: 8,
          conveyor: {
            direction: 'NORTH',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 7,
          conveyor: {
            direction: 'NORTH',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 8,
          conveyor: {
            direction: 'NORTH',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 9,
          conveyor: {
            direction: 'NORTH',
            isExpress: true,
          },
        },
        {
          x: 1,
          y: 3,
          conveyor: {
            direction: 'EAST',
            isExpress: true,
          },
        },
        {
          x: 2,
          y: 3,
          conveyor: {
            direction: 'EAST',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 3,
          conveyor: {
            direction: 'WEST',
            isExpress: true,
          },
        },
        {
          x: 7,
          y: 3,
          conveyor: {
            direction: 'WEST',
            isExpress: true,
          },
        },
        {
          x: 1,
          y: 6,
          conveyor: {
            direction: 'EAST',
            isExpress: true,
          },
        },
        {
          x: 2,
          y: 6,
          conveyor: {
            direction: 'EAST',
            isExpress: true,
          },
        },
        {
          x: 8,
          y: 6,
          conveyor: {
            direction: 'WEST',
            isExpress: true,
          },
        },
        {
          x: 7,
          y: 6,
          conveyor: {
            direction: 'WEST',
            isExpress: true,
          },
        },
        {
          x: 4,
          y: 1,
          conveyor: {
            direction: 'WEST',
            isExpress: false,
          },
        },
        {
          x: 3,
          y: 1,
          conveyor: {
            direction: 'SOUTH',
            isExpress: false,
          },
        },
        {
          x: 5,
          y: 8,
          conveyor: {
            direction: 'EAST',
            isExpress: false,
          },
        },
        {
          x: 6,
          y: 8,
          conveyor: {
            direction: 'NORTH',
            isExpress: false,
          },
        },
        {
          x: 3,
          y: 4,
          gear: 'CLOCKWISE',
        },
        {
          x: 6,
          y: 5,
          gear: 'COUNTERCLOCKWISE',
        },
        {
          x: 5,
          y: 0,
          walls: {
            east: true,
          },
        },
        {
          x: 8,
          y: 0,
          walls: {
            west: true,
          },
        },
        {
          x: 4,
          y: 3,
          walls: {
            west: true,
          },
        },
        {
          x: 5,
          y: 3,
          walls: {
            east: true,
          },
        },
        {
          x: 0,
          y: 4,
          walls: {
            north: true,
          },
        },
        {
          x: 7,
          y: 4,
          walls: {
            west: true,
          },
        },
        {
          x: 3,
          y: 5,
          walls: {
            west: true,
          },
        },
        {
          x: 0,
          y: 5,
          walls: {
            south: true,
          },
        },
        {
          x: 9,
          y: 4,
          walls: {
            north: true,
          },
        },
        {
          x: 9,
          y: 5,
          walls: {
            south: true,
          },
        },
        {
          x: 4,
          y: 6,
          walls: {
            west: true,
          },
        },
        {
          x: 5,
          y: 6,
          walls: {
            east: true,
          },
        },
        {
          x: 1,
          y: 9,
          walls: {
            west: true,
          },
        },
        {
          x: 3,
          y: 9,
          walls: {
            east: true,
          },
        },
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
