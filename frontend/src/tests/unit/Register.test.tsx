import { render, screen, within } from '@testing-library/react';
import { ProgramRegister } from '../../shared/components/program-register/ProgramRegister';

describe('Program Register', () => {
  it('renders five empty slots', () => {
    render(<ProgramRegister />);

    const slots = within(screen.getByRole('list', { name: 'Program Register' })).getAllByRole('listitem');
    expect(slots).toHaveLength(5);
    slots.forEach((slot) => expect(slot).toHaveTextContent(''));
  });

  it('keeps cards in their assigned slots when other slots are empty', () => {
    render(
      <ProgramRegister
        cards={[null, <article key="move">Move 1</article>, null, null, <article key="turn">Turn left</article>]}
      />,
    );

    expect(within(screen.getByRole('listitem', { name: 'Program Register slot 2' })).getByText('Move 1')).toBeInTheDocument();
    expect(within(screen.getByRole('listitem', { name: 'Program Register slot 5' })).getByText('Turn left')).toBeInTheDocument();
  });
});
