import type { JoinedRoom } from '../../api/gameApi';
import type { BoardStateDto } from '../../types/GameStateDto';
function winnerLabel(state: BoardStateDto, players: JoinedRoom['players']) {
  if (!state.winner) return null;
  const winner = players.find((player) => player.playerId === state.winner?.playerId);
  return `${winner?.playerName ?? 'Unknown player'}${winner?.avatarId ? ` · Robot ${winner.avatarId}` : ''}`;
}

export function MatchWinner({ state, players }: { state: BoardStateDto; players: JoinedRoom['players'] }) {
  return (
    <section
      aria-label="Match winner"
      className="absolute inset-x-3 top-28 z-30 mx-auto max-w-sm rounded border border-metal-light bg-slate-950/95 p-4 text-center text-white shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
    >
      <h2 className="m-0 text-sm font-bold text-metal-light">Winner</h2>
      <p className="m-0 mt-2 text-xl font-bold">{winnerLabel(state, players)}</p>
    </section>
  );
}
