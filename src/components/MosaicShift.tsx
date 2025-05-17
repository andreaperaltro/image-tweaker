/**
 * Mosaic Shift Effect Utility Functions
 * 
 * This module provides functionality for:
 * 1. Dividing an image into a grid of tiles
 * 2. Shifting tiles randomly or using patterns
 * 3. Creating a fragmented mosaic effect
 */

export type ShiftPattern = 'random' | 'wave' | 'radial' | 'spiral';

export interface MosaicShiftSettings {
  enabled: boolean;
  columns: number;
  rows: number;
  maxOffsetX: number;   // Maximum horizontal shift in pixels
  maxOffsetY: number;   // Maximum vertical shift in pixels
  pattern: ShiftPattern; // Pattern used for shifting tiles
  intensity: number;     // Intensity of the shift effect (0-100)
  seed: number;          // Random seed for deterministic shifts
  preserveEdges: boolean; // Whether to preserve image edges
  randomRotation: boolean; // Whether to randomly rotate tiles
  maxRotation: number;     // Maximum rotation angle in degrees
  backgroundColor: string; // Background color for exposed areas
  useBackgroundColor: boolean; // Whether to use background color
}

/**
 * A tile in the mosaic grid with its original and shifted positions
 */
interface MosaicTile {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Apply the mosaic shift effect to a canvas
 */
export function applyMosaicShift(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: MosaicShiftSettings
): void {
  if (!settings.enabled) return;
  
  // Create a temporary canvas to work with
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Draw the original image to the temporary canvas
  tempCtx.drawImage(sourceCanvas, 0, 0, width, height);
  
  // Clear the target canvas and fill with background color if enabled
  ctx.clearRect(0, 0, width, height);
  
  if (settings.useBackgroundColor) {
    ctx.fillStyle = settings.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Calculate tile dimensions
  const tileWidth = Math.ceil(width / settings.columns);
  const tileHeight = Math.ceil(height / settings.rows);
  
  // Seed the random number generator for deterministic output
  const random = seedRandom(settings.seed);
  
  // Create and shift the mosaic tiles
  const tiles: MosaicTile[] = createShiftedTiles(
    width,
    height,
    tileWidth,
    tileHeight,
    settings,
    random
  );
  
  // Draw the shifted tiles
  drawMosaicTiles(ctx, tempCanvas, tiles, settings);
}

/**
 * Create a deterministic random number generator with a seed
 */
function seedRandom(seed: number): () => number {
  return () => {
    // Simple xorshift-based PRNG
    seed = (seed ^ (seed << 13)) ^ (seed >>> 17) ^ (seed << 5);
    return (seed < 0 ? ~seed + 1 : seed) % 1000 / 1000;
  };
}

/**
 * Create an array of mosaic tiles with shifted positions
 */
function createShiftedTiles(
  width: number,
  height: number,
  tileWidth: number,
  tileHeight: number,
  settings: MosaicShiftSettings,
  random: () => number
): MosaicTile[] {
  const tiles: MosaicTile[] = [];
  const intensityFactor = settings.intensity / 100;
  
  for (let row = 0; row < settings.rows; row++) {
    for (let col = 0; col < settings.columns; col++) {
      // Calculate source position (original tile position)
      const sourceX = col * tileWidth;
      const sourceY = row * tileHeight;
      
      // Calculate actual width and height (handle edge cases)
      const actualWidth = Math.min(tileWidth, width - sourceX);
      const actualHeight = Math.min(tileHeight, height - sourceY);
      
      if (actualWidth <= 0 || actualHeight <= 0) continue;
      
      // Calculate shifts based on pattern
      let offsetX = 0;
      let offsetY = 0;
      let rotation = 0;
      
      switch (settings.pattern) {
        case 'random':
          // Random shift within max offset range
          offsetX = (random() * 2 - 1) * settings.maxOffsetX * intensityFactor;
          offsetY = (random() * 2 - 1) * settings.maxOffsetY * intensityFactor;
          break;
          
        case 'wave':
          // Sinusoidal wave pattern
          const wavePhase = (col / settings.columns) * Math.PI * 4;
          offsetX = Math.sin(wavePhase) * settings.maxOffsetX * intensityFactor;
          offsetY = Math.cos(wavePhase + row / 2) * settings.maxOffsetY * intensityFactor;
          break;
          
        case 'radial':
          // Radial pattern from center
          const centerX = settings.columns / 2;
          const centerY = settings.rows / 2;
          const distX = (col - centerX) / centerX;
          const distY = (row - centerY) / centerY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          const normDist = Math.min(1, distance);
          
          offsetX = distX * settings.maxOffsetX * normDist * intensityFactor;
          offsetY = distY * settings.maxOffsetY * normDist * intensityFactor;
          break;
          
        case 'spiral':
          // Spiral pattern from center
          const spiralCenterX = settings.columns / 2;
          const spiralCenterY = settings.rows / 2;
          const dx = (col - spiralCenterX) / spiralCenterX;
          const dy = (row - spiralCenterY) / spiralCenterY;
          const angle = Math.atan2(dy, dx);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          offsetX = Math.cos(angle + dist * 5) * dist * settings.maxOffsetX * intensityFactor;
          offsetY = Math.sin(angle + dist * 5) * dist * settings.maxOffsetY * intensityFactor;
          break;
      }
      
      // Apply random rotation if enabled
      if (settings.randomRotation) {
        rotation = (random() * 2 - 1) * settings.maxRotation * intensityFactor;
      }
      
      // Apply edge preservation if enabled
      if (settings.preserveEdges) {
        // Reduce offset for tiles at the edges
        const edgeFactorX = Math.min(col, settings.columns - col - 1) / (settings.columns / 4);
        const edgeFactorY = Math.min(row, settings.rows - row - 1) / (settings.rows / 4);
        const edgeFactor = Math.min(1, Math.min(edgeFactorX, edgeFactorY));
        
        offsetX *= edgeFactor;
        offsetY *= edgeFactor;
        rotation *= edgeFactor;
      }
      
      // Calculate target position (position after shift)
      const targetX = sourceX + offsetX;
      const targetY = sourceY + offsetY;
      
      // Add the tile to the array
      tiles.push({
        sourceX,
        sourceY,
        targetX,
        targetY,
        width: actualWidth,
        height: actualHeight,
        rotation
      });
    }
  }
  
  return tiles;
}

/**
 * Draw the mosaic tiles to the canvas
 */
function drawMosaicTiles(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  tiles: MosaicTile[],
  settings: MosaicShiftSettings
): void {
  // Draw each tile
  tiles.forEach(tile => {
    ctx.save();
    
    // Apply rotation if any
    if (tile.rotation !== 0) {
      const centerX = tile.targetX + tile.width / 2;
      const centerY = tile.targetY + tile.height / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate(tile.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
    }
    
    // Draw the tile
    ctx.drawImage(
      sourceCanvas,
      tile.sourceX, tile.sourceY, tile.width, tile.height,
      tile.targetX, tile.targetY, tile.width, tile.height
    );
    
    ctx.restore();
  });
} 