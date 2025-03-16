/**
 * Displacement Mapping Utility Functions
 * 
 * This module provides functionality for:
 * 1. Analyzing brightness in an image
 * 2. Creating displacement maps based on brightness values
 * 3. Applying displacement effects to images
 */

export type DisplacementSettings = {
  enabled: boolean;
  horizontalAmount: number;
  verticalAmount: number;
  useRed: boolean;
  useGreen: boolean;
  useBlue: boolean;
  useAlpha: boolean;
  invert: boolean;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
};

/**
 * Apply displacement mapping to an image
 */
export function applyDisplacement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: DisplacementSettings
): void {
  if (!settings.enabled || (settings.horizontalAmount === 0 && settings.verticalAmount === 0)) {
    return;
  }
  
  // Get the image data to work with
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  // Create a copy of the original pixel data
  const originalData = new Uint8ClampedArray(data);
  
  // Weights for color channels when calculating brightness
  const useRed = settings.useRed ? 1 : 0;
  const useGreen = settings.useGreen ? 1 : 0;
  const useBlue = settings.useBlue ? 1 : 0;
  const useAlpha = settings.useAlpha ? 1 : 0;
  
  // Scale factors for the displacement
  const { scaleX, scaleY, offsetX, offsetY } = settings;
  const horizontalAmount = settings.horizontalAmount;
  const verticalAmount = settings.verticalAmount;
  const invert = settings.invert ? -1 : 1;
  
  // Apply displacement to each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // Calculate brightness value as displacement factor
      const r = originalData[index];
      const g = originalData[index + 1];
      const b = originalData[index + 2];
      const a = originalData[index + 3];
      
      // Sum of weighted channels (normalized to 0-1)
      let brightness = (
        r * useRed + 
        g * useGreen + 
        b * useBlue + 
        a * useAlpha
      ) / (255 * (useRed + useGreen + useBlue + (useAlpha ? 1 : 0) || 1));
      
      // Apply displacement amount (invert if needed)
      brightness = brightness * invert;
      
      // Apply scale and offset
      const displacementX = Math.round(horizontalAmount * brightness * scaleX + offsetX);
      const displacementY = Math.round(verticalAmount * brightness * scaleY + offsetY);
      
      // Source coordinates with displacement
      let srcX = x + displacementX;
      let srcY = y + displacementY;
      
      // Clamp to image boundaries
      srcX = Math.max(0, Math.min(width - 1, srcX));
      srcY = Math.max(0, Math.min(height - 1, srcY));
      
      // Source index
      const srcIndex = (srcY * width + srcX) * 4;
      
      // Copy pixels from the displaced position
      data[index] = originalData[srcIndex];
      data[index + 1] = originalData[srcIndex + 1];
      data[index + 2] = originalData[srcIndex + 2];
      data[index + 3] = originalData[srcIndex + 3];
    }
  }
  
  // Put the modified data back
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Generate a brightness map from an image
 * (can be used for visualization or further processing)
 */
export function generateBrightnessMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: DisplacementSettings
): ImageData {
  // Get the image data to work with
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const brightnessData = new ImageData(width, height);
  const brightnessPixels = brightnessData.data;
  
  // Weights for color channels when calculating brightness
  const useRed = settings.useRed ? 1 : 0;
  const useGreen = settings.useGreen ? 1 : 0;
  const useBlue = settings.useBlue ? 1 : 0;
  const useAlpha = settings.useAlpha ? 1 : 0;
  
  // Calculate brightness for each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Calculate brightness (0-255)
    let brightness = (
      r * useRed + 
      g * useGreen + 
      b * useBlue + 
      a * useAlpha
    ) / (useRed + useGreen + useBlue + (useAlpha ? 1 : 0) || 1);
    
    if (settings.invert) {
      brightness = 255 - brightness;
    }
    
    // Set grayscale values for the brightness map
    brightnessPixels[i] = brightness;
    brightnessPixels[i + 1] = brightness;
    brightnessPixels[i + 2] = brightness;
    brightnessPixels[i + 3] = 255; // Full alpha
  }
  
  return brightnessData;
} 