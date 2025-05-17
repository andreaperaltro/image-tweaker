export type ThresholdMode = 'solid' | 'gradient';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface GradientRGB {
  start: RGB | null;
  end: RGB | null;
}

export interface ThresholdSettings {
  enabled: boolean;
  mode: ThresholdMode;
  threshold: number;
  darkColor: string;
  lightColor: string;
  darkColorStart: string;
  darkColorEnd: string;
  lightColorStart: string;
  lightColorEnd: string;
}

export function applyThreshold(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: ThresholdSettings
): void {
  if (!settings.enabled) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert colors to RGB arrays
  const darkRGB = settings.mode === 'solid' 
    ? hexToRgb(settings.darkColor)
    : { 
        start: hexToRgb(settings.darkColorStart), 
        end: hexToRgb(settings.darkColorEnd) 
      };
  const lightRGB = settings.mode === 'solid'
    ? hexToRgb(settings.lightColor)
    : { 
        start: hexToRgb(settings.lightColorStart), 
        end: hexToRgb(settings.lightColorEnd) 
      };

  if (!darkRGB || !lightRGB) return;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Calculate position for gradient
    const x = (i / 4) % width;
    const progress = x / width;

    // Apply threshold
    if (gray < settings.threshold) {
      if (settings.mode === 'solid' && !isGradientRGB(darkRGB)) {
        data[i] = darkRGB.r;     // R
        data[i + 1] = darkRGB.g; // G
        data[i + 2] = darkRGB.b; // B
      } else if (settings.mode === 'gradient' && isGradientRGB(darkRGB) && darkRGB.start && darkRGB.end) {
        const start = darkRGB.start;
        const end = darkRGB.end;
        data[i] = Math.round(start.r + (end.r - start.r) * progress);     // R
        data[i + 1] = Math.round(start.g + (end.g - start.g) * progress); // G
        data[i + 2] = Math.round(start.b + (end.b - start.b) * progress); // B
      }
    } else {
      if (settings.mode === 'solid' && !isGradientRGB(lightRGB)) {
        data[i] = lightRGB.r;     // R
        data[i + 1] = lightRGB.g; // G
        data[i + 2] = lightRGB.b; // B
      } else if (settings.mode === 'gradient' && isGradientRGB(lightRGB) && lightRGB.start && lightRGB.end) {
        const start = lightRGB.start;
        const end = lightRGB.end;
        data[i] = Math.round(start.r + (end.r - start.r) * progress);     // R
        data[i + 1] = Math.round(start.g + (end.g - start.g) * progress); // G
        data[i + 2] = Math.round(start.b + (end.b - start.b) * progress); // B
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function isGradientRGB(rgb: RGB | GradientRGB): rgb is GradientRGB {
  return 'start' in rgb && 'end' in rgb;
} 