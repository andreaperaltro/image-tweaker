/**
 * Threshold Effect Utility Functions
 */

export type ThresholdMode = 'solid' | 'gradient';

export interface ThresholdSettings {
  enabled: boolean;
  mode: ThresholdMode;
  threshold: number;
  // Solid colors
  darkColor: string;
  lightColor: string;
  // Gradient colors
  darkColorStart: string;
  darkColorEnd: string;
  lightColorStart: string;
  lightColorEnd: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Apply threshold effect to a canvas
 */
export function applyThreshold(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: ThresholdSettings
): void {
  if (!settings.enabled) return;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // Process each pixel
  for (let y = 0; y < height; y++) {
    // Calculate vertical position factor for gradient (0 at top, 1 at bottom)
    const gradientFactor = y / height;

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Calculate grayscale value
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      
      // Determine if pixel is dark or light based on threshold
      const isDark = gray < settings.threshold;

      let finalColor: { r: number; g: number; b: number };
      
      if (settings.mode === 'solid') {
        // Use solid colors
        const color = isDark ? settings.darkColor : settings.lightColor;
        finalColor = hexToRgb(color);
      } else {
        // Use gradient colors
        const darkColor = interpolateColor(settings.darkColorStart, settings.darkColorEnd, gradientFactor);
        const lightColor = interpolateColor(settings.lightColorStart, settings.lightColorEnd, gradientFactor);
        finalColor = hexToRgb(isDark ? darkColor : lightColor);
      }

      // Apply the color
      data[i] = finalColor.r;     // R
      data[i + 1] = finalColor.g; // G
      data[i + 2] = finalColor.b; // B
      // Alpha channel remains unchanged
    }
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
} 