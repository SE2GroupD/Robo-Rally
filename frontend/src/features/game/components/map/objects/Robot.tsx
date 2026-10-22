import type { AvatarId } from '../../../types/Board';

import { AVATAR_MAP } from '../../../data/avatars';

interface RobotProps {
  avatarId: AvatarId;
  hueRotation?: number;
  rotation?: number;
}

export function Robot({ avatarId, hueRotation = 0, rotation = 0 }: RobotProps) {
  // Fallback to avatar1 if an invalid ID is passed somehow
  const imageSrc = AVATAR_MAP[avatarId] || AVATAR_MAP[1];

  return (
    <img
      src={imageSrc}
      alt={`Robot Player ${avatarId}`}
      className="w-10 h-10 transition-all duration-300 ease-in-out"
      style={{
        filter: `hue-rotate(${hueRotation}deg)`,
        transform: `rotate(${rotation}deg)`,
      }}
    />
  );
}
