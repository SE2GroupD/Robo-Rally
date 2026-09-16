import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type CardType } from '../../types/CardType'; // Adjust path as needed
import { cn } from '../../../../utils/cn';
import againImage from '../../../../assets/cards/again.png';
import leftTurnImage from '../../../../assets/cards/leftTurn.png';
import move1Image from '../../../../assets/cards/move1.png';
import move2Image from '../../../../assets/cards/move2.png';
import move3Image from '../../../../assets/cards/move3.png';
import moveBackImage from '../../../../assets/cards/moveBack.png';
import powerUpImage from '../../../../assets/cards/powerUp.png';
import rightTurnImage from '../../../../assets/cards/rightTurn.png';
import uTurnImage from '../../../../assets/cards/uturn.png';

interface ProgrammingCardProps {
  type: CardType;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'hand' | 'program';
}

export function ProgrammingCard({ type, onClick, disabled, variant = 'program' }: ProgrammingCardProps) {
  const [preview, setPreview] = useState<{ left: number; top: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepPreview = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const trigger = useRef<HTMLButtonElement>(null);
  const closePreview = () => {
    keepPreview();
    timer.current = setTimeout(() => {
      if (document.activeElement !== trigger.current) setPreview(null);
    }, 120);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const previewVisible = preview !== null;
  useEffect(() => {
    if (!previewVisible) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview(null);
    };
    const reposition = () => setPreview(null);
    document.addEventListener('keydown', dismiss);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('keydown', dismiss);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [previewVisible]);
  // A simple mapping to make the enums look nice on the UI
  const cardLabels: Record<CardType, string> = {
    MOVE_1: 'Move 1',
    MOVE_2: 'Move 2',
    MOVE_3: 'Move 3',
    BACK_UP: 'Back Up',
    TURN_LEFT: 'Turn Left',
    TURN_RIGHT: 'Turn Right',
    U_TURN: 'U-Turn',
    POWER_UP: 'Power Up',
    AGAIN: 'Again',
    SPAM: 'SPAM',
    WORM: 'WORM',
    VIRUS: 'VIRUS',
    TROJAN_HORSE: 'TROJAN HORSE',
  };

  // Damage cards (SPAM/WORM/VIRUS/TROJAN_HORSE) have no artwork yet, fall back to text.
  const cardImages: Partial<Record<CardType, string>> = {
    MOVE_1: move1Image,
    MOVE_2: move2Image,
    MOVE_3: move3Image,
    BACK_UP: moveBackImage,
    TURN_LEFT: leftTurnImage,
    TURN_RIGHT: rightTurnImage,
    U_TURN: uTurnImage,
    POWER_UP: powerUpImage,
    AGAIN: againImage,
  };

  const isDamage = ['SPAM', 'WORM', 'VIRUS', 'TROJAN_HORSE'].includes(type);
  const image = cardImages[type];

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setPreview(null);
          onClick?.();
        }}
        onMouseEnter={(event) => {
          keepPreview();
          if (variant === 'hand') {
            const rect = event.currentTarget.getBoundingClientRect();
            setPreview({ left: rect.right + 8, top: Math.max(8, Math.min(rect.top, window.innerHeight - 288)) });
          }
        }}
        onMouseLeave={closePreview}
        onFocus={(event) => {
          keepPreview();
          if (variant === 'hand') {
            const rect = event.currentTarget.getBoundingClientRect();
            setPreview({ left: rect.right + 8, top: Math.max(8, Math.min(rect.top, window.innerHeight - 288)) });
          }
        }}
        onBlur={closePreview}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            keepPreview();
            setPreview(null);
          }
        }}
        disabled={disabled}
        className={cn(
          'pointer-events-auto flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
          image ? 'bg-[#848484] p-1' : 'border-2 p-2 text-center font-bold',
          !image && (isDamage ? 'border-red-600 bg-red-100 text-red-800' : 'border-blue-600 bg-slate-100 text-blue-900'),
          disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0',
        )}
      >
        {image ? (
          <img src={image} alt={cardLabels[type]} className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm">{cardLabels[type]}</span>
        )}
      </button>
      {preview &&
        createPortal(
          // Hover handlers keep the non-interactive preview open while it is inspected.
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            role="tooltip"
            aria-label={cardLabels[type]}
            onMouseEnter={keepPreview}
            onMouseLeave={closePreview}
            className="fixed z-50 w-40 rounded-lg border border-slate-500 bg-slate-950 p-2 text-white shadow-2xl"
            style={{ left: preview.left, top: preview.top }}
          >
            {image ? <img src={image} alt="" className="aspect-2/3 w-full object-contain" /> : null}
            <p className="text-center text-sm">{cardLabels[type]}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
