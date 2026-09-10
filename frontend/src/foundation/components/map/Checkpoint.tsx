import flagImage from '../../../assets/flag.png';

interface CheckpointProps {
  num: number;
}

export function Checkpoint({ num }: CheckpointProps) {
  return (
    <div className="relative w-[40px] h-[40px] flex items-center justify-center">
      <img src={flagImage} alt={`Checkpoint ${num}`} className="w-full h-full object-contain" />
      <span className="absolute font-black text-black text-[14px] top-[27%] left-[65%] -translate-x-1/2 -translate-y-1/2">
        {num}
      </span>
    </div>
  );
}
