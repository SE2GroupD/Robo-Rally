import type { TileData } from '../types/board';

export const startboard1Layout: TileData[] = [
  { x: 0, y: 4, hasAntenna: true },

  { x: 1, y: 1, isSpawnPoint: true, robot: { hue: 0, direction: 'EAST' } },
  { x: 1, y: 2, isSpawnPoint: true },
  { x: 1, y: 3, isSpawnPoint: true },
  { x: 1, y: 6, isSpawnPoint: true },
  { x: 1, y: 7, isSpawnPoint: true },
  { x: 1, y: 8, isSpawnPoint: true },
];

export const gameboard1Layout: TileData[] = [
  { x: 2, y: 8, conveyor: { direction: 'NORTH', isExpress: true } },
  { x: 2, y: 7, conveyor: { direction: 'NORTH', isExpress: true } },
  { x: 2, y: 6, conveyor: { direction: 'NORTH', isExpress: true } },
  { x: 2, y: 5, conveyor: { direction: 'NORTH', isExpress: true } },
  { x: 2, y: 4, conveyor: { direction: 'NORTH', isExpress: true } },
  { x: 2, y: 3, conveyor: { direction: 'EAST', isExpress: true } },
  { x: 3, y: 3, conveyor: { direction: 'EAST', isExpress: true } },
  { x: 4, y: 3, conveyor: { direction: 'EAST', isExpress: true } },
  { x: 5, y: 3, conveyor: { direction: 'EAST', isExpress: true } },
  { x: 6, y: 3, conveyor: { direction: 'EAST', isExpress: true } },
  { x: 7, y: 3, conveyor: { direction: 'SOUTH', isExpress: true } },
  { x: 7, y: 4, conveyor: { direction: 'SOUTH', isExpress: true } },
  { x: 7, y: 5, conveyor: { direction: 'SOUTH', isExpress: true } },

  { x: 1, y: 1, hasPit: true },
  { x: 7, y: 8, hasPit: true },
  { x: 8, y: 4, hasPit: true },

  { x: 0, y: 3, gear: 'CLOCKWISE' },
  { x: 4, y: 1, gear: 'COUNTER_CLOCKWISE' },
  { x: 9, y: 5, gear: 'CLOCKWISE' },

  { x: 4, y: 5, walls: { north: true, west: true } },
  { x: 5, y: 7, walls: { east: true } },
];

export const gameboard2Layout: TileData[] = [
  { x: 3, y: 3, checkpointNumber: 1, gear: 'CLOCKWISE' },

  { x: 0, y: 4, conveyor: { direction: 'EAST' } },
  { x: 1, y: 4, conveyor: { direction: 'EAST' } },
  { x: 8, y: 5, conveyor: { direction: 'WEST' } },
  { x: 9, y: 5, conveyor: { direction: 'WEST' } },

  { x: 4, y: 4, hasPit: true },
  { x: 5, y: 4, hasPit: true },
  { x: 4, y: 5, hasPit: true },
  { x: 5, y: 5, hasPit: true },

  { x: 1, y: 8, hasPit: true },
  { x: 8, y: 1, hasPit: true },
  { x: 8, y: 8, hasPit: true },

  { x: 5, y: 2, gear: 'COUNTER_CLOCKWISE' },
  { x: 4, y: 7, gear: 'CLOCKWISE' },

  { x: 4, y: 3, walls: { south: true } },
  { x: 5, y: 3, walls: { south: true } },
  { x: 4, y: 6, walls: { north: true } },
  { x: 5, y: 6, walls: { north: true } },
];

export const gameboard3Layout: TileData[] = [
  { x: 8, y: 2, checkpointNumber: 2 },
  { x: 1, y: 7, checkpointNumber: 3 },

  { x: 2, y: 2, conveyor: { direction: 'EAST' } },
  { x: 3, y: 2, conveyor: { direction: 'EAST' } },
  { x: 4, y: 2, conveyor: { direction: 'SOUTH' } },
  { x: 4, y: 3, conveyor: { direction: 'SOUTH' } },

  { x: 7, y: 7, conveyor: { direction: 'WEST' } },
  { x: 6, y: 7, conveyor: { direction: 'WEST' } },
  { x: 5, y: 7, conveyor: { direction: 'NORTH' } },
  { x: 5, y: 6, conveyor: { direction: 'NORTH' } },

  { x: 3, y: 4, hasPit: true },
  { x: 6, y: 5, hasPit: true },
  { x: 3, y: 5, hasPit: true },
  { x: 6, y: 4, hasPit: true },

  { x: 8, y: 8, gear: 'CLOCKWISE' },
  { x: 2, y: 5, gear: 'COUNTER_CLOCKWISE' },

  { x: 2, y: 2, walls: { north: true, west: true } },
  { x: 7, y: 7, walls: { south: true, east: true } },
];
