import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterButtons } from '../../features/game/components/programming/register/RegisterButtons';

it('places Ready before Clear and calls each action', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const onClear = vi.fn();
  render(<RegisterButtons onSubmit={onSubmit} onClear={onClear} selectedCount={1} isSubmitting={false} isLockedIn={false} />);
  expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Ready', 'Clear']);
  await user.tab();
  expect(screen.getByRole('button', { name: 'Ready' })).toHaveFocus();
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(onSubmit).toHaveBeenCalledOnce();
  expect(onClear).toHaveBeenCalledOnce();
});

it.each([
  { selectedCount: 0, isSubmitting: false, isLockedIn: false, label: 'Ready' },
  { selectedCount: 2, isSubmitting: true, isLockedIn: false, label: 'Submitting…' },
  { selectedCount: 2, isSubmitting: false, isLockedIn: true, label: 'Ready ✓' },
])('disables actions in state $label with $selectedCount cards', async ({ label, ...state }) => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const onClear = vi.fn();
  render(<RegisterButtons {...state} onSubmit={onSubmit} onClear={onClear} />);
  const ready = screen.getByRole('button', { name: label });
  expect(ready).toBeDisabled();
  expect(ready).toHaveAttribute('data-ready');
  expect(ready).toHaveAttribute('aria-busy', String(state.isSubmitting));
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  await user.click(ready);
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onClear).not.toHaveBeenCalled();
});
