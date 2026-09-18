import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import type { RobotState } from '../../features/game/types/Board';
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

describe('room routes after the navigation merge', () => {
  const room = {
    gameId: 'real-room',
    roomCode: 'ABC234',
    playerId: 'host-id',
    hostPlayerId: 'host-id',
    status: 'WAITING',
    players: [{ playerId: 'host-id', playerName: 'pilot' }],
  };

  it('creates a hosted run, moves its robot, and leaves using the server IDs', async () => {
    let status = 'WAITING';
    const requests = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/start')) status = 'STARTED';
      const data = url.endsWith('/hand') ? { cards: ['MOVE_1'], drawPileCount: 0, discardPileCount: 0 } : { ...room, status };
      return { ok: true, status: 200, json: async () => data };
    });
    vi.stubGlobal('fetch', requests);
    sessionStorage.setItem(PILOT_SESSION_KEY, JSON.stringify({ username: 'pilot' }));
    window.history.replaceState(null, '', '/main-menu');
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Host Battle' }));
    await expectPath('/host-battle');
    expect(await screen.findByText('ABC234')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start Battle' }));
    expect(await screen.findByLabelText('Robot position')).toHaveTextContent('start:1,1');
    await screen.findByRole('img', { name: 'Move 1' });
    const hand = within(screen.getByRole('heading', { name: 'Your Hand' }).parentElement!);
    await user.click(hand.getAllByRole('button')[0]);
    await user.click(screen.getByRole('button', { name: 'Ready' }));
    await waitFor(() => expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:2,1'));
    expect(requests).toHaveBeenCalledWith(expect.stringContaining('/game/real-room/player/host-id/hand'));
    await user.click(screen.getByRole('button', { name: 'Leave Room' }));
    await expectPath('/main-menu');
    expect(requests).toHaveBeenCalledWith(
      expect.stringContaining('/games/real-room/leave'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ playerId: 'host-id' }),
      }),
    );
  });

  it('joins through the new route and returns to the menu after leaving', async () => {
    const guest = { ...room, playerId: 'guest-id', players: [...room.players, { playerId: 'guest-id', playerName: 'guest' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => guest }));
    sessionStorage.setItem(PILOT_SESSION_KEY, JSON.stringify({ username: 'guest' }));
    window.history.replaceState(null, '', '/main-menu');
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Join Battle' }));
    await expectPath('/join-battle');
    await user.type(screen.getByLabelText('Room code'), 'ABC234');
    await user.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(await screen.findByText('Guest · You')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Battle' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave Room' }));
    await expectPath('/main-menu');
    await user.click(screen.getByRole('button', { name: 'Join Battle' }));
    expect(screen.getByLabelText('Room code')).toHaveValue('');
  });
});
