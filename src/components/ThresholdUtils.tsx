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

function interpolateColor(color1: string, color2: string, factor: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getColorFromGradient(position: number, stops: ThresholdStop[], angle: number): RGB {
  // Handle edge cases
  if (stops.length === 0) return { r: 0, g: 0, b: 0 };
  if (stops.length === 1) return hexToRgb(stops[0].color);
  
  // Sort stops by position
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  
  // Find the two stops that surround the position
  let lowerStop = sortedStops[0];
  let upperStop = sortedStops[sortedStops.length - 1];
  
  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (position >= sortedStops[i].position && position <= sortedStops[i + 1].position) {
      lowerStop = sortedStops[i];
      upperStop = sortedStops[i + 1];
      break;
    }
  }
  
  // If position is outside the range, use the closest stop
  if (position < lowerStop.position) return hexToRgb(lowerStop.color);
  if (position > upperStop.position) return hexToRgb(upperStop.color);
  
  // Interpolate between the two stops
  const range = upperStop.position - lowerStop.position;
  if (range === 0) return hexToRgb(lowerStop.color);
  
  const normPosition = (position - lowerStop.position) / range;
  
  const lowerColor = hexToRgb(lowerStop.color);
  const upperColor = hexToRgb(upperStop.color);
  
  return {
    r: Math.round(lowerColor.r + normPosition * (upperColor.r - lowerColor.r)),
    g: Math.round(lowerColor.g + normPosition * (upperColor.g - lowerColor.g)),
    b: Math.round(lowerColor.b + normPosition * (upperColor.b - lowerColor.b))
  };
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
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Calculate grayscale value
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      
      // Determine if pixel is dark or light based on threshold
      const isDark = gray < settings.threshold;

      let finalColor: RGB;
      
      if (settings.mode === 'solid') {
        // Use solid colors
        const color = isDark ? settings.darkColor : settings.lightColor;
        finalColor = hexToRgb(color);
      } else {
        // Calculate gradient position based on angle
        const angle = isDark ? settings.darkGradientAngle : settings.lightGradientAngle;
        const angleRad = (angle * Math.PI) / 180;
        
        // Calculate normalized position along the gradient vector
        const centerX = width / 2;
        const centerY = height / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        
        // Rotate point by angle
        const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
        const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
        
        // Map to 0-100 range
        const maxDist = Math.sqrt(width * width + height * height) / 2;
        const position = ((rotatedX + maxDist) / (2 * maxDist)) * 100;
        
        // Get color from gradient
        finalColor = getColorFromGradient(
          position,
          isDark ? settings.darkStops : settings.lightStops,
          isDark ? settings.darkGradientAngle : settings.lightGradientAngle
        );
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

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
} 