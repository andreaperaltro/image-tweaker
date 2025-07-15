/**
 * Image Manipulation Utility Functions
 */

// Color conversion and manipulation utilities
export function pseudoNoise(x: number, y: number, scale: number): number {
  const dot = x * 12.9898 + y * 78.233;
  const sin = Math.sin(dot) * 43758.5453123;
  return (sin - Math.floor(sin)) * scale;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(rgb: { r: number, g: number, b: number }): string {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [h * 360, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r, g, b;

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

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ];
}

export function modifyColor(hex: string, hueOffset: number): string {
  const rgb = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const newH = (h + hueOffset + 360) % 360;
  const [nr, ng, nb] = hslToRgb(newH, s, l);
  return rgbToHex({ r: nr, g: ng, b: nb });
}

// Image drawing utility functions
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement
) {
  const imgAspect = image.naturalWidth / image.naturalHeight;
  const canvasAspect = width / height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspect > canvasAspect) {
    // Image is wider than canvas
    drawHeight = height;
    drawWidth = image.naturalWidth * (height / image.naturalHeight);
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Image is taller than canvas
    drawWidth = width;
    drawHeight = image.naturalHeight * (width / image.naturalWidth);
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

// Types for halftone arrangements and shapes
export type HalftoneArrangement = 'grid' | 'hexagonal' | 'circular';
export type HalftoneShape = 'circle' | 'square' | 'diamond' | 'triangle';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Helper for halftone drawing
export function drawHalftoneDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  shape: HalftoneShape
) {
  ctx.beginPath();
  
  switch (shape) {
    case 'circle':
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      break;
      
    case 'square':
      ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
      break;
      
    case 'diamond':
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius, y);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius, y);
      break;
      
    case 'triangle':
      const height = radius * Math.sqrt(3);
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + height / 2, y + radius / 2);
      ctx.lineTo(x - height / 2, y + radius / 2);
      break;
  }
  
  ctx.fill();
} 