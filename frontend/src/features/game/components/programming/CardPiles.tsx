import registerBackground from '../../../../assets/register.png';

interface CardPilesProps {
  drawPileCount: number;
  discardPileCount: number;
}

export function CardPiles({ drawPileCount, discardPileCount }: CardPilesProps) {
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto" aria-label="Card piles">
      <section
        aria-label="Draw pile"
        className="flex min-w-0 flex-1 items-center gap-2 rounded border border-cyan-300/20 bg-factory-bg/40 p-1.5"
      >
        <img src={registerBackground} alt="" className="hidden h-9 w-6 shrink-0 lg:block rounded object-cover" />
        <div className="text-[10px] text-text-muted">
          <h3 className="font-bold uppercase">Draw pile</h3>
          <p className="mt-0.5 tabular-nums">
            {drawPileCount} {drawPileCount === 1 ? 'card' : 'cards'}
          </p>
        </div>
      </section>
      <section
        aria-label="Discard pile"
        className="flex min-w-0 flex-1 items-center gap-2 rounded border border-cyan-300/20 bg-factory-bg/40 p-1.5"
      >
        <span aria-hidden="true" className="hidden h-9 w-6 shrink-0 lg:block rounded border border-dashed border-metal-dark" />
        <div className="text-[10px] text-text-muted">
          <h3 className="font-bold uppercase">Discard pile</h3>
          <p className="mt-0.5 tabular-nums">
            {discardPileCount} {discardPileCount === 1 ? 'card' : 'cards'}
          </p>
        </div>
      </section>
    </div>
  );
}
