/**
 * Gradient Map Utility Functions
 * 
 * This module provides functionality for mapping image brightness
 * to colors from a gradient.
 */

export interface GradientMapSettings {
  enabled: boolean;
  stops: GradientStop[];
  blendMode: GradientMapBlendMode;
  opacity: number;
}

export interface GradientStop {
  position: number; // 0-100 percentage
  color: string;    // hex color
}

export type GradientMapBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'hard-light' | 'soft-light' | 'color' | 'luminosity';

/**
 * Apply gradient map effect to a canvas
 */
export function applyGradientMap(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: GradientMapSettings
): void {
  if (!settings.enabled || settings.stops.length < 2) return;
  
  // Get source context
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;
  
  // Create temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // Draw source image
  tempCtx.drawImage(sourceCanvas, 0, 0);
  
  // Get image data
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  // Sort gradient stops by position
  const sortedStops = [...settings.stops].sort((a, b) => a.position - b.position);
  
  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Calculate brightness (0-1)
    const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    
    // Map brightness to position in gradient (0-100)
    const position = brightness * 100;
    
    // Find color in gradient
    const color = getColorFromGradient(position, sortedStops);
    
    // Apply color based on blend mode
    applyColorWithBlendMode(
      data, i,
      color[0], color[1], color[2],
      settings.blendMode,
      settings.opacity
    );
  }
  
  // Put the modified image data back
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw the result back to the main canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
}

/**
 * Get a color from a gradient at a specific position
 */
function getColorFromGradient(position: number, stops: GradientStop[]): number[] {
  // Handle edge cases
  if (stops.length === 0) return [0, 0, 0];
  if (stops.length === 1) return hexToRgb(stops[0].color);
  
  // Find the two stops that surround the position
  let lowerStop = stops[0];
  let upperStop = stops[stops.length - 1];
  
  for (let i = 0; i < stops.length - 1; i++) {
    if (position >= stops[i].position && position <= stops[i + 1].position) {
      lowerStop = stops[i];
      upperStop = stops[i + 1];
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
  
  return [
    Math.round(lowerColor[0] + normPosition * (upperColor[0] - lowerColor[0])),
    Math.round(lowerColor[1] + normPosition * (upperColor[1] - lowerColor[1])),
    Math.round(lowerColor[2] + normPosition * (upperColor[2] - lowerColor[2]))
  ];
}

/**
 * Apply a color to a pixel with the specified blend mode
 */
function applyColorWithBlendMode(
  data: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number,
  blendMode: GradientMapBlendMode,
  opacity: number
): void {
  const sr = data[i];
  const sg = data[i + 1];
  const sb = data[i + 2];
  
  let result: number[] = [sr, sg, sb];
  
  switch (blendMode) {
    case 'normal':
      result = [r, g, b];
      break;
    case 'multiply':
      result = [
        (sr * r) / 255,
        (sg * g) / 255,
        (sb * b) / 255
      ];
      break;
    case 'screen':
      result = [
        255 - ((255 - sr) * (255 - r)) / 255,
        255 - ((255 - sg) * (255 - g)) / 255,
        255 - ((255 - sb) * (255 - b)) / 255
      ];
      break;
    case 'overlay':
      result = [
        sr < 128 ? (2 * sr * r) / 255 : 255 - (2 * (255 - sr) * (255 - r)) / 255,
        sg < 128 ? (2 * sg * g) / 255 : 255 - (2 * (255 - sg) * (255 - g)) / 255,
        sb < 128 ? (2 * sb * b) / 255 : 255 - (2 * (255 - sb) * (255 - b)) / 255
      ];
      break;
    case 'hard-light':
      result = [
        r < 128 ? (2 * r * sr) / 255 : 255 - (2 * (255 - r) * (255 - sr)) / 255,
        g < 128 ? (2 * g * sg) / 255 : 255 - (2 * (255 - g) * (255 - sg)) / 255,
        b < 128 ? (2 * b * sb) / 255 : 255 - (2 * (255 - b) * (255 - sb)) / 255
      ];
      break;
    case 'soft-light':
      result = [
        ((255 - sr) * sr * r) / (255 * 255) + (sr * (255 - (255 - sr) * (255 - r) / 255)) / 255,
        ((255 - sg) * sg * g) / (255 * 255) + (sg * (255 - (255 - sg) * (255 - g) / 255)) / 255,
        ((255 - sb) * sb * b) / (255 * 255) + (sb * (255 - (255 - sb) * (255 - b) / 255)) / 255
      ];
      break;
    case 'color':
      // Convert RGB to HSL, keep source luminance but use target hue and saturation
      const sourceHSL = rgbToHsl(sr, sg, sb);
      const targetHSL = rgbToHsl(r, g, b);
      const blendedRGB = hslToRgb(targetHSL[0], targetHSL[1], sourceHSL[2]);
      result = blendedRGB;
      break;
    case 'luminosity':
      // Convert RGB to HSL, keep source hue and saturation but use target luminance
      const sourceHSL2 = rgbToHsl(sr, sg, sb);
      const targetHSL2 = rgbToHsl(r, g, b);
      const blendedRGB2 = hslToRgb(sourceHSL2[0], sourceHSL2[1], targetHSL2[2]);
      result = blendedRGB2;
      break;
  }
  
  // Apply opacity
  result = [
    Math.round(sr + (result[0] - sr) * opacity),
    Math.round(sg + (result[1] - sg) * opacity),
    Math.round(sb + (result[2] - sb) * opacity)
  ];
  
  // Update pixel
  data[i] = result[0];
  data[i + 1] = result[1];
  data[i + 2] = result[2];
  // Alpha channel remains unchanged
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): number[] {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse as rgb
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return [r, g, b];
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): number[] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }
  
  return [h, s, l];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): number[] {
  let r = 0;
  let g = 0;
  let b = 0;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
} 