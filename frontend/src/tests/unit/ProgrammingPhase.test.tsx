import { act, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgrammingPhase } from '../../features/game/components/programming/ProgrammingPhase';
import { fetchPlayerHand, submitProgramRegister } from '../../features/game/api/gameApi';
import type { CardType } from '../../features/game/types/CardType';

vi.mock('../../features/game/api/gameApi', () => ({ fetchPlayerHand: vi.fn(), submitProgramRegister: vi.fn() }));

const cards: CardType[] = ['MOVE_1', 'MOVE_1', 'TURN_LEFT', 'TURN_RIGHT', 'MOVE_2', 'MOVE_3', 'POWER_UP', 'AGAIN', 'U_TURN'];
const handSlot = (index: number) => within(screen.getByRole('listitem', { name: `Hand slot ${index}` }));
const programSlot = (index: number) => within(screen.getByRole('listitem', { name: `Program Register slot ${index}` }));

beforeEach(() => {
  vi.mocked(fetchPlayerHand).mockReset().mockResolvedValue({ playerId: 'pilot', cards, drawPileCount: 10, discardPileCount: 0 });
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
  render(<ProgrammingPhase roomId="room" />);
  expect(within(screen.getByRole('list', { name: 'Programming Hand' })).getAllByRole('listitem')).toHaveLength(9);
  expect(within(screen.getByRole('list', { name: 'Program Register' })).getAllByRole('listitem')).toHaveLength(5);
  expect(handSlot(1).queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ready' })).toBeDisabled();
  await act(async () => resolveHand({ playerId: 'pilot', cards: ['MOVE_1'], drawPileCount: 0, discardPileCount: 0 }));
  expect(handSlot(1).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
  for (let i = 2; i <= 9; i++) expect(handSlot(i).queryByRole('button')).not.toBeInTheDocument();
});

it('preserves duplicate card positions, fills the first empty register, and restores the hand on clear', async () => {
  const user = userEvent.setup();
  render(<ProgrammingPhase roomId="room" />);
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

it('limits selection to five and executes only the submitted sequence after success', async () => {
  const user = userEvent.setup();
  const onLockIn = vi.fn();
  let finish!: () => void;
  vi.mocked(submitProgramRegister).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  render(<ProgrammingPhase roomId="room" onLockIn={onLockIn} />);
  await handSlot(1).findByRole('button');
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  expect(submitProgramRegister).not.toHaveBeenCalled();
  for (const index of [9, 2, 5, 3, 7]) await user.click(handSlot(index).getByRole('button'));
  await user.click(handSlot(1).getByRole('button'));
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  const expected = ['U_TURN', 'MOVE_1', 'MOVE_2', 'TURN_LEFT', 'POWER_UP'];
  expect(submitProgramRegister).toHaveBeenCalledExactlyOnceWith('room', { registers: expected });
  expect(onLockIn).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  expect(programSlot(1).getByRole('button')).toBeDisabled();
  await act(async () => finish());
  expect(onLockIn).toHaveBeenCalledExactlyOnceWith(expected);
  expect(screen.getByRole('button', { name: 'Ready ✓' })).toBeDisabled();
  await user.click(programSlot(1).getByRole('button'));
  expect(handSlot(9).queryByRole('button')).not.toBeInTheDocument();
});

it('keeps a failed submission editable and does not execute it', async () => {
  const user = userEvent.setup();
  const onLockIn = vi.fn();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(submitProgramRegister).mockRejectedValue(new Error('offline'));
  render(<ProgrammingPhase roomId="room" onLockIn={onLockIn} />);
  await handSlot(1).findByRole('button');
  for (let i = 1; i <= 5; i++) await user.click(handSlot(i).getByRole('button'));
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ready' })).toBeEnabled());
  expect(onLockIn).not.toHaveBeenCalled();
  await user.click(programSlot(2).getByRole('button'));
  expect(handSlot(2).getByRole('button', { name: 'Move 1' })).toBeInTheDocument();
});

it.each([1, 2, 3, 4])('submits and executes a %i-card program', async (count) => {
  const user = userEvent.setup();
  const onLockIn = vi.fn();
  render(<ProgrammingPhase roomId="room" onLockIn={onLockIn} />);
  await handSlot(1).findByRole('button');
  const indexes = [5, 3, 9, 2].slice(0, count);
  for (const index of indexes) await user.click(handSlot(index).getByRole('button'));
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  const expected = indexes.map((index) => cards[index - 1]);
  expect(submitProgramRegister).toHaveBeenCalledExactlyOnceWith('room', { registers: expected });
  expect(onLockIn).toHaveBeenCalledExactlyOnceWith(expected);
  expect(screen.getByRole('button', { name: 'Ready ✓' })).toBeDisabled();
});

it('skips empty slots while preserving the remaining register order', async () => {
  const user = userEvent.setup();
  const onLockIn = vi.fn();
  render(<ProgrammingPhase roomId="room" onLockIn={onLockIn} />);
  await handSlot(1).findByRole('button');
  for (const index of [5, 3, 9, 2]) await user.click(handSlot(index).getByRole('button'));
  await user.click(programSlot(1).getByRole('button'));
  await user.click(programSlot(3).getByRole('button'));
  await user.click(screen.getByRole('button', { name: 'Ready' }));
  const expected = ['TURN_LEFT', 'MOVE_1'];
  expect(submitProgramRegister).toHaveBeenCalledExactlyOnceWith('room', { registers: expected });
  expect(onLockIn).toHaveBeenCalledExactlyOnceWith(expected);
});
