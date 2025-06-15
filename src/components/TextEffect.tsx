import { TextEffectSettings } from '../types';

export const applyTextEffect = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: TextEffectSettings
) => {
  if (!settings.enabled || !settings.text) return;

  const { 
    text, 
    fontSize, 
    fontWeight, 
    lineHeight, 
    letterSpacing, 
    color, 
    x, 
    y, 
    align, 
    rotation = 0, 
    blendMode = 'source-over', 
    textStyle = 'fill',
    variableSettings = {}
  } = settings;
  
  // Save current context state
  ctx.save();
  ctx.globalCompositeOperation = blendMode;
  
  // Set text properties
  let fontFamily = settings.fontFamily || 'Arial, sans-serif';
  
  // Handle variable font settings if present
  if (Object.keys(variableSettings).length > 0) {
    const variations = Object.entries(variableSettings)
      .map(([axis, value]) => `"${axis}" ${value}`)
      .join(', ');
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}" ${variations}`;
  } else {
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  }
  
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = settings.textStyle === 'stroke' ? (settings.strokeWeight || 1) : 0;
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
  
  // Calculate the actual letter spacing in pixels based on font size
  const actualLetterSpacing = letterSpacing * fontSize;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Measure total line width with letterSpacing
    let lineWidth = 0;
    for (let c = 0; c < line.length; c++) {
      lineWidth += ctx.measureText(line[c]).width;
      if (c < line.length - 1) lineWidth += actualLetterSpacing;
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
      if (textStyle === 'fill') {
        ctx.fillText(line[c], charX, yOffset + i * fontSize * lineHeight);
      } else {
        ctx.strokeText(line[c], charX, yOffset + i * fontSize * lineHeight);
      }
      charX += ctx.measureText(line[c]).width + actualLetterSpacing;
    }
  }
  
  // Restore context state
  ctx.restore();
}; 