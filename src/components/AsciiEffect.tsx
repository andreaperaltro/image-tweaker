// AsciiEffect.tsx

export interface AsciiEffectSettings {
  enabled: boolean;
  cellSize: number;
  fontSize: number;
  charset: string;
  backgroundColor?: string;
  monochrome?: boolean;
  jitter?: number;
  textColor?: string;
  rotationMax?: number;
  rotationMode?: string;
}

export function applyAsciiEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: AsciiEffectSettings
) {
  if (!settings.enabled) return;

  const { cellSize, fontSize, charset, backgroundColor, monochrome = true, jitter = 0, textColor, rotationMax = 0, rotationMode = 'none' } = settings;
  const chars = charset.split("");
  const charLen = chars.length;

  // Get image data from source canvas
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  ctx.clearRect(0, 0, width, height);
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      // Average brightness and color in cell
      let total = 0, count = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          const px = (x + dx) + (y + dy) * width;
          if (px * 4 + 2 < data.length) {
            const r = data[px * 4];
            const g = data[px * 4 + 1];
            const b = data[px * 4 + 2];
            total += (r + g + b) / 3;
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }
      }
      const avg = count > 0 ? total / count : 0;
      const charIdx = Math.floor((avg / 255) * (charLen - 1));
      const char = chars[charLen - 1 - charIdx] || ' ';
      // Jitter
      const jx = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
      const jy = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
      // Rotation
      let angle = 0;
      if (rotationMode === 'random' && rotationMax > 0) {
        angle = (Math.random() - 0.5) * 2 * rotationMax * Math.PI / 180;
      }
      // Color
      if (monochrome) {
        ctx.fillStyle = textColor || '#fff';
      } else {
        const r = count > 0 ? Math.round(rSum / count) : 255;
        const g = count > 0 ? Math.round(gSum / count) : 255;
        const b = count > 0 ? Math.round(bSum / count) : 255;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }
      ctx.save();
      ctx.translate(x + cellSize / 2 + jx, y + cellSize / 2 + jy);
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }
} 