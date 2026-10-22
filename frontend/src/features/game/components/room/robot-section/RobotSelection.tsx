import { Button } from '../../../../../foundation/components/button/Button';

import { AVATAR_MAP } from '../../../data/avatars';

interface RobotSelectionProps {
  selectedAvatarId: number | null;
  takenAvatarIds: number[];
  disabled?: boolean;
  onSelect: (avatarId: number) => void;
}

export function RobotSelection({ selectedAvatarId, takenAvatarIds, disabled = false, onSelect }: RobotSelectionProps) {
  return (
    <section className="rounded border border-metal-light p-4">
      <h2 className="mb-3 mt-0 text-lg font-bold">Select your robot</h2>

      <div className="grid auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5, 6].map((avatarId) => {
          const selected = selectedAvatarId === avatarId;
          const taken = takenAvatarIds.includes(avatarId);

          return (
            <Button
              key={avatarId}
              type="button"
              disabled={disabled || taken}
              onClick={() => onSelect(avatarId)}
              variant="secondary"
              size="small"
              aria-pressed={selected}
              className="flex min-h-14 items-center justify-center"
            >
              <img src={AVATAR_MAP[avatarId]} alt={`Robot ${avatarId}`} className="h-8 w-8" />
            </Button>
          );
        })}
      </div>
    </section>
  );
}
