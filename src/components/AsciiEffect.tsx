// AsciiEffect.tsx

import { createFlowField, getFlowFieldAngle, FlowFieldSettings } from '../utils/FlowFieldUtils';

export interface AsciiEffectSettings {
  enabled: boolean;
  cellSize: number;
  fontSize: number;
  charset: string;
  backgroundColor?: string;
  monochrome?: boolean;
  jitter?: number;
  textColor?: string;
  rotationMax: number;
  rotationMode: 'none' | 'random' | 'flow';
}

// Preset ASCII character sets
export const ASCII_CHARSETS: Record<string, string> = {
  standard: '@%#*+=-:. ',
  complex: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  braille: '⣿⣷⣶⣤⣀ ',
  blocks: '█▓▒░ ',
};

export const applyAsciiEffect = (
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  settings: AsciiEffectSettings
) => {
  if (!settings.enabled) return;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const width = targetCanvas.width;
  const height = targetCanvas.height;
  const { 
    cellSize, 
    charset, 
    monochrome = true, 
    jitter = 0, 
    textColor = '#ffffff', 
    backgroundColor = '#000000', 
    rotationMode = 'none', 
    rotationMax = 0 
  } = settings;
  const chars = charset.split("");
  const charLen = chars.length;
  const fontSize = settings.fontSize || cellSize * 0.8;

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

  // Create flow field if needed
  let flowField: number[][] | null = null;
  if (rotationMode === 'flow') {
    const flowSettings: FlowFieldSettings = {
      scale: 0.01,
      strength: (rotationMax || 0) / 180,
      speed: 0,
      seed: Math.random()
    };
    flowField = createFlowField(
      Math.ceil(width / cellSize),
      Math.ceil(height / cellSize),
      flowSettings
    );
  }

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
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

      const brightness = count > 0 ? total / count : 0;
      const charIndex = Math.floor((brightness / 255) * (charLen - 1));
      const char = chars[charIndex];

      // Calculate rotation based on mode
      let rotation = 0;
      if (rotationMode === 'random') {
        rotation = (Math.random() - 0.5) * (rotationMax || 0);
      } else if (rotationMode === 'flow' && flowField) {
        rotation = getFlowFieldAngle(x, y, flowField, cellSize) * (180 / Math.PI);
      }

      // Jitter
      const jx = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
      const jy = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;

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
      ctx.rotate(rotation * Math.PI / 180);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }
}; 