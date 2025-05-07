/**
 * Posterize Effect Utility Functions
 * 
 * This module provides functionality for:
 * 1. Reducing the number of colors in an image
 * 2. Creating a poster-like effect with distinct color bands
 */

export interface PosterizeSettings {
  enabled: boolean;
  levels: number;        // Number of color levels (2-256)
  colorMode: 'rgb' | 'hsv' | 'lab'; // Color space to posterize in
  preserveLuminance: boolean; // Whether to preserve luminance when posterizing
  dithering: boolean;    // Whether to apply dithering to smooth transitions
  ditherAmount: number;  // Amount of dithering (0-100)
}

/**
 * Apply the posterize effect to a canvas
 */
export function applyPosterize(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: PosterizeSettings
): void {
  if (!settings.enabled) return;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const levels = Math.max(2, Math.min(256, settings.levels));
  const step = 256 / levels;

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    if (settings.colorMode === 'rgb') {
      // Calculate the total color value (0-765)
      const totalColor = data[i] + data[i + 1] + data[i + 2];
      // Calculate the posterized value
      const posterizedValue = Math.round(totalColor / (3 * step)) * step;
      
      // Calculate the ratio to maintain relative color relationships
      const ratio = posterizedValue / totalColor;
      
      // Apply the posterization while maintaining color relationships
      data[i] = Math.min(255, Math.round(data[i] * ratio));     // R
      data[i + 1] = Math.min(255, Math.round(data[i + 1] * ratio)); // G
      data[i + 2] = Math.min(255, Math.round(data[i + 2] * ratio)); // B
    } else if (settings.colorMode === 'hsv') {
      // Convert RGB to HSV
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      let s = max === 0 ? 0 : delta / max;
      let v = max;

      if (delta !== 0) {
        if (max === r) {
          h = ((g - b) / delta) % 6;
        } else if (max === g) {
          h = (b - r) / delta + 2;
        } else {
          h = (r - g) / delta + 4;
        }
      }

      h = Math.round(h * 60);
      if (h < 0) h += 360;
      
      // Posterize HSV
      h = Math.round(h / step) * step;
      s = Math.round(s * 100 / step) * step / 100;
      v = Math.round(v * 100 / step) * step / 100;

      // Convert back to RGB
      const c = v * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = v - c;

      let r1 = 0, g1 = 0, b1 = 0;
      if (h >= 0 && h < 60) {
        r1 = c; g1 = x; b1 = 0;
      } else if (h >= 60 && h < 120) {
        r1 = x; g1 = c; b1 = 0;
      } else if (h >= 120 && h < 180) {
        r1 = 0; g1 = c; b1 = x;
      } else if (h >= 180 && h < 240) {
        r1 = 0; g1 = x; b1 = c;
      } else if (h >= 240 && h < 300) {
        r1 = x; g1 = 0; b1 = c;
      } else {
        r1 = c; g1 = 0; b1 = x;
      }

      data[i] = Math.round((r1 + m) * 255);
      data[i + 1] = Math.round((g1 + m) * 255);
      data[i + 2] = Math.round((b1 + m) * 255);
    } else if (settings.colorMode === 'lab') {
      // Calculate luminance
      const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const posterizedLuminance = Math.round(luminance / step) * step;
      
      if (settings.preserveLuminance) {
        const ratio = posterizedLuminance / luminance;
        data[i] = Math.min(255, Math.round(data[i] * ratio));
        data[i + 1] = Math.min(255, Math.round(data[i + 1] * ratio));
        data[i + 2] = Math.min(255, Math.round(data[i + 2] * ratio));
      } else {
        data[i] = posterizedLuminance;
        data[i + 1] = posterizedLuminance;
        data[i + 2] = posterizedLuminance;
      }
    }
  }

  // Apply dithering if enabled
  if (settings.dithering) {
    const ditherAmount = settings.ditherAmount / 100;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Simple Floyd-Steinberg dithering
        if (x < width - 1 && y < height - 1) {
          const error = (data[i] - Math.round(data[i] / step) * step) * ditherAmount;
          
          data[i + 4] += error * 7/16;     // Right
          data[i + width * 4] += error * 5/16;     // Bottom
          data[i + width * 4 - 4] += error * 3/16; // Bottom left
          data[i + width * 4 + 4] += error * 1/16; // Bottom right
        }
      }
    }
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
} 