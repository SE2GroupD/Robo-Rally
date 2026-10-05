import type { CardType } from './CardType';
import type { Direction } from './Board';

export interface RobotStateDto {
  playerId: string;
  x: number;
  y: number;
  direction: Direction;
}

export type ResolutionPhase = 'CARD' | 'EXPRESS_BELT' | 'BELT' | 'PUSH_PANEL';

// `card` is only set in the CARD phase.
export interface RobotStepDto extends RobotStateDto {
  card: CardType | null;
}

// Every robot's state right after one phase of a register.
export interface PhaseStepDto {
  phase: ResolutionPhase;
  robots: RobotStepDto[];
}

export interface RegisterStepDto {
  registerNumber: number;
  phases: PhaseStepDto[];
}

export interface TurnResolutionDto {
  round: number;
  startingRobots: RobotStateDto[];
  steps: RegisterStepDto[];
}

// Mirrors the Java Tile record's JSON (null fields are omitted by the server).
export interface TileDto {
  x: number;
  y: number;
  hasPit?: boolean;
  walls?: { north: boolean; east: boolean; south: boolean; west: boolean } | null;
  hasAntenna?: boolean;
  isSpawnPoint?: boolean;
  gear?: 'CLOCKWISE' | 'COUNTER_CLOCKWISE' | null;
  conveyor?: { direction: Direction; isExpress?: boolean } | null;
  checkpointNumber?: number | null;
  pushPanel?: { direction: Direction; activeRegisters: number[] } | null;
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
