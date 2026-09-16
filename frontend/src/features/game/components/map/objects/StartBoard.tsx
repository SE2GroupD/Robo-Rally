import { Tile } from './Tile';
import type { TileData } from '../../types/board';

interface StartBoardProps {
  layoutData?: TileData[];
}

export function StartBoard({ layoutData = [] }: StartBoardProps) {
  const width = 3;
  const height = 10;
  const tiles: TileData[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const specialTile = layoutData.find((t) => t.x === x && t.y === y);

      if (specialTile) {
        tiles.push(specialTile);
      } else {
        tiles.push({ x, y });
      }
    }
  }

  return (
    <div className="grid grid-cols-[repeat(3,50px)] gap-[2px] w-max bg-neutral-800 p-1 border-4 border-[#555] rounded-md">
      {tiles.map((tile) => (
        <Tile key={`start-${tile.x}-${tile.y}`} tile={tile} />
      ))}
    </div>
  );
}
