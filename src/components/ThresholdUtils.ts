/**
 * Threshold Effect Utility Functions
 */

export type ThresholdMode = 'solid' | 'gradient';

export interface ThresholdStop {
  position: number; // 0-100 percentage
  color: string;    // hex color
}

export interface ThresholdSettings {
  enabled: boolean;
  mode: ThresholdMode;
  threshold: number;
  // Solid colors
  darkColor: string;
  lightColor: string;
  // Gradient colors
  darkStops: ThresholdStop[];
  lightStops: ThresholdStop[];
  darkGradientAngle: number;
  lightGradientAngle: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface GradientRGB {
  start: RGB;
  end: RGB;
}

export function applyThreshold(
  imageData: ImageData,
  settings: ThresholdSettings
): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);

  const darkRGB = settings.mode === 'solid'
    ? hexToRgb(settings.darkColor)
    : { 
        start: hexToRgb(settings.darkStops[0].color), 
        end: hexToRgb(settings.darkStops[settings.darkStops.length - 1].color) 
      } as GradientRGB;
  const lightRGB = settings.mode === 'solid'
    ? hexToRgb(settings.lightColor)
    : { 
        start: hexToRgb(settings.lightStops[0].color), 
        end: hexToRgb(settings.lightStops[settings.lightStops.length - 1].color) 
      } as GradientRGB;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Calculate grayscale value
      const grayscale = (r + g + b) / 3;

      // Determine if pixel is above or below threshold
      const isDark = grayscale < settings.threshold;

      if (settings.mode === 'solid') {
        // Use solid colors
        const color = isDark ? darkRGB : lightRGB;
        if ('r' in color) { // Type guard for RGB
          output.data[i] = color.r;
          output.data[i + 1] = color.g;
          output.data[i + 2] = color.b;
          output.data[i + 3] = a;
        }
      } else {
        // Use gradient colors
        const angle = isDark ? settings.darkGradientAngle : settings.lightGradientAngle;
        const stops = isDark ? settings.darkStops : settings.lightStops;
        
        // Calculate gradient position based on angle and pixel position
        const radians = (angle - 90) * Math.PI / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        // Normalize coordinates to -1 to 1 range
        const normalizedX = (x / width) * 2 - 1;
        const normalizedY = (y / height) * 2 - 1;
        
        // Calculate dot product for gradient position
        const gradientPos = ((normalizedX * cos + normalizedY * sin) + 1) / 2;
        
        // Find the appropriate color stops
        let startStop = stops[0];
        let endStop = stops[1];
        
        for (let i = 1; i < stops.length; i++) {
          if (gradientPos * 100 >= stops[i - 1].position && gradientPos * 100 <= stops[i].position) {
            startStop = stops[i - 1];
            endStop = stops[i];
            break;
          }
        }
        
        // Calculate interpolation factor between stops
        const stopRange = endStop.position - startStop.position;
        const factor = stopRange === 0 ? 0 : ((gradientPos * 100) - startStop.position) / stopRange;
        
        // Interpolate between colors
        const startColor = hexToRgb(startStop.color);
        const endColor = hexToRgb(endStop.color);
        
        output.data[i] = Math.round(startColor.r + (endColor.r - startColor.r) * factor);
        output.data[i + 1] = Math.round(startColor.g + (endColor.g - startColor.g) * factor);
        output.data[i + 2] = Math.round(startColor.b + (endColor.b - startColor.b) * factor);
        output.data[i + 3] = a;
      }
    }
  }

  return output;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 }; // Default to black if invalid hex
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

function isGradientRGB(rgb: RGB | GradientRGB): rgb is GradientRGB {
  return 'start' in rgb && 'end' in rgb;
} 