/**
 * Halftone Rendering Utility Functions
 * 
 * This module provides functionality for:
 * 1. Creating halftone patterns with different arrangements
 * 2. Supporting multiple dot shapes (circle, hexagon, ellipse, etc.)
 * 3. Controlling cell size, mix, and color settings
 */

export type HalftoneArrangement = 'grid' | 'hexagonal' | 'spiral' | 'concentric' | 'random';
export type HalftoneShape = 'circle' | 'square' | 'diamond' | 'line' | 'cross' | 'ellipse' | 'triangle' | 'hexagon';

export type HalftoneSettings = {
  enabled: boolean;
  cellSize: number;
  mix: number;
  colored: boolean;
  arrangement: HalftoneArrangement;
  shape: HalftoneShape;
  angleOffset: number;
  sizeVariation: number;
  dotScaleFactor: number;
  invertBrightness: boolean;
  channels: {
    cyan: boolean;
    magenta: boolean;
    yellow: boolean;
    black: boolean;
  };
  cmykAngles: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
  };
};

/**
 * Apply halftone effect to a canvas
 */
export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: HalftoneSettings
): void {
  if (!settings.enabled) return;
  
  // Get source context
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;
  
  // Get image data from source
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Clear the destination canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set a background color (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Cell size should be at least 1
  const cellSize = Math.max(1, settings.cellSize);
  
  // Calculate number of cells
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  
  // CMYK halftone if channels are enabled
  if (settings.channels.cyan || settings.channels.magenta || 
      settings.channels.yellow || settings.channels.black) {
    applyCMYKHalftone(ctx, pixels, width, height, cols, rows, cellSize, settings);
    
    // Apply the original image with reduced opacity for mixing if mix < 100
    if (settings.mix < 100) {
      ctx.globalAlpha = 1 - (settings.mix / 100);
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }
    
    return;
  }
  
  // Draw standard halftone pattern (RGB or grayscale)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Cell position
      let centerX = x * cellSize + cellSize / 2;
      let centerY = y * cellSize + cellSize / 2;
      
      // Adjust position based on arrangement
      if (settings.arrangement === 'hexagonal' && y % 2 === 0) {
        centerX += cellSize / 2;
      } else if (settings.arrangement === 'spiral') {
        const angle = Math.atan2(centerY - height / 2, centerX - width / 2);
        const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2));
        const offset = distance / 20;
        centerX += Math.cos(angle) * offset;
        centerY += Math.sin(angle) * offset;
      } else if (settings.arrangement === 'concentric') {
        const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2));
        const rings = Math.floor(distance / cellSize);
        if (rings % 2 === 0) {
          centerX += cellSize / 4;
          centerY += cellSize / 4;
        }
      } else if (settings.arrangement === 'random') {
        centerX += (Math.random() - 0.5) * cellSize / 2;
        centerY += (Math.random() - 0.5) * cellSize / 2;
      }
      
      // Get the pixel at this position (clamped to image boundaries)
      const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
      const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
      const pixelIndex = (pixelY * width + pixelX) * 4;
      
      // Calculate dot size based on pixel brightness
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      
      // Calculate brightness (0 to 1) - Perceived luminance approach
      let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Invert brightness if needed
      if (settings.invertBrightness) {
        brightness = 1 - brightness;
      }
      
      // Apply size variation
      const sizeVariation = 1 + (Math.random() - 0.5) * settings.sizeVariation;
      
      // Calculate max dot size
      const maxDotSize = cellSize * settings.dotScaleFactor * sizeVariation;
      
      // Calculate actual dot size
      const dotSize = maxDotSize * brightness;
      
      // Skip drawing dots that are too small (optimization)
      if (dotSize < 0.5) continue;
      
      // Set the color based on settings
      if (settings.colored) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      } else {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
      }
      
      // Draw the dot with the selected shape
      drawHalftoneShape(
        ctx, 
        centerX, 
        centerY, 
        dotSize, 
        settings.shape, 
        settings.angleOffset
      );
    }
  }
  
  // Apply the original image with reduced opacity for mixing
  if (settings.mix < 100) {
    ctx.globalAlpha = 1 - (settings.mix / 100);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }
}

/**
 * Apply CMYK halftone effect
 */
function applyCMYKHalftone(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  cols: number,
  rows: number,
  cellSize: number,
  settings: HalftoneSettings
): void {
  // Convert RGB to CMYK function
  const rgbToCmyk = (r: number, g: number, b: number) => {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
    
    return { c, m, y, k };
  };
  
  // Process each CMYK channel
  if (settings.channels.cyan) {
    ctx.fillStyle = 'cyan';
    processChannel('c', settings.cmykAngles.cyan);
  }
  
  if (settings.channels.magenta) {
    ctx.fillStyle = 'magenta';
    processChannel('m', settings.cmykAngles.magenta);
  }
  
  if (settings.channels.yellow) {
    ctx.fillStyle = 'yellow';
    processChannel('y', settings.cmykAngles.yellow);
  }
  
  if (settings.channels.black) {
    ctx.fillStyle = 'black';
    processChannel('k', settings.cmykAngles.black);
  }
  
  // Helper function to process each channel
  function processChannel(channel: 'c' | 'm' | 'y' | 'k', angle: number) {
    // Create a separate layer for channel blending
    ctx.globalCompositeOperation = 'multiply';
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Cell position
        let centerX = x * cellSize + cellSize / 2;
        let centerY = y * cellSize + cellSize / 2;
        
        // Adjust position based on arrangement
        if (settings.arrangement === 'hexagonal' && y % 2 === 0) {
          centerX += cellSize / 2;
        } else if (settings.arrangement === 'spiral') {
          const angle = Math.atan2(centerY - height / 2, centerX - width / 2);
          const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2));
          const offset = distance / 20;
          centerX += Math.cos(angle) * offset;
          centerY += Math.sin(angle) * offset;
        } else if (settings.arrangement === 'concentric') {
          const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2));
          const rings = Math.floor(distance / cellSize);
          if (rings % 2 === 0) {
            centerX += cellSize / 4;
            centerY += cellSize / 4;
          }
        } else if (settings.arrangement === 'random') {
          centerX += (Math.random() - 0.5) * cellSize / 2;
          centerY += (Math.random() - 0.5) * cellSize / 2;
        }
        
        // Get the pixel at this position
        const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
        const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
        const pixelIndex = (pixelY * width + pixelX) * 4;
        
        // Get RGB values
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        
        // Convert to CMYK
        const cmyk = rgbToCmyk(r, g, b);
        
        // Get the value for this channel
        let value = cmyk[channel];
        
        // Invert if needed (CMYK is subtractive)
        if (!settings.invertBrightness) {
          value = 1 - value;
        }
        
        // Apply size variation
        const sizeVariation = 1 + (Math.random() - 0.5) * settings.sizeVariation;
        
        // Calculate max dot size
        const maxDotSize = cellSize * settings.dotScaleFactor * sizeVariation;
        
        // Calculate actual dot size
        const dotSize = maxDotSize * value;
        
        // Skip drawing dots that are too small
        if (dotSize < 0.5) continue;
        
        // Draw the dot with the selected shape and angle
        drawHalftoneShape(
          ctx, 
          centerX, 
          centerY, 
          dotSize, 
          settings.shape, 
          angle + settings.angleOffset
        );
      }
    }
    
    // Reset composite operation after each channel
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Draw a halftone shape
 */
function drawHalftoneShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: HalftoneShape,
  angle: number
): void {
  // Save context state
  ctx.save();
  
  // Apply rotation if needed
  if (angle !== 0) {
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-x, -y);
  }
  
  // Begin path
  ctx.beginPath();
  
  // Draw the selected shape
  switch (shape) {
    case 'square':
      ctx.rect(x - size / 2, y - size / 2, size, size);
      ctx.fill();
      break;
      
    case 'line':
      ctx.lineWidth = size / 2;
      ctx.moveTo(x - size / 2, y);
      ctx.lineTo(x + size / 2, y);
      ctx.stroke();
      break;
      
    case 'cross':
      ctx.lineWidth = size / 4;
      ctx.moveTo(x - size / 2, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.moveTo(x - size / 2, y + size / 2);
      ctx.lineTo(x + size / 2, y - size / 2);
      ctx.stroke();
      break;
      
    case 'diamond':
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y);
      ctx.lineTo(x, y + size / 2);
      ctx.lineTo(x - size / 2, y);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'ellipse':
      ctx.ellipse(x, y, size / 2, size / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'triangle':
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'hexagon':
      const hexSize = size / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const xPos = x + hexSize * Math.cos(angle);
        const yPos = y + hexSize * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'circle':
    default:
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Restore context state
  ctx.restore();
}

/**
 * Generate a preview of all available halftone shapes
 */
export function generateHalftoneShapesPreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Available shapes to preview
  const shapes: HalftoneShape[] = [
    'circle', 'square', 'diamond', 'line', 'cross', 'ellipse', 'triangle', 'hexagon'
  ];
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Calculate grid layout
  const cols = 4;
  const rows = Math.ceil(shapes.length / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  // Font settings
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  // Draw each shape
  for (let i = 0; i < shapes.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;
    
    // Draw shape
    ctx.fillStyle = '#000000';
    drawHalftoneShape(ctx, x, y, Math.min(cellWidth, cellHeight) * 0.6, shapes[i], 0);
    
    // Draw label
    ctx.fillText(shapes[i], x, y + cellHeight / 2 - 10);
  }
} 