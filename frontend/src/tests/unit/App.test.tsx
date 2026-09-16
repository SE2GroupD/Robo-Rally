import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import type { RobotState } from '../../features/game/types/board';
import { BrowserRouter } from 'react-router-dom';
import { PILOT_SESSION_KEY } from '../../app/useAppNavigation';

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

async function expectPath(path: string) {
  await waitFor(() => expect(window.location.pathname).toBe(path));
}

// Keep real pages, programming UI, and movement state; expose the map position
// without rendering hundreds of tiles in these navigation regression tests.
vi.mock('../../features/game/components/map/Map', () => ({
  Map: ({ robot }: { robot: RobotState }) => (
    <output aria-label="Robot position">{`${robot.board}:${robot.x},${robot.y}`}</output>
  ),
}));

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  sessionStorage.clear();
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
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await expectPath('/login');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await expectPath('/login');
    await user.type(screen.getByLabelText('Email'), 'pilot@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Log In' }));
    await expectPath('/main-menu');
    expect(JSON.parse(sessionStorage.getItem(PILOT_SESSION_KEY)!)).toEqual({ username: 'pilot', email: 'pilot@example.com' });
    expect(screen.getByText('Pilot pilot')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Log Out' }));
    await expectPath('/');
    expect(sessionStorage.getItem(PILOT_SESSION_KEY)).toBeNull();
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('opens registration, returns to login, and allows registration guests', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await expectPath('/login');
    await user.click(screen.getByRole('button', { name: 'Register here' }));
    await expectPath('/register');
    expect(screen.getByText(/Pilot registration is not connected yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Login' }));
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Register here' }));
    await expectPath('/register');
    await user.click(screen.getByRole('button', { name: 'Play as Guest' }));
    await expectPath('/main-menu');
    expect(screen.getByText(/^Pilot Guest_\d{4}$/)).toBeInTheDocument();
  });

  it('preserves the robot position when a guest leaves and reopens training', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    await expectPath('/login');
    await user.click(screen.getByRole('button', { name: 'Play as Guest' }));
    await expectPath('/main-menu');
    await user.click(screen.getByRole('button', { name: 'Start Training Run' }));
    await expectPath('/game');
    expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:1,1');
    await screen.findByRole('button', { name: 'Ready' });
    // Select each card from the hand, leaving register cards untouched.
    await waitFor(() => expect(screen.getAllByRole('img', { name: /Move 1|Power Up/ })).toHaveLength(5));
    const hand = within(screen.getByRole('heading', { name: 'Your Hand' }).parentElement!);
    for (let index = 0; index < 5; index++) {
      await user.click(hand.getAllByRole('button')[0]);
    }
    await user.click(screen.getByRole('button', { name: 'Ready' }));
    await waitFor(() => expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:2,1'));
    await user.click(screen.getByRole('button', { name: /Back to Menu/ }));
    await user.click(screen.getByRole('button', { name: 'Start Training Run' }));
    await expectPath('/game');
    expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:2,1');
  });
});

describe('URL and session recovery', () => {
  it('loads registration directly and after a reload', () => {
    window.history.replaceState(null, '', '/register');
    const app = renderApp();
    expect(screen.getByText('Pilot Registration')).toBeInTheDocument();
    app.unmount();
    renderApp();
    expect(screen.getByText('Pilot Registration')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/register');
  });

  it.each(['/main-menu', '/game'])('restores the pilot when reloading %s', async (path) => {
    window.history.replaceState(null, '', path);
    sessionStorage.setItem(PILOT_SESSION_KEY, JSON.stringify({ username: 'Guest_1234' }));
    const app = renderApp();
    await expectPath(path);
    app.unmount();
    renderApp();
    await expectPath(path);
    if (path === '/game') {
      expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:1,1');
    } else {
      expect(screen.getByText('Pilot Guest_1234')).toBeInTheDocument();
    }
  });

  it.each(['/main-menu', '/game'])('redirects unsigned-in visitors from %s', async (path) => {
    window.history.replaceState(null, '', path);
    renderApp();
    await expectPath('/login');
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it.each(['invalid json', 'null', '[]', '{}', '{"username":" "}', '{"username":4}', '{"username":"pilot","email":4}'])(
    'ignores invalid session data: %s',
    async (stored) => {
      sessionStorage.setItem(PILOT_SESSION_KEY, stored);
      window.history.replaceState(null, '', '/game');
      renderApp();
      await expectPath('/login');
    },
  );

  it('handles unavailable storage during restore, login, and logout', async () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('Storage disabled');
      },
      setItem: () => {
        throw new Error('Storage disabled');
      },
      removeItem: () => {
        throw new Error('Storage disabled');
      },
    });
    window.history.replaceState(null, '', '/game');
    const user = userEvent.setup();
    renderApp();
    await expectPath('/login');
    await user.click(screen.getByRole('button', { name: 'Play as Guest' }));
    await expectPath('/main-menu');
    await user.click(screen.getByRole('button', { name: 'Log Out' }));
    await expectPath('/');
  });

  it.each(['/', '/login', '/register', '/unknown'])('redirects signed-in visitors from %s to the menu', async (path) => {
    sessionStorage.setItem(PILOT_SESSION_KEY, JSON.stringify({ username: 'pilot' }));
    window.history.replaceState(null, '', path);
    renderApp();
    await expectPath('/main-menu');
    expect(screen.getByText('Pilot pilot')).toBeInTheDocument();
  });

  it('redirects unknown unsigned-in routes to the front page', async () => {
    window.history.replaceState(null, '', '/unknown');
    renderApp();
    await expectPath('/');
    expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
  });

  it('supports browser Back/Forward and guards game history after logout', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/login');
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Register here' }));
    await expectPath('/register');
    await act(async () => window.history.back());
    await expectPath('/login');
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    await act(async () => window.history.forward());
    await expectPath('/register');
    await user.click(screen.getByRole('button', { name: 'Play as Guest' }));
    await expectPath('/main-menu');
    await user.click(screen.getByRole('button', { name: 'Start Training Run' }));
    await expectPath('/game');
    await user.click(screen.getByRole('button', { name: /Back to Menu/ }));
    await expectPath('/main-menu');
    await user.click(screen.getByRole('button', { name: 'Log Out' }));
    await expectPath('/');
    await act(async () => window.history.back());
    await expectPath('/login');
    expect(screen.queryByLabelText('Robot position')).not.toBeInTheDocument();
  });
});
