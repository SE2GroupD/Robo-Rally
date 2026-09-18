import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgrammingCard } from '../../features/game/components/programming/ProgrammingCard';

it('provides a hand preview on keyboard focus and dismisses it with Escape', async () => {
  const user = userEvent.setup();
  const select = vi.fn();
  render(<ProgrammingCard type="MOVE_1" variant="hand" onClick={select} />);
  await user.tab();
  expect(screen.getByRole('button', { name: 'Move 1' })).toHaveFocus();
  expect(screen.getByRole('tooltip', { name: 'Move 1' })).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(select).toHaveBeenCalledOnce();
});

it('keeps a preview visible while the pointer moves into it', async () => {
  const user = userEvent.setup();
  render(<ProgrammingCard type="TURN_LEFT" variant="hand" />);
  await user.hover(screen.getByRole('button'));
  const preview = screen.getByRole('tooltip');
  fireEvent.mouseLeave(screen.getByRole('button'));
  fireEvent.mouseEnter(preview);
  expect(preview).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
