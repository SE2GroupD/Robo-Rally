import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import type { RobotState } from '../../features/game/types/Board';
import { BrowserRouter } from 'react-router-dom';
import { neon } from '../../features/auth/lib/neon';

vi.mock('../../features/auth/lib/neon', () => ({
  neon: {
    useSession: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@neondatabase/neon-js/auth', () => {
  return {
    createAuthClient: () => ({
      getSession: vi.fn().mockResolvedValue({
        data: { session: { token: 'mock-jwt-token' }, user: { name: 'pilot', email: 'pilot@example.com' } },
        error: null,
      }),
    }),
  };
});

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

vi.mock('../../features/game/components/map/Map', () => ({
  Map: ({ robot }: { robot: RobotState }) => (
    <output aria-label="Robot position">{`${robot.board}:${robot.x},${robot.y}`}</output>
  ),
}));

const mockFetch = vi.fn();

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  mockFetch.mockReset();

  vi.mocked(neon.useSession).mockReturnValue({
    data: { session: { token: 'mock-token' }, user: { name: 'pilot', email: 'pilot@example.com' } },
    isPending: false,
    error: null,
  } as any);

  let roomStatus = 'WAITING';

  mockFetch.mockImplementation(async (url, init) => {
    const endpoint = String(url);

    const createResponse = (body: any) => ({
      ok: true,
      status: 200,
      clone: function () {
        return this;
      },
      text: async () => JSON.stringify(body),
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => body,
    });

    if (endpoint.includes('/hand')) {
      return createResponse({
        cards: ['MOVE_1', 'POWER_UP', 'POWER_UP', 'POWER_UP', 'POWER_UP'],
        drawPileCount: 5,
        discardPileCount: 0,
        playerId: 'pilot',
        lockedRegisters: [],
        isLockedIn: false,
      });
    }

    const hostRoom = {
      gameId: 'real-room',
      roomCode: 'ABC234',
      playerId: 'host-id',
      hostPlayerId: 'host-id',
      status: roomStatus,
      players: [{ playerId: 'host-id', playerName: 'pilot' }],
    };

    const guestRoom = {
      ...hostRoom,
      playerId: 'guest-id',
      players: [
        { playerId: 'host-id', playerName: 'pilot' },
        { playerId: 'guest-id', playerName: 'guest' },
      ],
    };

    if (endpoint.includes('/games/join')) return createResponse(guestRoom);
    if (endpoint.endsWith('/start')) {
      roomStatus = 'STARTED';
      return createResponse({ ...hostRoom, status: 'STARTED' });
    }
    if (endpoint.endsWith('/leave')) return createResponse({});
    if (endpoint.includes('/games')) {
      if (init?.body && String(init.body).includes('guest')) return createResponse(guestRoom);
      return createResponse(hostRoom);
    }
    if (endpoint.includes('/registers')) return createResponse({});

    return createResponse({});
  });

  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => vi.unstubAllGlobals());

describe('application navigation', () => {
  it('supports logout and back navigation', async () => {
    const user = userEvent.setup();
    renderApp();
    await expectPath('/main-menu');
    expect(screen.getByText('Pilot pilot')).toBeInTheDocument();

    vi.mocked(neon.useSession).mockReturnValue({ data: null, isPending: false, error: null } as any);
    await user.click(screen.getByRole('button', { name: 'Log Out' }));
    await expectPath('/login');
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('preserves the robot position when leaving and reopens training', async () => {
    const user = userEvent.setup();
    renderApp();
    await expectPath('/main-menu');
    await user.click(screen.getByRole('button', { name: 'Start Training Run' }));
    await expectPath('/game');
    expect(screen.getByLabelText('Robot position')).toHaveTextContent('start:1,1');
    await screen.findByRole('button', { name: 'Ready' });

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
  it('redirects unsigned-in visitors to login', async () => {
    vi.mocked(neon.useSession).mockReturnValue({ data: null, isPending: false, error: null } as any);
    window.history.replaceState(null, '', '/game');
    renderApp();
    await expectPath('/login');
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('redirects signed-in visitors from auth pages to menu', async () => {
    window.history.replaceState(null, '', '/login');
    renderApp();
    await expectPath('/main-menu');
    expect(screen.getByText('Pilot pilot')).toBeInTheDocument();
  });

  it('redirects unknown paths to login if not authenticated', async () => {
    vi.mocked(neon.useSession).mockReturnValue({ data: null, isPending: false, error: null } as any);
    window.history.replaceState(null, '', '/unknown');
    renderApp();
    await expectPath('/login');
  });

  it('redirects unknown paths to main menu if authenticated', async () => {
    window.history.replaceState(null, '', '/unknown');
    renderApp();
    await expectPath('/main-menu');
  });
});

describe('room routes after the navigation merge', () => {
  it('creates a hosted run, moves its robot, and leaves using the server IDs', async () => {
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

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/game/real-room/hand'), expect.anything());
    await user.click(screen.getByRole('button', { name: 'Leave Room' }));
    await expectPath('/main-menu');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/games/real-room/leave'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('joins through the new route and returns to the menu after leaving', async () => {
    vi.mocked(neon.useSession).mockReturnValue({
      data: { session: { token: 'mock' }, user: { name: 'guest', email: 'guest@test.com' } },
      isPending: false,
      error: null,
    } as any);

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
