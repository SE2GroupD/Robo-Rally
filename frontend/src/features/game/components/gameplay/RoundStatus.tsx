import type { JoinedRoom } from '../../api/gameApi';
import type { BoardStateDto } from '../../types/GameStateDto';
interface RoundStatusProps {
  state: BoardStateDto;
  players: JoinedRoom['players'];
  currentPlayerId: string;
  isReplaying: boolean;
}

export function RoundStatus({ state, players, currentPlayerId, isReplaying }: RoundStatusProps) {
  if (state.winner) return null;
  if (isReplaying) {
    return (
      <section
        aria-live="polite"
        className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-1.5 text-sm text-slate-200 shadow-lg"
      >
        <span className="font-black text-cyan-300">Round {state.round - 1}</span>
        <span className="mx-2 text-slate-500">•</span>
        Resolving moves…
      </section>
    );
  }

  const waitingFor = players.filter((player) => !state.lockedInPlayerIds.includes(player.playerId));
  const isYourTurn = waitingFor.some((player) => player.playerId === currentPlayerId);

  return (
    <section
      aria-live="polite"
      className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-1.5 text-sm text-slate-200 shadow-lg backdrop-blur-sm"
    >
      <span className="font-black text-cyan-300">Round {state.round}</span>
      <span className="text-slate-500">•</span>
      {isYourTurn ? (
        <>
          <span className="font-black text-cyan-300">Your turn</span>
          <span className="text-slate-300">Choose 5 cards</span>
        </>
      ) : waitingFor.length > 0 ? (
        <>
          <span className="text-slate-300">Waiting for</span>
          <span className="font-medium text-white">{waitingFor.map((player) => player.playerName).join(', ')}</span>
        </>
      ) : (
        <span className="text-slate-300">All players are ready</span>
      )}
    </section>
  );
}
