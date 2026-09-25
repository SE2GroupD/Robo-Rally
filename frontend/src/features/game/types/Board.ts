export type AvatarId = 1 | 2 | 3 | 4 | 5 | 6;

export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export type WallConfig = {
  north?: boolean;
  east?: boolean;
  south?: boolean;
  west?: boolean;
};

export type TileData = {
  x: number;
  y: number;
  robot?: { avatarId?: AvatarId; hue: number; direction: Direction };
  checkpointNumber?: number;
  walls?: WallConfig;
  hasPit?: boolean;
  hasAntenna?: boolean;
  isSpawnPoint?: boolean;
  gear?: 'CLOCKWISE' | 'COUNTER_CLOCKWISE';
  conveyor?: { direction: Direction; isExpress?: boolean };
};

export type BoardId = 'start' | 'game1' | 'game2' | 'game3';

export interface RobotState {
  board: BoardId;
  x: number;
  y: number;
  direction: Direction;
  hue: number;
}
