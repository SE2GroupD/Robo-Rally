import { useCallback, useState } from 'react';
import type { CardType } from '../../features/types/CardType';
import type { Direction } from '../../foundation/components/map/Tile';

export type BoardId = 'start' | 'game1' | 'game2' | 'game3';

export interface RobotState {
  board: BoardId;
  x: number;
  y: number;
  direction: Direction;
  hue: number;
}

// Where each board sits on one shared global grid, matching how <Map> lays
// them out visually (StartBoard and GameBoard3 sit beside the GameBoard1/2
// stack, offset down by 5 rows to line up with the seam between them) — so
// the robot can cross from one board straight onto the next.
interface BoardRect {
  board: BoardId;
  x0: number;
  y0: number;
  width: number;
  height: number;
}

const BOARD_RECTS: BoardRect[] = [
  { board: 'start', x0: 0, y0: 5, width: 3, height: 10 },
  { board: 'game1', x0: 3, y0: 0, width: 10, height: 10 },
  { board: 'game2', x0: 3, y0: 10, width: 10, height: 10 },
  { board: 'game3', x0: 13, y0: 5, width: 10, height: 10 },
];

function toGlobal(state: RobotState): { X: number; Y: number } {
  const rect = BOARD_RECTS.find((r) => r.board === state.board)!;
  return { X: rect.x0 + state.x, Y: rect.y0 + state.y };
}

function fromGlobal(X: number, Y: number): { board: BoardId; x: number; y: number } | null {
  const rect = BOARD_RECTS.find((r) => X >= r.x0 && X < r.x0 + r.width && Y >= r.y0 && Y < r.y0 + r.height);
  return rect ? { board: rect.board, x: X - rect.x0, y: Y - rect.y0 } : null;
}

const DIRECTIONS: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];

const DELTAS: Record<Direction, { dx: number; dy: number }> = {
  NORTH: { dx: 0, dy: -1 },
  EAST: { dx: 1, dy: 0 },
  SOUTH: { dx: 0, dy: 1 },
  WEST: { dx: -1, dy: 0 },
};

const STEP_DELAY_MS = 350;

const INITIAL_ROBOT: RobotState = { board: 'start', x: 1, y: 1, direction: 'EAST', hue: 0 };

function rotate(direction: Direction, quarterTurns: number): Direction {
  const index = (DIRECTIONS.indexOf(direction) + quarterTurns + 4) % 4;
  return DIRECTIONS[index];
}

// Moves one tile in `facing`, crossing onto a neighboring board when the
// step lands on it. Stepping off the combined map is a no-op for now.
// Wall/pit/conveyor interactions aren't implemented yet (SCRUM-47).
function step(state: RobotState, facing: Direction): RobotState {
  const { X, Y } = toGlobal(state);
  const { dx, dy } = DELTAS[facing];
  const target = fromGlobal(X + dx, Y + dy);
  if (!target) return state;
  return { ...state, board: target.board, x: target.x, y: target.y };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useRobotMovement() {
  const [robot, setRobot] = useState<RobotState>(INITIAL_ROBOT);
  const [isExecuting, setIsExecuting] = useState(false);

  const runProgram = useCallback(async (cards: readonly CardType[]) => {
    setIsExecuting(true);
    let lastMovingCard: CardType | null = null;

    for (const card of cards) {
      // AGAIN repeats whatever the previous register did; with nothing to
      // repeat (e.g. register 1) it's a no-op.
      const effectiveCard = card === 'AGAIN' ? lastMovingCard : card;

      switch (effectiveCard) {
        case 'MOVE_1':
        case 'MOVE_2':
        case 'MOVE_3': {
          const distance = effectiveCard === 'MOVE_1' ? 1 : effectiveCard === 'MOVE_2' ? 2 : 3;
          for (let i = 0; i < distance; i++) {
            setRobot((current) => step(current, current.direction));
            await sleep(STEP_DELAY_MS);
          }
          break;
        }
        case 'BACK_UP':
          setRobot((current) => step(current, rotate(current.direction, 2)));
          await sleep(STEP_DELAY_MS);
          break;
        case 'TURN_LEFT':
          setRobot((current) => ({ ...current, direction: rotate(current.direction, -1) }));
          await sleep(STEP_DELAY_MS);
          break;
        case 'TURN_RIGHT':
          setRobot((current) => ({ ...current, direction: rotate(current.direction, 1) }));
          await sleep(STEP_DELAY_MS);
          break;
        case 'U_TURN':
          setRobot((current) => ({ ...current, direction: rotate(current.direction, 2) }));
          await sleep(STEP_DELAY_MS);
          break;
        default:
          // POWER_UP and damage cards (SPAM/WORM/VIRUS/TROJAN_HORSE) don't move the robot.
          break;
      }

      if (card !== 'AGAIN') lastMovingCard = card;
    }

    setIsExecuting(false);
  }, []);

  return { robot, isExecuting, runProgram };
}
