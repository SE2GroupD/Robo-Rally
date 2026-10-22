import { AVATAR_MAP } from '../../../data/avatars';

export function ResultRobot({ avatarId, className }: { avatarId: number | null; className: string }) {
  const source = avatarId === null ? undefined : AVATAR_MAP[avatarId];
  return source ? (
    <img src={source} alt={`Robot ${avatarId}`} className={`object-contain ${className}`} />
  ) : (
    <span
      aria-label="Robot unavailable"
      className={`flex items-center justify-center rounded border border-dashed border-metal-dark text-3xl text-metal ${className}`}
    >
      ?
    </span>
  );
}
