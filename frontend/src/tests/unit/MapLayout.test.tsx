import { render, screen, within } from '@testing-library/react';
import { MapLayout } from '../../features/game/components/map/MapLayout';
import { TileGrid } from '../../features/game/components/map/boards/TileGrid';
import { boardDimensions, mapBounds, rotateTiles, validateMapLayout } from '../../features/game/data/boardGeometry';
import { defaultMapLayout, offsetMapLayout } from '../fixtures/mapLayouts';
import type { BoardRotation, MapLayoutData, PlacedBoard } from '../../features/game/types/MapLayout';
import type { TileData } from '../../features/game/types/Board';

const start: PlacedBoard = { id: 'start', kind: 'start', x: 0, y: 0, rotation: 0, tiles: [] };
const game: PlacedBoard = { id: 'game', kind: 'game', x: 3, y: 0, rotation: 0, tiles: [] };
const errorsFor = (...boards: PlacedBoard[]) => validateMapLayout({ boards }).join(' ');

it.each([
  [0, 3, 0, 3, 10],
  [90, 0, 3, 10, 3],
  [180, -10, 0, 3, 10],
  [270, 0, -10, 10, 3],
] as const)('connects at the exit after %i degrees of rotation', (rotation, x, y, width, height) => {
  expect(boardDimensions('start', rotation)).toEqual({ width, height });
  expect(errorsFor({ ...start, rotation }, { ...game, x, y })).toBe('');
});

it.each([-9, -5, 0, 5, 9])('allows partial or full exit contact at offset %i', (y) => {
  expect(errorsFor(start, { ...game, y })).toBe('');
});

it('accepts the samples and calculates negative-coordinate bounds', () => {
  expect(validateMapLayout(defaultMapLayout)).toEqual([]);
  expect(validateMapLayout(offsetMapLayout)).toEqual([]);
  expect(mapBounds(offsetMapLayout.boards)).toEqual({ x: -5, y: -3, width: 25, height: 18 });
});

it.each([
  [13, 4],
  [3, 10],
  [3, -10],
])('allows a further game board at (%i, %i)', (x, y) => {
  expect(errorsFor(start, game, { ...game, id: 'next', x, y })).toBe('');
});

it('requires exactly one start and at least one game board', () => {
  expect(errorsFor(game)).toContain('Exactly one start board');
  expect(errorsFor(start, { ...start, id: 'other' }, game)).toContain('Exactly one start board');
  expect(errorsFor(start)).toContain('At least one game board');
  expect(errorsFor()).toContain('Exactly one start board');
});

it('rejects overlapping, isolated, and corner-only boards', () => {
  expect(errorsFor(start, { ...game, x: 2 })).toContain('overlap');
  expect(errorsFor(start, game, { ...game, id: 'far', x: 30 })).toContain('edge-connected');
  expect(errorsFor(start, { ...game, y: 10 })).toContain('start board exit');
  expect(errorsFor(start, game, { ...game, id: 'corner', x: 13, y: 10 })).toContain('edge-connected');
});

it.each([
  [0, -10],
  [0, 10],
  [-10, 0],
])('rejects attaching to the wrong start edge at (%i, %i)', (x, y) => {
  expect(errorsFor(start, game, { ...game, id: 'wrong-edge', x, y })).toContain('only along its exit edge');
});

it('rejects invalid IDs, positions, rotations and local tile data', () => {
  expect(errorsFor(start, { ...game, id: 'start' })).toContain('unique');
  expect(errorsFor(start, { ...game, id: '' })).toContain('nonempty');
  expect(errorsFor(start, { ...game, x: 3.5 })).toContain('integer');
  expect(errorsFor(start, { ...game, rotation: 45 as BoardRotation })).toContain('rotation');
  expect(errorsFor({ ...start, tiles: [{ x: 3, y: 0 }] }, game)).toContain('tile position');
  expect(
    errorsFor(start, {
      ...game,
      tiles: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
    }),
  ).toContain('duplicate tile');
});

const tile: TileData = {
  x: 1,
  y: 2,
  walls: { north: true, west: false },
  conveyor: { direction: 'NORTH', isExpress: true },
  pushPanel: { direction: 'EAST', activeRegisters: [1, 3, 5] },
  robot: { direction: 'SOUTH', hue: 120, avatarId: 2 },
  checkpointNumber: 7,
  gear: 'CLOCKWISE',
};

it.each([
  [0, 1, 2, 'north', 'NORTH', 'EAST', 'SOUTH'],
  [90, 7, 1, 'east', 'EAST', 'SOUTH', 'WEST'],
  [180, 1, 7, 'south', 'SOUTH', 'WEST', 'NORTH'],
  [270, 2, 1, 'west', 'WEST', 'NORTH', 'EAST'],
] as const)('rotates local tile coordinates and directions by %i degrees', (rotation, x, y, wall, conveyor, panel, robot) => {
  const original = structuredClone(tile);
  const result = rotateTiles([tile], 'start', rotation)[0];
  expect(result).toMatchObject({
    x,
    y,
    checkpointNumber: 7,
    gear: 'CLOCKWISE',
    walls: { [wall]: true },
    conveyor: { direction: conveyor, isExpress: true },
    pushPanel: { direction: panel, activeRegisters: [1, 3, 5] },
    robot: { direction: robot, hue: 120, avatarId: 2 },
  });
  expect(tile).toEqual(original);
});

it('rotates a square board using its own width', () => {
  expect(rotateTiles([{ x: 1, y: 2 }], 'game', 180)[0]).toMatchObject({ x: 8, y: 7 });
});

it('renders 30 start tiles and 100 game tiles with a continuous tile pitch', () => {
  render(<MapLayout layout={defaultMapLayout} />);
  const startBoard = screen.getByRole('region', { name: 'Start board start' });
  const gameBoard = screen.getByRole('region', { name: 'Game board game-1' });
  expect(within(startBoard).getAllByAltText('Steel Tile')).toHaveLength(30);
  expect(within(gameBoard).getAllByAltText('Steel Tile')).toHaveLength(99);
  expect(gameBoard).toHaveStyle({ left: '156px', top: '0px' });
  expect(startBoard.firstElementChild).toHaveStyle({ gridTemplateColumns: 'repeat(3, 50px)', gap: '2px' });
  expect(screen.getByRole('region', { name: 'Map layout' })).toHaveStyle({ width: '674px', height: '518px' });
});

it('leaves missing board areas empty and offsets the entire map into view', () => {
  render(<MapLayout layout={offsetMapLayout} />);
  expect(screen.getAllByAltText('Steel Tile')).toHaveLength(229);
  expect(screen.getByRole('region', { name: 'Start board start' })).toHaveStyle({ left: '0px', top: '0px' });
  expect(screen.getByRole('region', { name: 'Game board game-1' })).toHaveStyle({ left: '260px', top: '156px' });
  expect(screen.getByRole('region', { name: 'Map layout' })).toHaveStyle({ width: '1298px', height: '934px' });
});

it('renders rotated directions while keeping checkpoint labels upright', () => {
  const layout: MapLayoutData = {
    boards: [
      start,
      {
        ...game,
        rotation: 90,
        tiles: [
          { x: 0, y: 0, pushPanel: { direction: 'NORTH', activeRegisters: [2, 4] } },
          { x: 1, y: 1, checkpointNumber: 7 },
        ],
      },
    ],
  };
  const { container } = render(<MapLayout layout={layout} />);
  expect(screen.getByRole('figure', { name: 'Push panel east, registers 2, 4' })).toHaveTextContent('→');
  expect(screen.getByText('7')).toBeInTheDocument();
  expect(container.querySelector('[style*="rotate"]')).toBeNull();
});

it('shows an accessible error instead of rendering an invalid map', () => {
  render(<MapLayout layout={{ boards: [start] }} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Map layout is invalid');
  expect(screen.queryByRole('region', { name: 'Map layout' })).not.toBeInTheDocument();
});

it('preserves arbitrary backend grid dimensions and special tile placement', () => {
  const { container } = render(<TileGrid width={12} height={12} layoutData={[{ x: 11, y: 11, checkpointNumber: 3 }]} />);
  expect(screen.getAllByAltText('Steel Tile')).toHaveLength(144);
  expect(container.firstElementChild).toHaveStyle({ gridTemplateColumns: 'repeat(12, 50px)' });
  expect(container.firstElementChild?.lastElementChild).toContainElement(screen.getByText('3'));
});

it('allows a game board to attach to the west of another game board away from the start', () => {
  expect(errorsFor(start, game, { ...game, id: 'south', x: 3, y: 10 }, { ...game, id: 'west', x: -7, y: 11 })).toBe('');
});

it('places a live robot using global coordinates across the board seam', () => {
  const robot = { playerId: 'pilot', x: 2, y: 4, direction: 'EAST' as const, avatarId: 1 as const, hue: 0 };
  const { rerender } = render(<MapLayout layout={defaultMapLayout} robots={[robot]} />);

  expect(screen.getByAltText('Robot Player 1').parentElement).toHaveStyle({ left: '104px', top: '208px' });

  rerender(<MapLayout layout={defaultMapLayout} robots={[{ ...robot, x: 3 }]} />);

  expect(screen.getByAltText('Robot Player 1').parentElement).toHaveStyle({ left: '156px', top: '208px' });
  expect(screen.getByRole('region', { name: 'Start board start' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Game board game-1' })).toBeInTheDocument();
});
