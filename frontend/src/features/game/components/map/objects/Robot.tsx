import type { AvatarId } from '../../../types/Board';

import avatar1 from '../../../../../assets/avatars/avatar1.svg';
import avatar2 from '../../../../../assets/avatars/avatar2.svg';
import avatar3 from '../../../../../assets/avatars/avatar3.svg';
import avatar4 from '../../../../../assets/avatars/avatar4.svg';
import avatar5 from '../../../../../assets/avatars/avatar5.svg';
import avatar6 from '../../../../../assets/avatars/avatar6.svg';

// Create a dictionary mapping the ID to the imported image
const AVATAR_MAP: Record<number, string> = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
};

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
