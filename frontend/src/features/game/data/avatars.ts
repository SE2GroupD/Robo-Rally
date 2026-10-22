import type { JoinedRoom } from '../api/gameApi';
import type { AvatarId } from '../types/Board';
import avatar1 from '../../../assets/avatars/avatar1.svg';
import avatar2 from '../../../assets/avatars/avatar2.svg';
import avatar3 from '../../../assets/avatars/avatar3.svg';
import avatar4 from '../../../assets/avatars/avatar4.svg';
import avatar5 from '../../../assets/avatars/avatar5.svg';
import avatar6 from '../../../assets/avatars/avatar6.svg';

export const AVATAR_MAP: Record<number, string> = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
};

// Resolve before ranking: fallback robot identity follows room order, not place.
export function playerAvatar(playerId: string, players: JoinedRoom['players']): AvatarId | null {
  const index = players.findIndex((player) => player.playerId === playerId);
  if (index < 0) return null;
  const selected = players[index].avatarId;
  return selected !== null && AVATAR_MAP[selected] ? (selected as AvatarId) : (((index % 6) + 1) as AvatarId);
}
