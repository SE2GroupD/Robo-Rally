import type { CardType } from './CardType';
import type { Direction } from './Board';

export interface RobotStateDto {
  playerId: string;
  x: number;
  y: number;
  direction: Direction;
}

export interface RobotStepDto extends RobotStateDto {
  card: CardType;
}

export interface RegisterStepDto {
  registerNumber: number;
  robots: RobotStepDto[];
}

export interface TurnResolutionDto {
  round: number;
  startingRobots: RobotStateDto[];
  steps: RegisterStepDto[];
}

export interface TileDto {
  x: number;
  y: number;
  hasPit?: boolean;
  pit?: boolean;
  isPit?: boolean;
  hasAntenna?: boolean;
  antenna?: boolean;
  isAntenna?: boolean;
  isSpawnPoint?: boolean;
  spawnPoint?: boolean;
  checkpointNumber?: number | null;
  checkpoint?: number | null;
  isCheckpoint?: number | null;
  gear?: 'CLOCKWISE' | 'COUNTER_CLOCKWISE' | null;
  conveyor?: { direction: Direction; isExpress?: boolean; express?: boolean } | null;
  walls?: { north?: boolean; east?: boolean; south?: boolean; west?: boolean } | null;
  occupyingPlayerId?: string | null;
}

export interface BoardStateDto {
  gameId: string;
  width: number;
  height: number;
  robots: RobotStateDto[];
  tiles: TileDto[];
  round: number;
  lockedInPlayerIds: string[];
  lastResolution: TurnResolutionDto | null;
}
