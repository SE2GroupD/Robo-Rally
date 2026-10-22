import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AVATAR_MAP } from '../../../data/avatars';
import type { RaceStanding } from '../../../types/MatchResults';

interface RacePlayerWidgetProps {
  player: RaceStanding;
  totalCheckpoints: number;
  isCurrentPlayer: boolean;
  ready: boolean;
}

export function RacePlayerWidget({ player, totalCheckpoints, isCurrentPlayer, ready }: RacePlayerWidgetProps) {
  const tooltipId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const label = `${player.playerName}${isCurrentPlayer ? ' (You)' : ''}, place ${player.rank}, ${player.completedCheckpoints} of ${totalCheckpoints} checkpoints completed, ${ready ? 'Ready' : 'Not ready'}`;
  const image = player.avatarId === null ? undefined : AVATAR_MAP[player.avatarId];

  function show() {
    clearTimeout(hideTimer.current);
    const bounds = trigger.current?.getBoundingClientRect();
    if (bounds) setPosition({ left: Math.max(8, Math.min(bounds.left, window.innerWidth - 248)), top: bounds.bottom + 8 });
  }

  function hideSoon() {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPosition(null), 150);
  }

  useEffect(() => {
    if (!position) return;
    const dismiss = () => setPosition(null);
    const reposition = () => {
      if (document.activeElement === trigger.current) {
        const bounds = trigger.current?.getBoundingClientRect();
        if (bounds) setPosition({ left: Math.max(8, Math.min(bounds.left, window.innerWidth - 248)), top: bounds.bottom + 8 });
      } else dismiss();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [position]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-describedby={position ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={() => {
          if (document.activeElement !== trigger.current) hideSoon();
        }}
        onFocus={show}
        onBlur={hideSoon}
        onClick={show}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            clearTimeout(hideTimer.current);
            setPosition(null);
          }
        }}
        className={`grid h-[96px] w-full min-w-0 grid-cols-[32px_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-2 gap-y-1 py-3 rounded border bg-panel px-3 text-left text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard ${isCurrentPlayer ? 'border-hazard' : 'border-metal-dark'}`}
      >
        <span className="relative shrink-0">
          {image ? (
            <img src={image} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center text-metal">
              ?
            </span>
          )}
          <span aria-hidden="true" className="absolute -left-1 -top-1 text-[10px] font-black text-metal-light">
            {player.rank}
          </span>
          {ready && (
            <span
              title="Ready"
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-950"
            >
              ✓
            </span>
          )}
        </span>
        <span aria-hidden="true" className="min-w-0 flex-1">
          <span className="block truncate font-bold">{player.playerName}</span>
          <span className={`mt-1 block truncate text-[9px] uppercase ${isCurrentPlayer ? 'text-hazard' : 'text-metal-light'}`}>
            {isCurrentPlayer ? 'You · ' : ''}
            {ready ? 'Ready' : 'Choosing cards'}
          </span>
        </span>
        <span aria-hidden="true" className="col-span-2 flex items-center justify-between text-xs text-text-muted">
          <span>Checkpoints</span>
          <span className="font-bold tabular-nums text-white">
            {player.completedCheckpoints}/{totalCheckpoints}
          </span>
        </span>
      </button>
      {position &&
        createPortal(
          // Keep the tooltip hoverable while the pointer moves off its trigger.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            id={tooltipId}
            role="tooltip"
            onMouseEnter={() => clearTimeout(hideTimer.current)}
            onMouseLeave={hideSoon}
            className="fixed z-50 w-60 max-w-[calc(100vw-1rem)] rounded border border-metal-light bg-slate-950 p-3 text-sm text-white shadow-lg"
            style={{ left: position.left, top: position.top }}
          >
            <p className="m-0 break-words font-bold">
              {player.playerName}
              {isCurrentPlayer ? ' · You' : ''}
            </p>
            <p className="m-0 mt-1 text-xs text-text-muted">
              Place {player.rank} · {player.completedCheckpoints}/{totalCheckpoints} checkpoints · {ready ? 'Ready' : 'Not ready'}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
