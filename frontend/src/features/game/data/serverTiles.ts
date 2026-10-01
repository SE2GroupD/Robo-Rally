import type { TileData } from '../types/Board';
import type { TileDto } from '../types/GameStateDto';

export function toTileData(tile: TileDto): TileData {
  return {
    x: tile.x,
    y: tile.y,
    hasPit: tile.pit || undefined,
    hasAntenna: tile.antenna || undefined,
    isSpawnPoint: tile.spawnPoint || undefined,
    checkpointNumber: tile.checkpoint ?? undefined,
    gear: tile.gear ?? undefined,
    conveyor: tile.conveyor ? { direction: tile.conveyor.direction, isExpress: tile.conveyor.express } : undefined,
    walls: tile.walls ?? undefined,
  };
}
