import { Button } from '../../../../foundation/components/button/Button';

interface RoomVisibilityProps {
  publicRoom: boolean;
  disabled: boolean;
  onChange: (publicRoom: boolean) => void;
}

export function RoomVisibility({ publicRoom, disabled, onChange }: RoomVisibilityProps) {
  return (
    <section className="rounded border border-metal-light p-4" aria-labelledby="room-visibility-heading">
      <h2 id="room-visibility-heading" className="m-0 text-lg font-bold">
        Room visibility
      </h2>
      <fieldset className="m-0 mt-3 grid grid-cols-2 gap-3 border-0 p-0" aria-label="Room visibility">
        <Button variant="secondary" aria-pressed={!publicRoom} disabled={disabled} onClick={() => onChange(false)}>
          Private
        </Button>
        <Button variant="secondary" aria-pressed={publicRoom} disabled={disabled} onClick={() => onChange(true)}>
          Public
        </Button>
      </fieldset>
      <p className="mb-0 mt-3 text-sm text-text-muted" aria-live="polite">
        {publicRoom
          ? 'Your room appears in Public Rooms while waiting for players.'
          : 'Only players with your room code can join.'}
      </p>
    </section>
  );
}
