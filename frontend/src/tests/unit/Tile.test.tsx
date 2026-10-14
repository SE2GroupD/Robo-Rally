import { render, screen } from '@testing-library/react';
import { Tile } from '../../features/game/components/map/boards/Tile';

it('shows a push panel with its direction and active registers', () => {
  render(<Tile tile={{ x: 0, y: 0, pushPanel: { direction: 'SOUTH', activeRegisters: [1, 3, 5] } }} />);
  const panel = screen.getByRole('figure', { name: 'Push panel south, registers 1, 3, 5' });
  expect(panel).toHaveTextContent('↓');
  expect(panel).toHaveTextContent('135');
});

it('shows an express conveyor in its direction', () => {
  render(<Tile tile={{ x: 0, y: 0, conveyor: { direction: 'EAST', isExpress: true } }} />);
  const belt = screen.getByRole('img', { name: 'Express conveyor east' });
  expect(belt).toHaveAttribute('src', expect.stringContaining('conveyor2.png'));
  expect(belt).toHaveStyle({ transform: 'rotate(0deg)' });
});

it.each([
  [{ north: true, east: true }, 0],
  [{ east: true, south: true }, 90],
  [{ south: true, west: true }, 180],
  [{ west: true, north: true }, 270],
] as const)('renders adjacent walls %j with the corner artwork rotated %i degrees', (walls, rotation) => {
  render(<Tile tile={{ x: 0, y: 0, walls, checkpointNumber: 1 }} />);

  const corner = screen.getByRole('img', { name: /^Walls / });
  expect(corner).toHaveAttribute('src', expect.stringContaining('two_wall.png'));
  expect(corner).toHaveStyle({ transform: `rotate(${rotation}deg)` });
  expect(corner.style.clipPath).toContain('polygon');
  expect(screen.queryByRole('img', { name: /^Wall / })).not.toBeInTheDocument();
});

it.each([
  { north: true },
  { north: true, south: true },
  { east: true, west: true },
  { north: true, east: true, south: true },
  { north: true, east: true, south: true, west: true },
])('keeps individual wall strips for %j', (walls) => {
  render(<Tile tile={{ x: 0, y: 0, walls }} />);

  expect(screen.queryByRole('img', { name: /^Walls / })).not.toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: /^Wall / })).toHaveLength(Object.keys(walls).length);
});
