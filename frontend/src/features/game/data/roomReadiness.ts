import type { JoinedRoom } from '../api/gameApi';

export function roomStartBlockReason(players: JoinedRoom['players']): string | null {
  if (players.length < 2) return 'Waiting for at least 2 players to join.';
  const unready = players.filter((player) => player.avatarId == null || player.startPosition == null);
  if (!unready.length) return null;
  const details = unready.map((player) => {
    const missing: string[] = [];
    if (player.avatarId == null) missing.push('a robot');
    if (player.startPosition == null) missing.push('a start tile');
    return `${player.playerName} to select ${missing.join(' and ')}`;
  });
  return `Waiting for ${details.join(', ')}.`;
}
