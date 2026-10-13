import type { TileData } from './Board';

export type BoardRotation = 0 | 90 | 180 | 270;
export type BoardKind = 'start' | 'game';

export interface PlacedBoard {
  id: string;
  kind: BoardKind;

  /** Top-left of the rotated board in map tile coordinates. */
  x: number;
  y: number;
  rotation: BoardRotation;

  /** Coordinates and directions local to the unrotated board. */
  tiles: TileData[];
}

export interface MapLayoutData {
  boards: PlacedBoard[];
}
