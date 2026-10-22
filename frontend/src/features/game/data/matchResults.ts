import type { JoinedRoom } from '../api/gameApi';
import type { BoardStateDto } from '../types/GameStateDto';
import type { MatchResults } from '../types/MatchResults';

export function createMatchResults(state: BoardStateDto, players: JoinedRoom['players']): MatchResults | null {
  if (!state.winner) return null;
  const winnerId = state.winner.playerId;
  const progress = new Map(state.checkpointProgress.map((entry) => [entry.playerId, entry.completedCheckpoints.length]));
  const participants = players.some((player) => player.playerId === winnerId)
    ? players
    : [...players, { playerId: winnerId, playerName: 'Unknown player', avatarId: null }];
  const sorted = participants
    .map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      avatarId: player.avatarId,
      completedCheckpoints: progress.get(player.playerId) ?? 0,
    }))
    .sort((a, b) => {
      if (a.playerId === winnerId) return -1;
      if (b.playerId === winnerId) return 1;
      return b.completedCheckpoints - a.completedCheckpoints;
    });
  let rank = 1;
  const standings = sorted.map((player, index) => {
    if (index === 1 || (index > 1 && player.completedCheckpoints !== sorted[index - 1].completedCheckpoints)) rank = index + 1;
    return { ...player, rank };
  });
  return {
    winnerId,
    courseName: state.layout?.name ?? 'Robo Rally',
    round: state.lastResolution?.round ?? state.round,
    totalCheckpoints: state.totalCheckpoints,
    standings,
  };
}
