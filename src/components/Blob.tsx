import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface BlobSettings {
  enabled: boolean;
  cellSize: number;
  mix: number;
  colored: boolean;
  arrangement: 'grid' | 'spiral' | 'concentric';
  shape: 'circle' | 'square' | 'diamond';
  connectionType: 'straight' | 'curved' | 'wavy';
  connectionStrength: number;
  connectionColor: string;
  minDistance: number;
  maxDistance: number;
  angleOffset: number;
  sizeVariation: number;
  dotScaleFactor: number;
  invertBrightness: boolean;
}

export const applyBlob = (
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: BlobSettings
) => {
  if (!settings.enabled) return;

  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;

  // Get image data
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Calculate grid
  const cellSize = settings.cellSize;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);

  // Store dots for connection
  const dots: { x: number; y: number; size: number; brightness: number }[] = [];

  // Create dots
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      // Get average brightness in cell
      let totalBrightness = 0;
      let count = 0;

      for (let i = Math.max(0, Math.floor(y - cellSize / 2)); i < Math.min(height, Math.floor(y + cellSize / 2)); i++) {
        for (let j = Math.max(0, Math.floor(x - cellSize / 2)); j < Math.min(width, Math.floor(x + cellSize / 2)); j++) {
          const idx = (i * width + j) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          totalBrightness += (r + g + b) / 3;
          count++;
        }
      }

      const brightness = count > 0 ? totalBrightness / count / 255 : 0;
      const adjustedBrightness = settings.invertBrightness ? 1 - brightness : brightness;

      // Calculate dot size
      const baseSize = cellSize * settings.dotScaleFactor;
      const sizeVariation = baseSize * settings.sizeVariation;
      const size = baseSize * adjustedBrightness + (Math.random() * sizeVariation - sizeVariation / 2);

      if (size > 0) {
        dots.push({ x, y, size, brightness: adjustedBrightness });
      }
    }
  }

  // Draw connections
  ctx.strokeStyle = settings.connectionColor;
  ctx.lineWidth = settings.connectionStrength;

  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dot1 = dots[i];
      const dot2 = dots[j];

      // Calculate distance between dots
      const dx = dot2.x - dot1.x;
      const dy = dot2.y - dot1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if dots should connect
      if (distance >= settings.minDistance && distance <= settings.maxDistance) {
        // Check if dots have similar sizes
        const sizeDiff = Math.abs(dot1.size - dot2.size);
        if (sizeDiff < dot1.size * 0.2) { // 20% size difference threshold
          ctx.beginPath();

          switch (settings.connectionType) {
            case 'straight':
              ctx.moveTo(dot1.x, dot1.y);
              ctx.lineTo(dot2.x, dot2.y);
              break;

            case 'curved':
              const midX = (dot1.x + dot2.x) / 2;
              const midY = (dot1.y + dot2.y) / 2;
              const controlX = midX + (Math.random() - 0.5) * distance * 0.5;
              const controlY = midY + (Math.random() - 0.5) * distance * 0.5;
              ctx.moveTo(dot1.x, dot1.y);
              ctx.quadraticCurveTo(controlX, controlY, dot2.x, dot2.y);
              break;

            case 'wavy':
              const steps = 10;
              const stepX = dx / steps;
              const stepY = dy / steps;
              ctx.moveTo(dot1.x, dot1.y);
              for (let k = 1; k <= steps; k++) {
                const waveX = stepX * k + (Math.random() - 0.5) * distance * 0.2;
                const waveY = stepY * k + (Math.random() - 0.5) * distance * 0.2;
                ctx.lineTo(dot1.x + waveX, dot1.y + waveY);
              }
              break;
          }

          ctx.stroke();
        }
      }
    }
  }

  // Draw dots
  dots.forEach(dot => {
    ctx.beginPath();
    ctx.fillStyle = settings.colored ? `hsl(${dot.brightness * 360}, 70%, 50%)` : `rgba(0, 0, 0, ${dot.brightness})`;

    switch (settings.shape) {
      case 'circle':
        ctx.arc(dot.x, dot.y, dot.size / 2, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.rect(dot.x - dot.size / 2, dot.y - dot.size / 2, dot.size, dot.size);
        break;
      case 'diamond':
        ctx.moveTo(dot.x, dot.y - dot.size / 2);
        ctx.lineTo(dot.x + dot.size / 2, dot.y);
        ctx.lineTo(dot.x, dot.y + dot.size / 2);
        ctx.lineTo(dot.x - dot.size / 2, dot.y);
        break;
    }

    ctx.fill();
  });
}; 