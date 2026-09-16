import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import type { RobotState } from '../../features/game/types/board';

// Keep real pages, programming UI, and movement state; expose the map position
// without rendering hundreds of tiles in these navigation regression tests.
vi.mock('../../features/game/components/map/Map', () => ({
  Map: ({ robot }: { robot: RobotState }) => (
    <output aria-label="Robot position">{`${robot.board}:${robot.x},${robot.y}`}</output>
  ),
}));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        cards: ['MOVE_1', 'POWER_UP', 'POWER_UP', 'POWER_UP', 'POWER_UP'],
        drawPileCount: 5,
        discardPileCount: 0,
      }),
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('application navigation', () => {
  it('supports login, back navigation, and logout', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await user.type(screen.getByLabelText('Email'), 'pilot@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Log In' }));
    expect(screen.getByText('Pilot pilot')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Log Out' }));
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('opens registration, returns to login, and allows registration guests', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await user.click(screen.getByRole('button', { name: 'Register here' }));
    expect(screen.getByText(/Pilot registration is not connected yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Login' }));
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Register here' }));
    await user.click(screen.getByRole('button', { name: 'Play as Guest' }));
    expect(screen.getByText(/^Pilot Guest_\d{4}$/)).toBeInTheDocument();
  });

  it('preserves the robot position when a guest leaves and reopens training', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await user.click(screen.getByRole('button', { name: 'Play as Guest' }));
    await user.click(screen.getByRole('button', { name: 'Start Training Run' }));
    expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:1,1');
    await screen.findByRole('button', { name: 'Lock In' });
    // Select each card from the hand, leaving register cards untouched.
    await waitFor(() => expect(screen.getAllByRole('img', { name: /Move 1|Power Up/ })).toHaveLength(5));
    const hand = within(screen.getByRole('heading', { name: 'Your Hand' }).parentElement!);
    for (let index = 0; index < 5; index++) {
      await user.click(hand.getAllByRole('button')[0]);
    }
    await user.click(screen.getByRole('button', { name: 'Lock In' }));
    await waitFor(() => expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:2,1'));
    await user.click(screen.getByRole('button', { name: /Back to Menu/ }));
    await user.click(screen.getByRole('button', { name: 'Start Training Run' }));
    expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:2,1');
  });
});
