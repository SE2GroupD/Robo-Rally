import { Tile } from './Tile';
import type { TileData } from '../../../types/Board';

interface GameBoardProps {
  layoutData?: TileData[];
  width?: number;
  height?: number;
}

export function GameBoard({ layoutData = [], width = 10, height = 10 }: GameBoardProps) {
  const tiles: TileData[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const specialTile = layoutData.find((t) => t.x === x && t.y === y);
      tiles.push(specialTile ?? { x, y });
    }
  }

  return (
    <div className="grid w-max gap-[2px] rounded-md bg-neutral-800" style={{ gridTemplateColumns: `repeat(${width}, 50px)` }}>
      {tiles.map((tile) => (
        <Tile key={`game-${tile.x}-${tile.y}`} tile={tile} />
      ))}
    </div>
  );
}
