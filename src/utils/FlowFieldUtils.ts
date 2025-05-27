import { Noise } from 'noisejs';

export interface FlowFieldSettings {
  scale: number;      // Scale of the noise field
  strength: number;   // Strength of the rotation
  speed: number;      // Animation speed (if we want to animate it)
  seed: number;       // Random seed for the noise
}

export const createFlowField = (width: number, height: number, settings: FlowFieldSettings) => {
  const noise = new Noise(settings.seed);
  const { scale, strength } = settings;
  
  // Create a 2D array to store the angles
  const field: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    field[y] = [];
    for (let x = 0; x < width; x++) {
      // Get noise value between -1 and 1
      const n = noise.perlin2(x * scale, y * scale);
      
      // Convert noise to angle (in radians)
      // Map -1 to 1 range to -π to π
      const angle = n * Math.PI * strength;
      
      field[y][x] = angle;
    }
  }
  
  return field;
};

export const getFlowFieldAngle = (
  x: number, 
  y: number, 
  field: number[][], 
  cellSize: number
): number => {
  // Get the grid position
  const gridX = Math.floor(x / cellSize);
  const gridY = Math.floor(y / cellSize);
  
  // Check bounds
  if (gridY >= 0 && gridY < field.length && gridX >= 0 && gridX < field[0].length) {
    return field[gridY][gridX];
  }
  
  return 0; // Default to no rotation if out of bounds
}; 