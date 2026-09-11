import { type CardType } from '../../../features/types/CardType'; // Adjust path as needed
import { cn } from '../../../utils/cn';

interface ProgrammingCardProps {
  type: CardType;
  onClick?: () => void;
  disabled?: boolean;
}

export function ProgrammingCard({ type, onClick, disabled }: ProgrammingCardProps) {
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

  const isDamage = ['SPAM', 'WORM', 'VIRUS', 'TROJAN_HORSE'].includes(type);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex aspect-2/3 w-24 flex-col items-center justify-center rounded-md border-2 p-2 text-center font-bold shadow-md transition-transform hover:-translate-y-1',
        isDamage ? 'border-red-600 bg-red-100 text-red-800' : 'border-blue-600 bg-slate-100 text-blue-900',
        disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0',
      )}
    >
      <span className="text-sm">{cardLabels[type]}</span>
    </button>
  );
}
