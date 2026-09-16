import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgrammingCard } from '../../features/game/components/programming/ProgrammingCard';

it.each(['hand', 'program'] as const)('keeps the %s card clickable and keyboard accessible without a popup', async (variant) => {
  const user = userEvent.setup();
  const select = vi.fn();
  render(<ProgrammingCard type="MOVE_1" variant={variant} onClick={select} />);
  const card = screen.getByRole('button', { name: 'Move 1' });
  await user.hover(card);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(screen.getAllByRole('img')).toHaveLength(1);
  await user.click(card);
  expect(select).toHaveBeenCalledOnce();
  await user.unhover(card);
  await user.tab();
  await user.tab();
  expect(card).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(select).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

it.each(['hand', 'program'] as const)('keeps disabled %s cards inactive', async (variant) => {
  const user = userEvent.setup();
  const select = vi.fn();
  render(<ProgrammingCard type="TURN_LEFT" variant={variant} disabled onClick={select} />);
  await user.hover(screen.getByRole('button'));
  await user.click(screen.getByRole('button'));
  await user.tab();
  expect(screen.getByRole('button')).not.toHaveFocus();
  expect(select).not.toHaveBeenCalled();
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
