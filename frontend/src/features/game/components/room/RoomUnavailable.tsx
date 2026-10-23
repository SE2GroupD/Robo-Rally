import { Button } from '../../../../foundation/components/button/Button';

export function RoomUnavailable({ onLeft }: { onLeft: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded border border-metal-light bg-black/25 px-6 py-10 text-center shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hazard bg-hazard/15 text-2xl text-hazard">
        !
      </div>
      <div>
        <h2 className="m-0 text-2xl font-black uppercase">Room unavailable</h2>
        <p className="mb-0 mt-3 text-text-muted">This room has closed, or you are no longer a participant.</p>
      </div>
      <Button className="w-full max-w-sm" onClick={onLeft} size="large">
        Back to Menu
      </Button>
    </section>
  );
}
