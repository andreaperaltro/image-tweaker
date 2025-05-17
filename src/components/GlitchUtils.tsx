/**
 * GlitchUtils.tsx
 * Provides functionality for glitch effects and pixel sorting
 */

export interface GlitchSettings {
  // Master toggle for all effects
  masterEnabled: boolean;
  
  enabled: boolean;
  
  // Glitch intensity
  glitchIntensity: number;
  glitchDensity: number;  // New: Controls number of glitched areas
  glitchDirection: 'horizontal' | 'vertical' | 'both';  // New: Direction for general glitch
  glitchSize: number;     // New: Controls size of glitch lines/areas
  
  // Pixel sorting
  pixelSortingEnabled: boolean;
  pixelSortingThreshold: number;
  pixelSortingDirection: 'horizontal' | 'vertical' | 'both';
  
  // Channel shift
  channelShiftEnabled: boolean;
  channelShiftAmount: number;
  channelShiftMode: 'rgb' | 'rb' | 'rg' | 'gb';  // New: Which channels to shift
  
  // Scan lines
  scanLinesEnabled: boolean;
  scanLinesCount: number;
  scanLinesIntensity: number;
  scanLinesDirection: 'horizontal' | 'vertical' | 'both';  // New: Direction for scan lines
  
  // Noise
  noiseEnabled: boolean;
  noiseAmount: number;
  
  // Blocks
  blocksEnabled: boolean;
  blocksSize: number;
  blocksOffset: number;
  blocksDensity: number;  // New: Controls number of blocks affected
}

/**
 * Apply glitch effects to the canvas
 */
export function applyGlitch(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  // If master toggle is off, do nothing (leave the image as is)
  if (!settings.masterEnabled) {
    return;
  }
  
  // Check if any individual effects are enabled
  const hasEnabledEffects = 
    settings.enabled || 
    settings.pixelSortingEnabled || 
    settings.channelShiftEnabled || 
    settings.scanLinesEnabled || 
    settings.noiseEnabled || 
    settings.blocksEnabled;
  
  // If no individual effects are enabled, do nothing (leave the image as is)
  if (!hasEnabledEffects) {
    return;
  }
  
  // Create temporary canvas for processing the effects
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    return; // Fallback - if we can't create a context, just leave the image as is
  }
  
  // Make a clean copy of the source image
  tempCtx.clearRect(0, 0, width, height);
  tempCtx.drawImage(sourceCanvas, 0, 0);
  
  // Apply each enabled effect directly to the temp canvas
  // Only apply effects that are explicitly enabled
  if (settings.enabled) {
    applyGeneralGlitch(tempCtx, width, height, settings);
  }
  
  if (settings.pixelSortingEnabled) {
    applyPixelSorting(tempCtx, width, height, settings);
  }
  
  if (settings.channelShiftEnabled) {
    applyChannelShift(tempCtx, width, height, settings);
  }
  
  if (settings.scanLinesEnabled) {
    applyScanLines(tempCtx, width, height, settings);
  }
  
  if (settings.noiseEnabled) {
    applyNoise(tempCtx, width, height, settings);
  }
  
  if (settings.blocksEnabled) {
    applyBlocks(tempCtx, width, height, settings);
  }
  
  // Draw the result to the output canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
}

/**
 * Apply pixel sorting effect - sorts pixels in rows or columns based on brightness
 */
function applyPixelSorting(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const threshold = settings.pixelSortingThreshold;
  
  // Helper function to get pixel brightness
  const getBrightness = (r: number, g: number, b: number): number => {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  
  // Sort pixels horizontally
  if (settings.pixelSortingDirection === 'horizontal' || settings.pixelSortingDirection === 'both') {
    for (let y = 0; y < height; y++) {
      let sortingStart = -1;
      
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const brightness = getBrightness(pixels[i], pixels[i+1], pixels[i+2]);
        
        // Start or end sorting sections based on brightness threshold
        if (brightness > threshold && sortingStart === -1) {
          sortingStart = x;
        } else if ((brightness <= threshold || x === width - 1) && sortingStart !== -1) {
          // Sort this segment of pixels
          if (x - sortingStart > 1) {
            const sortingRange = [];
            
            // Collect pixels in the segment
            for (let sx = sortingStart; sx < x; sx++) {
              const si = (y * width + sx) * 4;
              sortingRange.push({
                r: pixels[si],
                g: pixels[si+1],
                b: pixels[si+2],
                a: pixels[si+3],
                brightness: getBrightness(pixels[si], pixels[si+1], pixels[si+2])
              });
            }
            
            // Sort pixels by brightness
            sortingRange.sort((a, b) => a.brightness - b.brightness);
            
            // Write back sorted pixels
            for (let sx = 0; sx < sortingRange.length; sx++) {
              const si = (y * width + (sortingStart + sx)) * 4;
              const pixel = sortingRange[sx];
              pixels[si] = pixel.r;
              pixels[si+1] = pixel.g;
              pixels[si+2] = pixel.b;
              pixels[si+3] = pixel.a;
            }
          }
          
          sortingStart = -1;
        }
      }
    }
  }
  
  // Sort pixels vertically
  if (settings.pixelSortingDirection === 'vertical' || settings.pixelSortingDirection === 'both') {
    for (let x = 0; x < width; x++) {
      let sortingStart = -1;
      
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        const brightness = getBrightness(pixels[i], pixels[i+1], pixels[i+2]);
        
        // Start or end sorting sections based on brightness threshold
        if (brightness > threshold && sortingStart === -1) {
          sortingStart = y;
        } else if ((brightness <= threshold || y === height - 1) && sortingStart !== -1) {
          // Sort this segment of pixels
          if (y - sortingStart > 1) {
            const sortingRange = [];
            
            // Collect pixels in the segment
            for (let sy = sortingStart; sy < y; sy++) {
              const si = (sy * width + x) * 4;
              sortingRange.push({
                r: pixels[si],
                g: pixels[si+1],
                b: pixels[si+2],
                a: pixels[si+3],
                brightness: getBrightness(pixels[si], pixels[si+1], pixels[si+2])
              });
            }
            
            // Sort pixels by brightness
            sortingRange.sort((a, b) => a.brightness - b.brightness);
            
            // Write back sorted pixels
            for (let sy = 0; sy < sortingRange.length; sy++) {
              const si = ((sortingStart + sy) * width + x) * 4;
              const pixel = sortingRange[sy];
              pixels[si] = pixel.r;
              pixels[si+1] = pixel.g;
              pixels[si+2] = pixel.b;
              pixels[si+3] = pixel.a;
            }
          }
          
          sortingStart = -1;
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply channel shift effect - shift RGB channels separately
 */
function applyChannelShift(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  const amount = Math.round(settings.channelShiftAmount * width / 100);
  if (amount === 0) return;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const tempImageData = ctx.createImageData(width, height);
  const tempPixels = tempImageData.data;
  
  // Copy original image data to temp
  for (let i = 0; i < pixels.length; i++) {
    tempPixels[i] = pixels[i];
  }
  
  // Determine which channels to shift based on mode
  const shiftRed = settings.channelShiftMode === 'rgb' || 
                   settings.channelShiftMode === 'rb' || 
                   settings.channelShiftMode === 'rg';
                   
  const shiftGreen = settings.channelShiftMode === 'rgb' || 
                     settings.channelShiftMode === 'rg' || 
                     settings.channelShiftMode === 'gb';
                     
  const shiftBlue = settings.channelShiftMode === 'rgb' || 
                    settings.channelShiftMode === 'rb' || 
                    settings.channelShiftMode === 'gb';
  
  // Shift red channel to the right
  if (shiftRed) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceX = (x - amount + width) % width;
        const sourceI = (y * width + sourceX) * 4;
        const targetI = (y * width + x) * 4;
        
        // Only copy red channel
        pixels[targetI] = tempPixels[sourceI];
      }
    }
  }
  
  // Shift green channel upward
  if (shiftGreen) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceY = (y - amount + height) % height;
        const sourceI = (sourceY * width + x) * 4;
        const targetI = (y * width + x) * 4;
        
        // Only copy green channel
        pixels[targetI + 1] = tempPixels[sourceI + 1];
      }
    }
  }
  
  // Shift blue channel to the left
  if (shiftBlue) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceX = (x + amount) % width;
        const sourceI = (y * width + sourceX) * 4;
        const targetI = (y * width + x) * 4;
        
        // Only copy blue channel
        pixels[targetI + 2] = tempPixels[sourceI + 2];
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply scan lines effect - horizontal or vertical lines across the image
 */
function applyScanLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  const count = settings.scanLinesCount;
  const intensity = settings.scanLinesIntensity / 100;
  
  if (count <= 0 || intensity <= 0) return;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Apply horizontal scan lines
  if (settings.scanLinesDirection === 'horizontal' || settings.scanLinesDirection === 'both') {
    const lineHeight = Math.floor(height / count);
    
    for (let y = 0; y < height; y++) {
      // Apply scan line effect on every other line
      if (y % lineHeight < lineHeight / 2) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          
          // Darken the pixel
          pixels[i] = pixels[i] * (1 - intensity);
          pixels[i + 1] = pixels[i + 1] * (1 - intensity);
          pixels[i + 2] = pixels[i + 2] * (1 - intensity);
        }
      }
    }
  }
  
  // Apply vertical scan lines
  if (settings.scanLinesDirection === 'vertical' || settings.scanLinesDirection === 'both') {
    const lineWidth = Math.floor(width / count);
    
    for (let x = 0; x < width; x++) {
      // Apply scan line effect on every other column
      if (x % lineWidth < lineWidth / 2) {
        for (let y = 0; y < height; y++) {
          const i = (y * width + x) * 4;
          
          // Darken the pixel
          pixels[i] = pixels[i] * (1 - intensity);
          pixels[i + 1] = pixels[i + 1] * (1 - intensity);
          pixels[i + 2] = pixels[i + 2] * (1 - intensity);
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply noise effect - random pixel variations
 */
function applyNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  const amount = settings.noiseAmount / 100;
  if (amount <= 0) return;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  for (let i = 0; i < pixels.length; i += 4) {
    if (Math.random() < amount) {
      // Add random noise to the pixel
      const noise = Math.floor(Math.random() * 50) - 25;
      pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
      pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
      pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply blocks effect - move random blocks of the image
 */
function applyBlocks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  const blockSize = Math.max(5, Math.floor(settings.blocksSize));
  const maxOffset = Math.floor(settings.blocksOffset * width / 100);
  
  if (blockSize <= 0 || maxOffset <= 0) return;
  
  // Create a temporary canvas to hold the original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // Copy the current image to the temp canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Calculate number of blocks
  const numBlocksX = Math.ceil(width / blockSize);
  const numBlocksY = Math.ceil(height / blockSize);
  
  // Number of blocks to glitch - use blocksDensity to control
  const density = Math.max(0.01, Math.min(1, settings.blocksDensity / 100));
  const numGlitchBlocks = Math.max(1, Math.floor(numBlocksX * numBlocksY * density));
  
  for (let i = 0; i < numGlitchBlocks; i++) {
    // Pick a random block
    const blockX = Math.floor(Math.random() * numBlocksX);
    const blockY = Math.floor(Math.random() * numBlocksY);
    
    // Calculate block coordinates
    const x = blockX * blockSize;
    const y = blockY * blockSize;
    const w = Math.min(blockSize, width - x);
    const h = Math.min(blockSize, height - y);
    
    // Generate random offset within maxOffset
    const offsetX = Math.floor(Math.random() * maxOffset * 2) - maxOffset;
    const offsetY = Math.floor(Math.random() * maxOffset * 2) - maxOffset;
    
    // Copy block from temp canvas to new position
    ctx.drawImage(
      tempCanvas,
      x, y, w, h,
      x + offsetX, y + offsetY, w, h
    );
  }
}

/**
 * Apply general glitch effect - random distortions
 */
function applyGeneralGlitch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlitchSettings
): void {
  // First check if general glitch is explicitly enabled
  if (!settings.enabled) return;

  const intensity = settings.glitchIntensity / 100;
  if (intensity <= 0) return;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Density factor controls how many lines/areas are affected
  const densityFactor = Math.max(0.01, Math.min(1, settings.glitchDensity / 100));
  
  // Apply horizontal glitch lines
  if (settings.glitchDirection === 'horizontal' || settings.glitchDirection === 'both') {
    // Number of glitch lines - scaled by both intensity and density
    const numGlitchLines = Math.max(1, Math.floor(height * intensity * densityFactor * 0.5));
    
    for (let i = 0; i < numGlitchLines; i++) {
      // Pick a random line
      const y = Math.floor(Math.random() * height);
      
      // Calculate line coordinates using glitchSize
      const lineHeight = Math.max(1, Math.floor(settings.glitchSize * Math.random()));
      
      // Generate random offset scaled by glitchSize
      const offsetX = Math.floor(Math.random() * width * (settings.glitchSize / 100));
      
      // Shift this horizontal line by offsetX
      for (let h = 0; h < lineHeight; h++) {
        if (y + h >= height) continue;
        
        // Create a temporary array to hold the line
        const tempLine = [];
        for (let x = 0; x < width; x++) {
          const i = ((y + h) * width + x) * 4;
          tempLine.push([pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]]);
        }
        
        // Shift the line and write it back
        for (let x = 0; x < width; x++) {
          const sourceX = (x + offsetX) % width;
          const sourcePixel = tempLine[sourceX];
          const targetI = ((y + h) * width + x) * 4;
          
          pixels[targetI] = sourcePixel[0];
          pixels[targetI+1] = sourcePixel[1];
          pixels[targetI+2] = sourcePixel[2];
          pixels[targetI+3] = sourcePixel[3];
        }
      }
    }
  }
  
  // Apply vertical glitch lines
  if (settings.glitchDirection === 'vertical' || settings.glitchDirection === 'both') {
    // Number of glitch columns - scaled by both intensity and density
    const numGlitchColumns = Math.max(1, Math.floor(width * intensity * densityFactor * 0.5));
    
    for (let i = 0; i < numGlitchColumns; i++) {
      // Pick a random column
      const x = Math.floor(Math.random() * width);
      
      // Calculate column coordinates using glitchSize
      const columnWidth = Math.max(1, Math.floor(settings.glitchSize * Math.random()));
      
      // Generate random offset scaled by glitchSize
      const offsetY = Math.floor(Math.random() * height * (settings.glitchSize / 100));
      
      // Shift this vertical column by offsetY
      for (let w = 0; w < columnWidth; w++) {
        if (x + w >= width) continue;
        
        // Create a temporary array to hold the column
        const tempColumn = [];
        for (let y = 0; y < height; y++) {
          const i = (y * width + (x + w)) * 4;
          tempColumn.push([pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]]);
        }
        
        // Shift the column and write it back
        for (let y = 0; y < height; y++) {
          const sourceY = (y + offsetY) % height;
          const sourcePixel = tempColumn[sourceY];
          const targetI = (y * width + (x + w)) * 4;
          
          pixels[targetI] = sourcePixel[0];
          pixels[targetI+1] = sourcePixel[1];
          pixels[targetI+2] = sourcePixel[2];
          pixels[targetI+3] = sourcePixel[3];
        }
      }
    }
  }
  
  // Random color distortions - use intensity and density
  if (intensity > 0.2) {
    // Scale by density for better control
    const numColorDistortions = Math.max(1, Math.floor(width * height * 0.001 * intensity * densityFactor));
    
    for (let i = 0; i < numColorDistortions; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const w = Math.min(Math.floor(settings.glitchSize * 3 * Math.random()) + 5, width - x);
      const h = Math.min(Math.floor(settings.glitchSize * 3 * Math.random()) + 5, height - y);
      
      const channel = Math.floor(Math.random() * 3); // 0 = red, 1 = green, 2 = blue
      const amount = Math.floor(Math.random() * 100) - 50;
      
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          pixels[i + channel] = Math.max(0, Math.min(255, pixels[i + channel] + amount));
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
} 