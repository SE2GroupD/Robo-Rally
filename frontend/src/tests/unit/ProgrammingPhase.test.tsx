import { act, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgrammingPhase } from '../../features/game/components/programming/ProgrammingPhase';
import { fetchPlayerHand, submitProgramRegister } from '../../features/game/api/gameApi';
import type { CardType } from '../../features/game/types/CardType';

vi.mock('../../features/game/api/gameApi', () => ({ fetchPlayerHand: vi.fn(), submitProgramRegister: vi.fn() }));

vi.mock('@neondatabase/neon-js/auth', () => ({
  createAuthClient: () => ({
    getSession: vi.fn().mockResolvedValue({
      data: { session: { token: 'mock-jwt-token' } },
      error: null,
    }),
  }),
}));

const cards: CardType[] = ['MOVE_1', 'MOVE_1', 'TURN_LEFT', 'TURN_RIGHT', 'MOVE_2', 'MOVE_3', 'POWER_UP', 'AGAIN', 'U_TURN'];
const handSlot = (index: number) => within(screen.getByRole('listitem', { name: `Hand slot ${index}` }));
const programSlot = (index: number) => within(screen.getByRole('listitem', { name: `Program Register slot ${index}` }));

beforeEach(() => {
  vi.mocked(fetchPlayerHand).mockReset().mockResolvedValue({
    cards,
    drawPileCount: 10,
    discardPileCount: 0,
    playerId: '',
    lockedRegisters: [],
    isLockedIn: false,
  });
  vi.mocked(submitProgramRegister).mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

it('renders nine empty hand slots before fetching and fills only returned positions', async () => {
  let resolveHand!: (value: Awaited<ReturnType<typeof fetchPlayerHand>>) => void;
  vi.mocked(fetchPlayerHand).mockReturnValue(
    new Promise((resolve) => {
      resolveHand = resolve;
    }),
  );
  render(<ProgrammingPhase roomId="room" round={1} />);
  expect(within(screen.getByRole('list', { name: 'Programming Hand' })).getAllByRole('listitem')).toHaveLength(9);
  expect(within(screen.getByRole('list', { name: 'Program Register' })).getAllByRole('listitem')).toHaveLength(5);
  expect(handSlot(1).queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ready' })).toBeDisabled();
  await act(async () =>
    resolveHand({
      playerId: 'pilot',
      cards: ['MOVE_1'],
      drawPileCount: 0,
      discardPileCount: 0,
      lockedRegisters: [],
      isLockedIn: false,
    }),
  );
  expect(handSlot(1).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
  for (let i = 2; i <= 9; i++) expect(handSlot(i).queryByRole('button')).not.toBeInTheDocument();
});

it('preserves duplicate card positions, fills the first empty register, and restores the hand on clear', async () => {
  const user = userEvent.setup();
  render(<ProgrammingPhase roomId="room" round={1} />);
  await handSlot(1).findByRole('button');
  await user.click(handSlot(2).getByRole('button'));
  await user.click(handSlot(1).getByRole('button'));
  expect(handSlot(1).queryByRole('button')).not.toBeInTheDocument();
  expect(handSlot(2).queryByRole('button')).not.toBeInTheDocument();
  expect(handSlot(3).getByRole('button', { name: 'Turn Left' })).toBeInTheDocument();
  await user.click(programSlot(1).getByRole('button'));
  expect(handSlot(2).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
  expect(handSlot(1).queryByRole('button')).not.toBeInTheDocument();
  await user.click(handSlot(9).getByRole('button'));
  expect(programSlot(1).getByRole('button', { name: 'U-Turn' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(handSlot(1).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
  expect(handSlot(2).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
  expect(handSlot(9).getByRole('button', { name: 'U-Turn' })).toBeInTheDocument();
  expect(within(screen.getByRole('list', { name: 'Program Register' })).queryAllByRole('button')).toHaveLength(0);
});

it('limits selection to five and submits only that sequence', async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  vi.mocked(submitProgramRegister).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  render(<ProgrammingPhase roomId="room" round={1} />);
  await handSlot(1).findByRole('button');
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  expect(submitProgramRegister).not.toHaveBeenCalled();
  for (const index of [9, 2, 5, 3, 7]) await user.click(handSlot(index).getByRole('button'));
  await user.click(handSlot(1).getByRole('button'));
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  const expected = ['U_TURN', 'MOVE_1', 'MOVE_2', 'TURN_LEFT', 'POWER_UP'];
  expect(submitProgramRegister).toHaveBeenCalledExactlyOnceWith('room', { registers: expected });
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  expect(programSlot(1).getByRole('button')).toBeDisabled();
  await act(async () => finish());
  expect(screen.getByRole('button', { name: 'Ready ✓' })).toBeDisabled();
  await user.click(programSlot(1).getByRole('button'));
  expect(handSlot(9).queryByRole('button')).not.toBeInTheDocument();
});

it('keeps a failed submission editable and does not execute it', async () => {
  const user = userEvent.setup();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(submitProgramRegister).mockRejectedValue(new Error('offline'));
  render(<ProgrammingPhase roomId="room" round={1} />);
  await handSlot(1).findByRole('button');
  for (let i = 1; i <= 5; i++) await user.click(handSlot(i).getByRole('button'));
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ready' })).toBeEnabled());
  await user.click(programSlot(2).getByRole('button'));
  expect(handSlot(2).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
});

it.each([0, 1, 4])('does not allow locking in %i cards', async (count) => {
  const user = userEvent.setup();
  render(<ProgrammingPhase roomId="room" round={1} />);
  await handSlot(1).findByRole('button');
  for (let i = 1; i <= count; i++) await user.click(handSlot(i).getByRole('button'));
  expect(screen.getByRole('button', { name: 'Ready' })).toBeDisabled();
  expect(submitProgramRegister).not.toHaveBeenCalled();
});

it('stays idle without a round and refetches the hand when the round changes', async () => {
  const { rerender } = render(<ProgrammingPhase roomId="room" round={null} />);
  expect(fetchPlayerHand).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Ready ✓' })).toBeDisabled();
  rerender(<ProgrammingPhase roomId="room" round={1} />);
  await handSlot(1).findByRole('button');
  rerender(<ProgrammingPhase roomId="room" round={2} />);
  await waitFor(() => expect(fetchPlayerHand).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('button', { name: 'Ready' })).toBeDisabled();
});
