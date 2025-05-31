import { TextEffectSettings } from '../types';

export const applyTextEffect = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: TextEffectSettings
) => {
  if (!settings.enabled || !settings.text) return;

  const { text, fontSize, fontWeight, lineHeight, letterSpacing, color, x, y, align, rotation = 0, blendMode = 'source-over' } = settings;
  
  // Save current context state
  ctx.save();
  ctx.globalCompositeOperation = blendMode;
  
  // Set text properties
  const fontFamily = settings.fontFamily || 'Arial, sans-serif';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left'; // We'll handle alignment manually
  ctx.textBaseline = 'middle';
  
  // Calculate position
  const xPos = x * canvas.width;
  const yPos = y * canvas.height;
  
  // Multiline support
  const lines = text.split('\n');
  const totalHeight = lines.length * fontSize * lineHeight;
  let yOffset = -totalHeight / 2 + fontSize * lineHeight / 2;
  
  // Apply rotation (convert degrees to radians)
  ctx.translate(xPos, yPos);
  ctx.rotate((rotation * Math.PI) / 180);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Measure total line width with letterSpacing
    let lineWidth = 0;
    for (let c = 0; c < line.length; c++) {
      lineWidth += ctx.measureText(line[c]).width;
      if (c < line.length - 1) lineWidth += letterSpacing;
    }
    let startX;
    if (align === 'center') {
      startX = -lineWidth / 2;
    } else if (align === 'right') {
      startX = -lineWidth;
    } else {
      startX = 0;
    }
    let charX = startX;
    for (let c = 0; c < line.length; c++) {
      ctx.fillText(line[c], charX, yOffset + i * fontSize * lineHeight);
      charX += ctx.measureText(line[c]).width + letterSpacing;
    }
  }
  
  // Restore context state
  ctx.restore();
}; 