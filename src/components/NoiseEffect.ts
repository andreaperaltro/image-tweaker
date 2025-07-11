import { NoiseEffectSettings } from '../types';
import { Noise } from 'noisejs';

function blend(a: number, b: number, mode: string): number {
  switch (mode) {
    case 'multiply':
      return (a * b) / 255;
    case 'screen':
      return 255 - (((255 - a) * (255 - b)) / 255);
    case 'overlay':
      return a < 128 ? (2 * a * b) / 255 : 255 - 2 * (255 - a) * (255 - b) / 255;
    case 'darken':
      return Math.min(a, b);
    case 'lighten':
      return Math.max(a, b);
    case 'color-dodge':
      return a === 0 ? 0 : b === 255 ? 255 : Math.min(255, a / (255 - b) * 255);
    case 'color-burn':
      return a === 255 ? 255 : b === 0 ? 0 : 255 - Math.min(255, (255 - a) / b * 255);
    case 'hard-light':
      return b < 128 ? (2 * a * b) / 255 : 255 - 2 * (255 - a) * (255 - b) / 255;
    case 'soft-light':
      return b < 128 ? a - (255 - 2 * b) * a * (255 - a) / (255 * 255) : a + (2 * b - 255) * (Math.sqrt(a / 255) * 255 - a) / 255;
    case 'difference':
      return Math.abs(a - b);
    case 'exclusion':
      return a + b - (2 * a * b) / 255;
    case 'normal':
    default:
      return b;
  }
}

export function applyNoiseEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: import('../types').NoiseEffectSettings
) {
  if (!settings.enabled) return;
  const { intensity = 0.5, scale = 0.1, seed = 0, blendMode = 'normal', monochrome = false, channel = 'all', type = 'perlin', octaves = 4, persistence = 0.5, amount = 1, density = 1 } = settings;
  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  const noise = new Noise(seed);
  const freq = 1 / Math.max(scale, 0.0001);

  // fBm (fractal Brownian motion) for Perlin/Simplex
  function fbm(x: number, y: number) {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;
    let frequency = 1;
    for (let o = 0; o < octaves; o++) {
      let n = 0;
      if (type === 'perlin') {
        n = noise.perlin2(x * freq * frequency, y * freq * frequency);
      } else if (type === 'simplex' && noise.simplex2) {
        n = noise.simplex2(x * freq * frequency, y * freq * frequency);
      }
      total += n * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    // Normalize to [-1, 1]
    return maxValue > 0 ? total / maxValue : 0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Density: only apply noise to a fraction of pixels
      if (density < 1 && Math.random() > density) {
        // Copy original pixel
        dstData.data[idx + 0] = srcData.data[idx + 0];
        dstData.data[idx + 1] = srcData.data[idx + 1];
        dstData.data[idx + 2] = srcData.data[idx + 2];
        dstData.data[idx + 3] = srcData.data[idx + 3];
        continue;
      }
      // Use fBm for Perlin/Simplex, else single noise
      let n = 0;
      if (type === 'perlin' || type === 'simplex') {
        n = (fbm(x, y) * 0.5 + 0.5) * 255;
      } else {
        n = (noise.perlin2(x * freq, y * freq) * 0.5 + 0.5) * 255;
      }
      if (monochrome) n = Math.round(n);
      for (let c = 0; c < 3; c++) {
        const orig = srcData.data[idx + c];
        // Only apply noise to selected channel(s)
        const applyToChannel =
          channel === 'all' ||
          (channel === 'r' && c === 0) ||
          (channel === 'g' && c === 1) ||
          (channel === 'b' && c === 2);
        let noiseVal = orig;
        if (applyToChannel) {
          let nVal = monochrome ? n : 0;
          if (type === 'perlin' || type === 'simplex') {
            nVal = monochrome ? n : (fbm(x + c * 1000, y) * 0.5 + 0.5) * 255;
          } else {
            nVal = monochrome ? n : (noise.perlin2((x + c * 1000) * freq, y * freq) * 0.5 + 0.5) * 255;
          }
          // Amount: blend between original and noise value
          noiseVal = Math.round(orig * (1 - intensity * amount) + nVal * intensity * amount);
        }
        dstData.data[idx + c] = Math.round(
          blend(orig, noiseVal, blendMode)
        );
      }
      dstData.data[idx + 3] = srcData.data[idx + 3];
    }
  }
  ctx.putImageData(dstData, 0, 0);
} 