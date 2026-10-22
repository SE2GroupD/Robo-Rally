import { playerAvatar } from './avatars';
import type { JoinedRoom } from '../api/gameApi';
import type { CheckpointProgressDto } from '../types/GameStateDto';
import type { RaceStanding } from '../types/MatchResults';

export function rankRacePlayers(
  players: JoinedRoom['players'],
  checkpoints: readonly CheckpointProgressDto[],
  winnerId?: string,
): RaceStanding[] {
  const progress = new Map(checkpoints.map((entry) => [entry.playerId, entry.completedCheckpoints.length]));
  const participants =
    !winnerId || players.some((player) => player.playerId === winnerId)
      ? players
      : [...players, { playerId: winnerId, playerName: 'Unknown player', avatarId: null }];
  const sorted = participants
    .map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      avatarId: playerAvatar(player.playerId, players),
      completedCheckpoints: progress.get(player.playerId) ?? 0,
    }))
    .sort((a, b) => {
      if (a.playerId === winnerId) return -1;
      if (b.playerId === winnerId) return 1;
      return b.completedCheckpoints - a.completedCheckpoints;
    });
  let rank = 1;
  return sorted.map((player, index) => {
    if (
      index > 0 &&
      (sorted[index - 1].playerId === winnerId || player.completedCheckpoints !== sorted[index - 1].completedCheckpoints)
    )
      rank = index + 1;
    return { ...player, rank };
  });
}
