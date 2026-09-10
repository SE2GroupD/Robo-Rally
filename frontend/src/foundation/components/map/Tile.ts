export type Tile = {
  x: number;
  y: number;
  robot?: {
    hue: number;
    direction: number;
  };
  checkpointNumber?: number;
};
