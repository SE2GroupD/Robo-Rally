import tankImage from '../../../assets/tank.png';

interface RobotProps {
  hueRotation?: number;
  rotation?: number;
}

export function Robot({ hueRotation = 0, rotation = 0 }: RobotProps) {
  return (
    <img
      src={tankImage}
      alt="Robot Player"
      className="w-[40px] h-[40px] transition-all duration-300 ease-in-out"
      style={{
        filter: `hue-rotate(${hueRotation}deg)`,
        transform: `rotate(${rotation}deg)`,
      }}
    />
  );
}
