interface RegisterButtonsProps {
  onSubmit: () => void;
  onClear: () => void;
  selectedCount: number;
  isSubmitting: boolean;
  isLockedIn: boolean;
}

export function RegisterButtons({ onSubmit, onClear, selectedCount, isSubmitting, isLockedIn }: RegisterButtonsProps) {
  const disabled = isSubmitting || isLockedIn || selectedCount === 0;

  return (
    <fieldset aria-label="Program actions" className="pointer-events-auto grid min-w-0 gap-2 border-0 p-0">
      <p aria-live="polite" className="rounded bg-slate-950/90 px-2 py-1 text-center text-xs text-slate-300 tabular-nums">
        {isSubmitting ? 'Submitting program' : isLockedIn ? 'Program locked in' : `${selectedCount}/5 cards selected`}
      </p>
      <button
        data-ready
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        aria-busy={isSubmitting}
        className="min-h-11 cursor-pointer rounded-lg border border-emerald-400/60 bg-emerald-500 px-3 text-sm font-bold text-slate-950 shadow-sm transition-colors enabled:hover:bg-emerald-400 enabled:active:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none motion-reduce:transition-none"
      >
        {isSubmitting ? 'Submitting…' : isLockedIn ? 'Ready ✓' : 'Ready'}
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        className="min-h-11 cursor-pointer rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm font-semibold text-slate-100 transition-colors enabled:hover:border-slate-400 enabled:hover:bg-slate-700 enabled:active:bg-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500 motion-reduce:transition-none"
      >
        Clear
      </button>
    </fieldset>
  );
}
