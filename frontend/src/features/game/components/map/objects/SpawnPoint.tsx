import spawnPointImage from '../../../../../assets/objects/spawnpoint.png';

export function SpawnPoint() {
  return (
    <img src={spawnPointImage} alt="Spawn point" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
  );
}
