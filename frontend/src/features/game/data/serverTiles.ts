import type { TileData } from '../types/Board';
import type { TileDto } from '../types/GameStateDto';

// The server's Tile JSON already matches TileData closely; this only turns
// the nulls the server may send into undefined.
export function toTileData(tile: TileDto): TileData {
  return {
    x: tile.x,
    y: tile.y,
    hasPit: tile.hasPit || undefined,
    hasAntenna: tile.hasAntenna || undefined,
    isSpawnPoint: tile.isSpawnPoint || undefined,
    checkpointNumber: tile.checkpointNumber ?? undefined,
    gear: tile.gear ?? undefined,
    conveyor: tile.conveyor ?? undefined,
    walls: tile.walls ?? undefined,
    pushPanel: tile.pushPanel ?? undefined,
  };
}
