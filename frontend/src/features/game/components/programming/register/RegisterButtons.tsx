interface RegisterButtonsProps {
  completed?: boolean;
  onSubmit: () => void;
  onClear: () => void;
  selectedCount: number;
  isSubmitting: boolean;
  isLockedIn: boolean;
}

export function RegisterButtons({
  completed = false,
  onSubmit,
  onClear,
  selectedCount,
  isSubmitting,
  isLockedIn,
}: RegisterButtonsProps) {
  const isSubmitDisabled = completed || isSubmitting || isLockedIn || selectedCount < 5;
  const isClearDisabled = completed || isSubmitting || isLockedIn || selectedCount === 0;

  return (
    <fieldset
      aria-label="Program actions"
      className="grid min-w-0 grid-cols-[100px_64px_minmax(0,1fr)] items-center gap-2 border-0 p-0"
    >
      <button
        data-ready
        type="button"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        aria-busy={isSubmitting}
        className="pointer-events-auto min-h-11 cursor-pointer rounded-lg border border-emerald-400/60 bg-emerald-500 px-3 text-sm font-bold text-slate-950 shadow-sm transition-colors enabled:hover:bg-emerald-400 enabled:active:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none motion-reduce:transition-none"
      >
        {completed ? 'Match complete' : isSubmitting ? 'Submitting…' : isLockedIn ? 'Ready ✓' : 'Ready'}
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={isClearDisabled}
        className="pointer-events-auto min-h-11 cursor-pointer rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm font-semibold text-slate-100 transition-colors enabled:hover:border-slate-400 enabled:hover:bg-slate-700 enabled:active:bg-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-500 motion-reduce:transition-none"
      >
        Clear
      </button>
      <span aria-live="polite" className="text-[10px] text-text-muted">
        {completed
          ? 'Final program'
          : isSubmitting
            ? 'Submitting program'
            : isLockedIn
              ? 'Program locked in'
              : 'Runs left → right'}
      </span>
    </fieldset>
  );
}
