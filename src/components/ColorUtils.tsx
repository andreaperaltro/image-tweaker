/**
 * Color Processing and Effects Utility Functions
 * 
 * This module provides functionality for:
 * 1. Color space conversions (HEX, RGB, HSL)
 * 2. Color manipulation (hue shifting, saturation, posterization)
 * 3. Visual effects like glitch and blending
 */

export type ColorSettings = {
  enabled: boolean;
  hueShift: number;        // -180 to 180 degrees
  saturation: number;      // 0 to 200%
  brightness: number;      // 0 to 200%
  contrast: number;        // 0 to 200%
  posterize: number;       // 2 to 32 levels
  invert: boolean;
  glitchIntensity: number; // 0 to 100%
  glitchSeed: number;      // Random seed for glitch effect
  blendMode: BlendMode;
};

export type BackgroundSettings = {
  type: 'color' | 'gradient';
  color: string;             // Solid color or gradient start
  gradientEndColor: string;  // Gradient end color
  gradientAngle: number;     // Gradient angle in degrees
};

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

// Convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  return { r, g, b };
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
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
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Apply color adjustments to an image
export function applyColorAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: ColorSettings
): void {
  if (!settings.enabled) return;
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  
  // Apply various color adjustments
  for (let i = 0; i < data.length; i += 4) {
    // Get RGB values
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Convert to HSL for hue and saturation adjustments
    let { h, s, l } = rgbToHsl(r, g, b);
    
    // Apply hue shift
    h = (h + settings.hueShift) % 360;
    if (h < 0) h += 360;
    
    // Apply saturation adjustment
    s = Math.min(100, Math.max(0, s * (settings.saturation / 100)));
    
    // Apply brightness adjustment
    l = Math.min(100, Math.max(0, l * (settings.brightness / 100)));
    
    // Convert back to RGB
    const rgb = hslToRgb(h, s, l);
    r = rgb.r;
    g = rgb.g;
    b = rgb.b;
    
    // Apply contrast adjustment
    const factor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
    r = Math.min(255, Math.max(0, Math.round(factor * (r - 128) + 128)));
    g = Math.min(255, Math.max(0, Math.round(factor * (g - 128) + 128)));
    b = Math.min(255, Math.max(0, Math.round(factor * (b - 128) + 128)));
    
    // Apply posterization (color quantization)
    if (settings.posterize > 0) {
      const levels = Math.max(2, Math.min(32, Math.round(settings.posterize)));
      const step = 255 / (levels - 1);
      r = Math.round(Math.round(r / step) * step);
      g = Math.round(Math.round(g / step) * step);
      b = Math.round(Math.round(b / step) * step);
    }
    
    // Apply invert
    if (settings.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }
    
    // Apply glitch effect
    if (settings.glitchIntensity > 0) {
      const glitchAmount = settings.glitchIntensity / 100;
      
      // Use seed to ensure consistent glitch pattern
      const seedOffset = settings.glitchSeed * 1000;
      
      // RGB channel shifting
      if (Math.random() < glitchAmount * 0.3) {
        const shiftAmount = Math.floor(Math.random() * 20 * glitchAmount);
        const shiftIndex = (i + shiftAmount * 4) % data.length;
        r = data[shiftIndex] || r;
      }
      
      if (Math.random() < glitchAmount * 0.3) {
        const shiftAmount = Math.floor(Math.random() * 20 * glitchAmount);
        const shiftIndex = (i + shiftAmount * 4 + 1) % data.length;
        g = data[shiftIndex] || g;
      }
      
      if (Math.random() < glitchAmount * 0.3) {
        const shiftAmount = Math.floor(Math.random() * 20 * glitchAmount);
        const shiftIndex = (i + shiftAmount * 4 + 2) % data.length;
        b = data[shiftIndex] || b;
      }
    }
    
    // Update pixel values
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    // Alpha channel remains unchanged
  }
  
  // Put the modified data back
  ctx.putImageData(imageData, 0, 0);
}

// Draw background (solid color or gradient)
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BackgroundSettings
): void {
  if (settings.type === 'color') {
    // Solid color background
    ctx.fillStyle = settings.color;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Gradient background
    const angleRad = (settings.gradientAngle * Math.PI) / 180;
    
    // Calculate gradient vector based on angle
    const x1 = width / 2 - Math.cos(angleRad) * width;
    const y1 = height / 2 - Math.sin(angleRad) * height;
    const x2 = width / 2 + Math.cos(angleRad) * width;
    const y2 = height / 2 + Math.sin(angleRad) * height;
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, settings.color);
    gradient.addColorStop(1, settings.gradientEndColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

// Apply blend mode between source and destination canvases
export function applyBlendMode(
  destCtx: CanvasRenderingContext2D,
  srcCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  blendMode: BlendMode
): void {
  // If it's just normal blend mode, simply draw the source onto destination
  if (blendMode === 'normal') {
    destCtx.drawImage(srcCanvas, 0, 0);
    return;
  }
  
  // Get image data from both canvases
  const destData = destCtx.getImageData(0, 0, width, height);
  const destPixels = destData.data;
  
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return;
  
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const srcPixels = srcData.data;
  
  // Apply the selected blend mode
  for (let i = 0; i < destPixels.length; i += 4) {
    const dR = destPixels[i];
    const dG = destPixels[i + 1];
    const dB = destPixels[i + 2];
    const dA = destPixels[i + 3];
    
    const sR = srcPixels[i];
    const sG = srcPixels[i + 1];
    const sB = srcPixels[i + 2];
    const sA = srcPixels[i + 3];
    
    // Normalize values to 0-1 range
    const dRn = dR / 255;
    const dGn = dG / 255;
    const dBn = dB / 255;
    
    const sRn = sR / 255;
    const sGn = sG / 255;
    const sBn = sB / 255;
    
    let resultR = 0;
    let resultG = 0;
    let resultB = 0;
    
    // Apply blend calculations based on mode
    switch (blendMode) {
      case 'multiply':
        resultR = dRn * sRn;
        resultG = dGn * sGn;
        resultB = dBn * sBn;
        break;
        
      case 'screen':
        resultR = 1 - (1 - dRn) * (1 - sRn);
        resultG = 1 - (1 - dGn) * (1 - sGn);
        resultB = 1 - (1 - dBn) * (1 - sBn);
        break;
        
      case 'overlay':
        resultR = dRn < 0.5 ? 2 * dRn * sRn : 1 - 2 * (1 - dRn) * (1 - sRn);
        resultG = dGn < 0.5 ? 2 * dGn * sGn : 1 - 2 * (1 - dGn) * (1 - sGn);
        resultB = dBn < 0.5 ? 2 * dBn * sBn : 1 - 2 * (1 - dBn) * (1 - sBn);
        break;
        
      case 'darken':
        resultR = Math.min(dRn, sRn);
        resultG = Math.min(dGn, sGn);
        resultB = Math.min(dBn, sBn);
        break;
        
      case 'lighten':
        resultR = Math.max(dRn, sRn);
        resultG = Math.max(dGn, sGn);
        resultB = Math.max(dBn, sBn);
        break;
        
      case 'color-dodge':
        resultR = dRn === 0 ? 0 : sRn === 1 ? 1 : Math.min(1, dRn / (1 - sRn));
        resultG = dGn === 0 ? 0 : sGn === 1 ? 1 : Math.min(1, dGn / (1 - sGn));
        resultB = dBn === 0 ? 0 : sBn === 1 ? 1 : Math.min(1, dBn / (1 - sBn));
        break;
        
      case 'color-burn':
        resultR = dRn === 1 ? 1 : sRn === 0 ? 0 : 1 - Math.min(1, (1 - dRn) / sRn);
        resultG = dGn === 1 ? 1 : sGn === 0 ? 0 : 1 - Math.min(1, (1 - dGn) / sGn);
        resultB = dBn === 1 ? 1 : sBn === 0 ? 0 : 1 - Math.min(1, (1 - dBn) / sBn);
        break;
        
      case 'hard-light':
        resultR = sRn < 0.5 ? 2 * dRn * sRn : 1 - 2 * (1 - dRn) * (1 - sRn);
        resultG = sGn < 0.5 ? 2 * dGn * sGn : 1 - 2 * (1 - dGn) * (1 - sGn);
        resultB = sBn < 0.5 ? 2 * dBn * sBn : 1 - 2 * (1 - dBn) * (1 - sBn);
        break;
        
      case 'soft-light':
        resultR = sRn < 0.5 ? dRn - (1 - 2 * sRn) * dRn * (1 - dRn) : dRn + (2 * sRn - 1) * (dRn <= 0.25 ? ((16 * dRn - 12) * dRn + 4) * dRn : Math.sqrt(dRn) - dRn);
        resultG = sGn < 0.5 ? dGn - (1 - 2 * sGn) * dGn * (1 - dGn) : dGn + (2 * sGn - 1) * (dGn <= 0.25 ? ((16 * dGn - 12) * dGn + 4) * dGn : Math.sqrt(dGn) - dGn);
        resultB = sBn < 0.5 ? dBn - (1 - 2 * sBn) * dBn * (1 - dBn) : dBn + (2 * sBn - 1) * (dBn <= 0.25 ? ((16 * dBn - 12) * dBn + 4) * dBn : Math.sqrt(dBn) - dBn);
        break;
        
      case 'difference':
        resultR = Math.abs(dRn - sRn);
        resultG = Math.abs(dGn - sGn);
        resultB = Math.abs(dBn - sBn);
        break;
        
      case 'exclusion':
        resultR = dRn + sRn - 2 * dRn * sRn;
        resultG = dGn + sGn - 2 * dGn * sGn;
        resultB = dBn + sBn - 2 * dBn * sBn;
        break;
        
      default:
        resultR = sRn;
        resultG = sGn;
        resultB = sBn;
    }
    
    // Convert back to 0-255 range and apply alpha blending
    destPixels[i] = Math.round(resultR * 255);
    destPixels[i + 1] = Math.round(resultG * 255);
    destPixels[i + 2] = Math.round(resultB * 255);
    // Alpha value remains the same (could be modified for more advanced blending)
  }
  
  // Put the modified data back
  destCtx.putImageData(destData, 0, 0);
} 