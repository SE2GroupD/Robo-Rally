import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapZoomControls } from '../../features/game/components/map/MapZoomControls';

it('supports keyboard zoom and disables the control at each limit', async () => {
  const user = userEvent.setup();
  const onZoomIn = vi.fn();
  const onZoomOut = vi.fn();
  const { rerender } = render(<MapZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} canZoomIn canZoomOut={false} />);
  expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onZoomIn).toHaveBeenCalledOnce();
  rerender(<MapZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} canZoomIn={false} canZoomOut />);
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Zoom out' }));
  expect(onZoomOut).toHaveBeenCalledOnce();
});
