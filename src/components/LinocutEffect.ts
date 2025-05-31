import { LinocutEffectSettings } from '../types';
export type { LinocutEffectSettings } from '../types';
import { Noise } from 'noisejs';

function getBrightness(r: number, g: number, b: number): number {
  // Standard luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function applyLinocutEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: LinocutEffectSettings
) {
  if (!settings.enabled) return;
  const {
    lineSpacing = 10, // Distance between lines
    strokeWidth = 8,  // Maximum line thickness
    noiseScale = 0.015,
    centerX = 0.5,
    centerY = 0.5,
    invert = false,
    orientation = 'horizontal',
    threshold = 0.5,
    minLine = 1,      // Minimum line thickness
  } = settings as any;
  const noise = new Noise(42);
  const imgData = ctx.getImageData(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = invert ? 'black' : 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = invert ? 'white' : 'black';
  for (let i = 0; i < (orientation === 'horizontal' ? height : width); i += lineSpacing) {
    for (let j = 0; j < (orientation === 'horizontal' ? width : height); j++) {
      // Map to image coordinates
      const x = orientation === 'horizontal' ? j : i;
      const y = orientation === 'horizontal' ? i : j;
      // Get brightness
      const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
      const r = imgData.data[idx];
      const g = imgData.data[idx + 1];
      const b = imgData.data[idx + 2];
      const brightness = getBrightness(r, g, b);
      // Smoother noise-based curve, blend with sine, use center for phase
      const n = noise.perlin2(j * noiseScale, i * noiseScale);
      const phase = (j * 0.08) + ((orientation === 'horizontal' ? centerX : centerY) - 0.5) * Math.PI * 2;
      const curve = Math.sin(phase) * lineSpacing * 0.5 + n * lineSpacing * 0.2;
      const modX = orientation === 'horizontal' ? x : x + curve;
      const modY = orientation === 'horizontal' ? y + curve : y;
      // Map brightness to line thickness (thicker in dark)
      let band = invert
        ? minLine + (strokeWidth - minLine) * brightness
        : minLine + (strokeWidth - minLine) * (1 - brightness);
      // Apply threshold: only draw if above threshold
      if (brightness > threshold) band = 0;
      if (band > 0.1) {
        ctx.beginPath();
        if (orientation === 'horizontal') {
          ctx.moveTo(modX, modY - band / 2);
          ctx.lineTo(modX, modY + band / 2);
        } else {
          ctx.moveTo(modX - band / 2, modY);
          ctx.lineTo(modX + band / 2, modY);
        }
        ctx.lineWidth = band;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  // Threshold to pure black/white (optional, for extra crispness)
  const outData = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < outData.data.length; i += 4) {
    const v = outData.data[i];
    const bw = v > 128 ? 255 : 0;
    outData.data[i] = outData.data[i + 1] = outData.data[i + 2] = bw;
  }
  ctx.putImageData(outData, 0, 0);
} 