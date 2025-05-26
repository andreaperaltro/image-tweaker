import { LevelsEffectSettings } from './PixelEffect';

export function applyLevelsEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: LevelsEffectSettings
) {
  if (!settings.enabled) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const black = Math.max(0, Math.min(255, settings.black));
  const white = Math.max(0, Math.min(255, settings.white));
  const gamma = Math.max(0.1, settings.gamma);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = data[i + c];
      let norm = (v - black) / (white - black);
      norm = Math.max(0, Math.min(1, norm));
      norm = Math.pow(norm, 1 / gamma);
      data[i + c] = Math.round(norm * 255);
    }
    // alpha unchanged
  }
  ctx.putImageData(imageData, 0, 0);
} 