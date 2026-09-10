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
      style={{
        width: '40px',
        height: '40px',
        filter: `hue-rotate(${hueRotation}deg)`,
        transform: `rotate(${rotation}deg)`,
        transition: 'all 0.3s ease',
      }}
    />
  );
}
