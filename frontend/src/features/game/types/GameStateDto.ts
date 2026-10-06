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

export interface CheckpointProgressDto {
  playerId: string;
  nextCheckpoint: number;
  completedCheckpoints: number[];
}

// ASSUMED shape of the Java Tile record's JSON - verify against a real GET /state response.
export interface TileDto {
  x: number;
  y: number;
  pit?: boolean;
  antenna?: boolean;
  spawnPoint?: boolean;
  checkpoint?: number | null;
  gear?: 'CLOCKWISE' | 'COUNTER_CLOCKWISE' | null;
  conveyor?: { direction: Direction; express?: boolean } | null;
  walls?: { north: boolean; east: boolean; south: boolean; west: boolean } | null;
}

export interface BoardStateDto {
  gameId: string;
  width: number;
  height: number;
  robots: RobotStateDto[];
  tiles: TileDto[];
  round: number;
  lockedInPlayerIds: string[];
  checkpointProgress: CheckpointProgressDto[];
  lastResolution: TurnResolutionDto | null;
}
