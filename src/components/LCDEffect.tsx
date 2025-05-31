import { useEffect, useRef } from 'react';
import { EffectSettings } from '@/types';

interface LCDEffectSettings extends EffectSettings {
  cellWidth: number;
  cellHeight: number;
  intensity: number;
  pattern?: string;
  padding?: number;
}

export function applyLCDEffect(
  canvas: HTMLCanvasElement,
  settings: LCDEffectSettings
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { cellWidth, cellHeight, intensity, pattern = 'LCD', padding = 2 } = settings;
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create a temporary canvas for the processed image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // Clear the temporary canvas
  tempCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Fill background with black to simulate the black mask
  tempCtx.fillStyle = 'black';
  tempCtx.fillRect(0, 0, canvas.width, canvas.height);

  // Clamp padding to a reasonable range
  const maxPadding = Math.floor(Math.min(cellWidth, cellHeight) / 2 - 1);
  const safePadding = Math.max(0, Math.min(padding, maxPadding));

  if (pattern === 'TV CRT' || pattern === 'LCD') {
    // Stripes: rounded rectangles with gaps
    const gapX = safePadding;
    const gapY = safePadding;
    const minStripeWidth = 1;
    const minStripeHeight = 1;
    const stripeWidth = Math.max(minStripeWidth, (cellWidth - 2 * gapX) / 3);
    const stripeHeight = Math.max(minStripeHeight, cellHeight - 2 * gapY);
    for (let y = 0; y < canvas.height; y += cellHeight) {
      for (let x = 0; x < canvas.width; x += cellWidth) {
        // Calculate average color for the cell
        let r = 0, g = 0, b = 0, count = 0;
        for (let cy = 0; cy < cellHeight && y + cy < canvas.height; cy++) {
          for (let cx = 0; cx < cellWidth && x + cx < canvas.width; cx++) {
            const idx = ((y + cy) * canvas.width + (x + cx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          const drawStripe = (color: string, sx: number) => {
            tempCtx.save();
            tempCtx.beginPath();
            const radius = Math.max(1, stripeWidth * 0.45);
            tempCtx.moveTo(x + sx + radius, y + gapY);
            tempCtx.lineTo(x + sx + stripeWidth - radius, y + gapY);
            tempCtx.quadraticCurveTo(x + sx + stripeWidth, y + gapY, x + sx + stripeWidth, y + gapY + radius);
            tempCtx.lineTo(x + sx + stripeWidth, y + gapY + stripeHeight - radius);
            tempCtx.quadraticCurveTo(x + sx + stripeWidth, y + gapY + stripeHeight, x + sx + stripeWidth - radius, y + gapY + stripeHeight);
            tempCtx.lineTo(x + sx + radius, y + gapY + stripeHeight);
            tempCtx.quadraticCurveTo(x + sx, y + gapY + stripeHeight, x + sx, y + gapY + stripeHeight - radius);
            tempCtx.lineTo(x + sx, y + gapY + radius);
            tempCtx.quadraticCurveTo(x + sx, y + gapY, x + sx + radius, y + gapY);
            tempCtx.closePath();
            tempCtx.fillStyle = color;
            tempCtx.globalAlpha = intensity;
            tempCtx.fill();
            tempCtx.globalAlpha = 1.0;
            tempCtx.restore();
          };
          if (pattern === 'TV CRT') {
            drawStripe(`rgb(${r},0,0)`, gapX);
            drawStripe(`rgb(0,${g},0)`, gapX + stripeWidth);
            drawStripe(`rgb(0,0,${b})`, gapX + stripeWidth * 2);
          } else {
            drawStripe(`rgb(0,0,${b})`, gapX);
            drawStripe(`rgb(0,${g},0)`, gapX + stripeWidth);
            drawStripe(`rgb(${r},0,0)`, gapX + stripeWidth * 2);
          }
        }
      }
    }
  } else if (pattern === 'PC CRT' || pattern === 'XO-1 LCD') {
    // Dots: round, with gaps and offset for XO-1 LCD
    const gap = safePadding;
    const minDotRadius = 1;
    const dotRadius = Math.max(minDotRadius, (Math.min(cellWidth, cellHeight) - 2 * gap) / 6);
    const offset = pattern === 'XO-1 LCD';
    for (let y = 0; y < canvas.height; y += cellHeight) {
      for (let x = 0; x < canvas.width; x += cellWidth) {
        // Calculate average color for the cell
        let r = 0, g = 0, b = 0, count = 0;
        for (let cy = 0; cy < cellHeight && y + cy < canvas.height; cy++) {
          for (let cx = 0; cx < cellWidth && x + cx < canvas.width; cx++) {
            const idx = ((y + cy) * canvas.width + (x + cx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          const rowOffset = offset && Math.floor((y / cellHeight)) % 2 === 1 ? cellWidth / 3 : 0;
          // Red dot
          tempCtx.beginPath();
          tempCtx.arc(x + gap + dotRadius + rowOffset, y + cellHeight / 2, dotRadius, 0, 2 * Math.PI);
          tempCtx.fillStyle = `rgb(${r},0,0)`;
          tempCtx.globalAlpha = intensity;
          tempCtx.fill();
          tempCtx.globalAlpha = 1.0;
          // Green dot
          tempCtx.beginPath();
          tempCtx.arc(x + cellWidth / 2 + rowOffset, y + cellHeight / 2, dotRadius, 0, 2 * Math.PI);
          tempCtx.fillStyle = `rgb(0,${g},0)`;
          tempCtx.globalAlpha = intensity;
          tempCtx.fill();
          tempCtx.globalAlpha = 1.0;
          // Blue dot
          tempCtx.beginPath();
          tempCtx.arc(x + cellWidth - gap - dotRadius + rowOffset, y + cellHeight / 2, dotRadius, 0, 2 * Math.PI);
          tempCtx.fillStyle = `rgb(0,0,${b})`;
          tempCtx.globalAlpha = intensity;
          tempCtx.fill();
          tempCtx.globalAlpha = 1.0;
        }
      }
    }
  }
  // Draw the processed image back to the original canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
}

export default function LCDEffect({ settings, onChange }: { 
  settings: LCDEffectSettings;
  onChange: (settings: LCDEffectSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cell Width</label>
        <input
          type="range"
          min="1"
          max="20"
          value={settings.cellWidth}
          onChange={(e) => onChange({ ...settings, cellWidth: Number(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-500">{settings.cellWidth}px</span>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Cell Height</label>
        <input
          type="range"
          min="1"
          max="20"
          value={settings.cellHeight}
          onChange={(e) => onChange({ ...settings, cellHeight: Number(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-500">{settings.cellHeight}px</span>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Intensity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.intensity}
          onChange={(e) => onChange({ ...settings, intensity: Number(e.target.value) })}
          className="w-full"
        />
        <span className="text-sm text-gray-500">{settings.intensity}</span>
      </div>
    </div>
  );
} 