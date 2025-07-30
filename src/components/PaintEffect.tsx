import React from 'react';

export interface PaintEffectSettings {
  enabled: boolean;
  brushSize: number; // Size of the brush in pixels
  brushColor: string; // Color of the paint brush
  brushOpacity: number; // Opacity of the brush (0-100)
  brushHardness: number; // Hardness of the brush (0-100, affects edge softness)
  blendMode: GlobalCompositeOperation; // How the paint blends with the image
  paintData: PaintStroke[]; // Array of paint strokes
}

export interface PaintStroke {
  id: string;
  points: PaintPoint[];
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  brushHardness: number;
  blendMode: GlobalCompositeOperation;
}

export interface PaintPoint {
  x: number; // Relative position (0-1)
  y: number; // Relative position (0-1)
  pressure?: number; // Optional pressure sensitivity
}

// Default paint settings
export const defaultPaintSettings: PaintEffectSettings = {
  enabled: true,
  brushSize: 20,
  brushColor: '#ff0000',
  brushOpacity: 80,
  brushHardness: 50,
  blendMode: 'source-over',
  paintData: []
};

// Function to create a brush pattern based on hardness
function createBrushPattern(size: number, hardness: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return canvas;
  
  const centerX = size;
  const centerY = size;
  
  // Create radial gradient for brush softness
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
  
  if (hardness >= 100) {
    // Hard brush - solid circle
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.99, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  } else {
    // Soft brush - gradient falloff
    const hardnessRatio = hardness / 100;
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(hardnessRatio, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  return canvas;
}

// Function to draw a single paint stroke
function drawPaintStroke(
  ctx: CanvasRenderingContext2D,
  stroke: PaintStroke,
  canvasWidth: number,
  canvasHeight: number
) {
  if (stroke.points.length === 0) return;
  
  // Create brush pattern
  const brushPattern = createBrushPattern(stroke.brushSize, stroke.brushHardness);
  
  // Set up brush properties
  ctx.save();
  ctx.globalCompositeOperation = stroke.blendMode;
  ctx.globalAlpha = stroke.brushOpacity / 100;
  
  // Convert brush color to rgba
  let r = 0, g = 0, b = 0;
  if (stroke.brushColor.startsWith('#')) {
    const hex = stroke.brushColor.slice(1);
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  }
  
  // Create a temporary canvas for the stroke
  const strokeCanvas = document.createElement('canvas');
  strokeCanvas.width = canvasWidth;
  strokeCanvas.height = canvasHeight;
  const strokeCtx = strokeCanvas.getContext('2d');
  
  if (!strokeCtx) {
    ctx.restore();
    return;
  }
  
  // Set stroke color
  strokeCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  
  if (stroke.points.length === 1) {
    // Single point - draw a dot
    const point = stroke.points[0];
    const x = point.x * canvasWidth;
    const y = point.y * canvasHeight;
    
    strokeCtx.save();
    strokeCtx.globalCompositeOperation = 'source-over';
    strokeCtx.drawImage(brushPattern, x - stroke.brushSize, y - stroke.brushSize);
    strokeCtx.globalCompositeOperation = 'source-in';
    strokeCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    strokeCtx.restore();
  } else {
    // Multiple points - draw connected line
    for (let i = 0; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      const x = point.x * canvasWidth;
      const y = point.y * canvasHeight;
      
      // Draw brush at this point
      strokeCtx.save();
      strokeCtx.globalCompositeOperation = 'source-over';
      strokeCtx.drawImage(brushPattern, x - stroke.brushSize, y - stroke.brushSize);
      strokeCtx.globalCompositeOperation = 'source-in';
      strokeCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      strokeCtx.restore();
      
      // If not the first point, draw line to previous point
      if (i > 0) {
        const prevPoint = stroke.points[i - 1];
        const prevX = prevPoint.x * canvasWidth;
        const prevY = prevPoint.y * canvasHeight;
        
        // Calculate distance and steps for smooth line
        const dx = x - prevX;
        const dy = y - prevY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(distance / (stroke.brushSize * 0.3)));
        
        for (let step = 1; step < steps; step++) {
          const t = step / steps;
          const interpX = prevX + dx * t;
          const interpY = prevY + dy * t;
          
          strokeCtx.save();
          strokeCtx.globalCompositeOperation = 'source-over';
          strokeCtx.drawImage(brushPattern, interpX - stroke.brushSize, interpY - stroke.brushSize);
          strokeCtx.globalCompositeOperation = 'source-in';
          strokeCtx.fillRect(0, 0, canvasWidth, canvasHeight);
          strokeCtx.restore();
        }
      }
    }
  }
  
  // Draw the stroke onto the main canvas
  ctx.drawImage(strokeCanvas, 0, 0);
  ctx.restore();
}

// Main function to apply paint effect
export function applyPaintEffect(
  ctx: CanvasRenderingContext2D,
  targetCanvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  settings: PaintEffectSettings
) {
  if (!settings.enabled || !settings.paintData || settings.paintData.length === 0) {
    return;
  }
  
  // Draw all paint strokes
  for (const stroke of settings.paintData) {
    drawPaintStroke(ctx, stroke, canvasWidth, canvasHeight);
  }
}

// Utility function to add a new paint stroke
export function addPaintStroke(
  settings: PaintEffectSettings,
  points: PaintPoint[]
): PaintEffectSettings {
  const newStroke: PaintStroke = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    points,
    brushSize: settings.brushSize,
    brushColor: settings.brushColor,
    brushOpacity: settings.brushOpacity,
    brushHardness: settings.brushHardness,
    blendMode: settings.blendMode
  };
  
  return {
    ...settings,
    paintData: [...settings.paintData, newStroke]
  };
}

// Utility function to clear all paint strokes
export function clearPaintStrokes(settings: PaintEffectSettings): PaintEffectSettings {
  return {
    ...settings,
    paintData: []
  };
}

// Utility function to undo last paint stroke
export function undoLastPaintStroke(settings: PaintEffectSettings): PaintEffectSettings {
  if (settings.paintData.length === 0) return settings;
  
  return {
    ...settings,
    paintData: settings.paintData.slice(0, -1)
  };
}