import type { TileData } from '../../../types/Board';
import type { BoardRotation } from '../../../types/MapLayout';
import { boardDimensions, rotateTiles } from '../../../data/boardGeometry';
import { TileGrid } from './TileGrid';

interface StartBoardProps {
  layoutData?: TileData[];
  rotation?: BoardRotation;
}

export function StartBoard({ layoutData = [], rotation = 0 }: StartBoardProps) {
  return <TileGrid layoutData={rotateTiles(layoutData, 'start', rotation)} {...boardDimensions('start', rotation)} />;
}
