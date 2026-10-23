import type { Direction, TileData, WallConfig } from '../types/Board';
import type { BoardKind, BoardRotation, MapLayoutData, PlacedBoard } from '../types/MapLayout';

export const TILE_SIZE = 50;
export const TILE_GAP = 2;
export const TILE_PITCH = TILE_SIZE + TILE_GAP;
const DIRECTIONS: Direction[] = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
const WALL_KEYS: (keyof WallConfig)[] = ['north', 'east', 'south', 'west'];

export function boardDimensions(kind: BoardKind, rotation: BoardRotation = 0) {
  const width = kind === 'start' ? 3 : 10;

  return rotation === 90 || rotation === 270 ? { width: 10, height: width } : { width, height: 10 };
}

export function rotateDirection(direction: Direction, rotation: BoardRotation): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(direction) + rotation / 90) % 4];
}

export function rotateTiles(tiles: TileData[], kind: BoardKind, rotation: BoardRotation): TileData[] {
  const { width, height } = boardDimensions(kind);

  return tiles.map((tile) => {
    let { x, y } = tile;

    if (rotation === 90) [x, y] = [height - 1 - y, x];
    if (rotation === 180) [x, y] = [width - 1 - x, height - 1 - y];
    if (rotation === 270) [x, y] = [y, width - 1 - x];

    const walls: WallConfig | undefined = tile.walls ? {} : undefined;

    if (walls && tile.walls) {
      WALL_KEYS.forEach((key, index) => {
        walls[WALL_KEYS[(index + rotation / 90) % 4]] = tile.walls?.[key];
      });
    }

    return {
      ...tile,
      x,
      y,
      walls,
      conveyor: tile.conveyor && { ...tile.conveyor, direction: rotateDirection(tile.conveyor.direction, rotation) },
      pushPanel: tile.pushPanel && { ...tile.pushPanel, direction: rotateDirection(tile.pushPanel.direction, rotation) },
      robot: tile.robot && { ...tile.robot, direction: rotateDirection(tile.robot.direction, rotation) },
    };
  });
}

function rectangle(board: PlacedBoard) {
  const { width, height } = boardDimensions(board.kind, board.rotation);

  return { left: board.x, top: board.y, right: board.x + width, bottom: board.y + height };
}

/** The side of a touched by b; corners alone are not connections. */
function contactSide(a: PlacedBoard, b: PlacedBoard): Direction | undefined {
  const first = rectangle(a);
  const second = rectangle(b);

  const vertical = Math.min(first.bottom, second.bottom) > Math.max(first.top, second.top);
  const horizontal = Math.min(first.right, second.right) > Math.max(first.left, second.left);

  if (vertical && first.right === second.left) return 'EAST';
  if (vertical && first.left === second.right) return 'WEST';
  if (horizontal && first.bottom === second.top) return 'SOUTH';
  if (horizontal && first.top === second.bottom) return 'NORTH';
}

export function validateMapLayout({ boards }: MapLayoutData): string[] {
  const errors: string[] = [];

  if (boards.filter((board) => board.kind === 'start').length !== 1) errors.push('Exactly one start board is required.');
  if (!boards.some((board) => board.kind === 'game')) errors.push('At least one game board is required.');

  const ids = new Set<string>();

  for (const board of boards) {
    if (!board.id.trim() || ids.has(board.id)) errors.push(`Board ID must be nonempty and unique: ${board.id}.`);
    ids.add(board.id);
    if (!Number.isSafeInteger(board.x) || !Number.isSafeInteger(board.y))
      errors.push(`Board ${board.id} must have integer coordinates.`);
    if (!['start', 'game'].includes(board.kind) || ![0, 90, 180, 270].includes(board.rotation))
      errors.push(`Board ${board.id} has an invalid kind or rotation.`);

    const { width, height } = boardDimensions(board.kind);
    const positions = new Set<string>();

    for (const tile of board.tiles) {
      const key = `${tile.x},${tile.y}`;

      if (
        !Number.isInteger(tile.x) ||
        !Number.isInteger(tile.y) ||
        tile.x < 0 ||
        tile.y < 0 ||
        tile.x >= width ||
        tile.y >= height ||
        positions.has(key)
      ) {
        errors.push(`Board ${board.id} has an invalid or duplicate tile position: ${key}.`);
      }
      positions.add(key);
    }
  }

  if (errors.length) return errors;

  const connections = boards.map(() => new Set<number>());

  for (let i = 0; i < boards.length; i++) {
    for (let j = i + 1; j < boards.length; j++) {
      const a = boards[i];
      const b = boards[j];
      const first = rectangle(a);
      const second = rectangle(b);

      if (
        Math.min(first.right, second.right) > Math.max(first.left, second.left) &&
        Math.min(first.bottom, second.bottom) > Math.max(first.top, second.top)
      ) {
        errors.push(`Boards ${a.id} and ${b.id} overlap.`);
      }

      if (!contactSide(a, b)) continue;

      const start = a.kind === 'start' ? a : b.kind === 'start' ? b : undefined;
      if (start && contactSide(start, start === a ? b : a) !== rotateDirection('EAST', start.rotation)) {
        errors.push(`Board ${start.id} can connect only along its exit edge.`);
        continue;
      }

      connections[i].add(j);
      connections[j].add(i);
    }
  }

  const startIndex = boards.findIndex((board) => board.kind === 'start');
  if (!connections[startIndex].size) errors.push('A game board must connect to the start board exit.');

  const visited = new Set<number>();
  const pending = [startIndex];

  while (pending.length) {
    const index = pending.pop()!;
    if (visited.has(index)) continue;
    visited.add(index);
    pending.push(...connections[index]);
  }

  if (visited.size !== boards.length) errors.push('All boards must form one edge-connected map.');

  return errors;
}

/** Call after validation; an empty layout has no bounds. */
export function mapBounds(boards: PlacedBoard[]) {
  const rectangles = boards.map(rectangle);
  const x = Math.min(...rectangles.map((rect) => rect.left));
  const y = Math.min(...rectangles.map((rect) => rect.top));

  return {
    x,
    y,
    width: Math.max(...rectangles.map((rect) => rect.right)) - x,
    height: Math.max(...rectangles.map((rect) => rect.bottom)) - y,
  };
}
