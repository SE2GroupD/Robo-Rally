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
  expect(screen.getByText('→')).toHaveClass('text-blue-500');
});

it('marks the current player robot on the board', () => {
  render(
    <Tile
      tile={{
        x: 0,
        y: 0,
        robot: { avatarId: 1, hue: 0, direction: 'EAST', isCurrentPlayer: true },
      }}
    />,
  );

  expect(screen.getByLabelText('Your robot')).toHaveTextContent('YOU');
});
