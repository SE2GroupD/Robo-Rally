import { render, screen, within } from '@testing-library/react';
import { ProgramRegisters } from '../../features/game/components/programming/register/ProgramRegisters';

describe('Program Register', () => {
  it('renders five empty slots', () => {
    render(<ProgramRegisters />);

    const slots = within(screen.getByRole('list', { name: 'Program Register' })).getAllByRole('listitem');
    expect(slots).toHaveLength(5);
    slots.forEach((slot, index) => {
      expect(slot).toHaveTextContent(String(index + 1));
      expect(within(slot).queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('keeps cards in their assigned slots when other slots are empty', () => {
    render(<ProgramRegisters cards={[null, 'MOVE_1', null, null, 'TURN_LEFT']} />);

    expect(
      within(screen.getByRole('listitem', { name: 'Program Register slot 2' })).getByRole('img', { name: 'Move 1' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('listitem', { name: 'Program Register slot 5' })).getByRole('img', { name: 'Turn Left' }),
    ).toBeInTheDocument();
  });
});
