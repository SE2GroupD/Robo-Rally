import flagImage from '../../../../assets/checkpoint.png';

interface CheckpointProps {
  num: number;
}

export function Checkpoint({ num }: CheckpointProps) {
  return (
    <div className="relative w-[40px] h-[40px] flex items-center justify-center">
      <img src={flagImage} alt={`Checkpoint ${num}`} className="w-full h-full object-contain" />
      <span className="absolute font-black text-yellow-300 text-[12px] top-[48%] left-[67%] -translate-x-1/2 -translate-y-1/2 -skew-x-15">
        {num}
      </span>
    </div>
  );
}
