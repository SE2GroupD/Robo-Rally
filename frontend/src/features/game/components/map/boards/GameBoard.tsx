import type { TileData } from '../../../types/Board';
import type { BoardRotation } from '../../../types/MapLayout';
import { rotateTiles } from '../../../data/boardGeometry';
import { TileGrid } from './TileGrid';

interface GameBoardProps {
  layoutData?: TileData[];
  rotation?: BoardRotation;
}

export function GameBoard({ layoutData = [], rotation = 0 }: GameBoardProps) {
  return <TileGrid layoutData={rotateTiles(layoutData, 'game', rotation)} width={10} height={10} />;
}
