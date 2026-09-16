interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function MapZoomControls({ onZoomIn, onZoomOut, canZoomIn, canZoomOut }: MapZoomControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex gap-2 rounded bg-slate-950/90 p-1">
      <button
        aria-label="Zoom out"
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="h-9 w-9 rounded bg-slate-700 text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        −
      </button>
      <button
        aria-label="Zoom in"
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="h-9 w-9 rounded bg-slate-700 text-white focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
