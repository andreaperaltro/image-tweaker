export interface ThresholdSettings {
  enabled: boolean;
  threshold: number;
  darkColor: string;
  lightColor: string;
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
  const darkRGB = hexToRgb(settings.darkColor);
  const lightRGB = hexToRgb(settings.lightColor);

  if (!darkRGB || !lightRGB) return;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Apply threshold
    if (gray < settings.threshold) {
      data[i] = darkRGB.r;     // R
      data[i + 1] = darkRGB.g; // G
      data[i + 2] = darkRGB.b; // B
    } else {
      data[i] = lightRGB.r;     // R
      data[i + 1] = lightRGB.g; // G
      data[i + 2] = lightRGB.b; // B
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
} 