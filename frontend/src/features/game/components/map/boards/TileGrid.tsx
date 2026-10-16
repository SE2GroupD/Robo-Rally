import { Tile } from './Tile';
import type { TileData } from '../../../types/Board';
import { TILE_GAP, TILE_SIZE } from '../../../data/boardGeometry';

interface TileGridProps {
  layoutData?: TileData[];
  width: number;
  height: number;
}

export function TileGrid({ layoutData = [], width, height }: TileGridProps) {
  const supplied = new Map(layoutData.map((tile) => [`${tile.x},${tile.y}`, tile]));
  const tiles: TileData[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) tiles.push(supplied.get(`${x},${y}`) ?? { x, y });
  }

  return (
    <div className="grid w-max bg-neutral-800" style={{ gap: TILE_GAP, gridTemplateColumns: `repeat(${width}, ${TILE_SIZE}px)` }}>
      {tiles.map((tile) => (
        <Tile key={`${tile.x},${tile.y}`} tile={tile} />
      ))}
    </div>
  );
}
