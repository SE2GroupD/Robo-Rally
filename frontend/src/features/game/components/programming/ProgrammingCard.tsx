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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'pointer-events-auto flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
        image ? 'bg-[#848484] p-1' : 'border-2 p-2 text-center font-bold',
        !image && (isDamage ? 'border-red-600 bg-red-100 text-red-800' : 'border-blue-600 bg-slate-100 text-blue-900'),
        'relative transition-transform duration-150 motion-reduce:transition-none enabled:hover:scale-120 enabled:focus-visible:scale-120',
        variant === 'hand' ? 'origin-left' : 'origin-bottom',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {image ? (
        <img src={image} alt={cardLabels[type]} className="h-full w-full object-contain" />
      ) : (
        <span className="text-sm">{cardLabels[type]}</span>
      )}
    </button>
  );
}
