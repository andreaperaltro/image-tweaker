import { TextEffectSettings } from '../types';

export const applyTextEffect = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: TextEffectSettings
) => {
  if (!settings.enabled || !settings.text) return;

  const { text, fontSize, fontWeight, lineHeight, letterSpacing, color, x, y, align } = settings;
  
  // Save current context state
  ctx.save();
  
  // Set text properties
  ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  
  // Calculate position
  const xPos = x * canvas.width;
  const yPos = y * canvas.height;
  
  // Draw text
  ctx.fillText(text, xPos, yPos);
  
  // Restore context state
  ctx.restore();
}; 