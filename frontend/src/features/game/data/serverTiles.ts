import type { TileData } from '../types/Board';
import type { TileDto } from '../types/GameStateDto';

export function toTileData(tile: TileDto): TileData {
  return {
    x: tile.x,
    y: tile.y,
    hasPit: tile.hasPit ?? tile.pit ?? undefined,
    hasAntenna: tile.hasAntenna ?? tile.antenna ?? tile.isAntenna ?? undefined,
    isSpawnPoint: tile.isSpawnPoint ?? tile.spawnPoint ?? undefined,
    checkpointNumber: tile.checkpointNumber ?? tile.checkpoint ?? tile.isCheckpoint ?? undefined,
    gear: tile.gear ?? undefined,
    conveyor: tile.conveyor
      ? {
          direction: tile.conveyor.direction,
          isExpress: tile.conveyor.isExpress ?? tile.conveyor.express ?? false,
        }
      : undefined,
    walls: tile.walls
      ? {
          north: tile.walls.north ?? false,
          east: tile.walls.east ?? false,
          south: tile.walls.south ?? false,
          west: tile.walls.west ?? false,
        }
      : undefined,
    occupyingPlayerId: tile.occupyingPlayerId ?? undefined,
  };
}
