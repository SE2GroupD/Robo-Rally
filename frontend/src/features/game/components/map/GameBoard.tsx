import { Tile } from './Tile';
import type { TileData } from '../../types/board';

interface GameBoardProps {
  layoutData?: TileData[];
}

export function GameBoard({ layoutData = [] }: GameBoardProps) {
  const width = 10;
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
    <div className="grid grid-cols-[repeat(10,50px)] gap-[2px] w-max bg-neutral-800 rounded-md">
      {' '}
      {tiles.map((tile) => (
        <Tile key={`game-${tile.x}-${tile.y}`} tile={tile} />
      ))}
    </div>
  );
}
