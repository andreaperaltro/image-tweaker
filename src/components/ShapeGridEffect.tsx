import { useCallback } from 'react';

export interface ShapeGridSettings {
  enabled: boolean;
  gridSize: number;  // Size of each grid cell in pixels
  threshold: number; // Brightness threshold (0-255)
  colors: {
    background: string;
    foreground: string;
  };
  shapes: ShapeType[];  // Array of shapes to use
  mergeLevels: number; // Controls the maximum shape size (0-5)
  randomRotation: boolean; // Whether to randomly rotate shapes
}

export type ShapeType = 'circle' | 'square' | 'triangle' | 'cross' | 'heart';

// Helper function to get brightness from RGB values (0-255)
function getBrightness(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b);
}

// Helper function to draw different shapes with rotation
function drawShape(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  size: number, 
  type: ShapeType,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-(x + size/2), -(y + size/2));

  switch (type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'square':
      ctx.fillRect(x, y, size, size);
      break;
      
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x + size/2, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y + size);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'cross':
      const thickness = size/3;
      ctx.fillRect(x + (size-thickness)/2, y, thickness, size);
      ctx.fillRect(x, y + (size-thickness)/2, size, thickness);
      break;
      
    case 'heart':
      // Draw heart using VscHeartFilled SVG path
      const heartSize = size * 0.8; // Slightly smaller to match other shapes
      const heartX = x + (size - heartSize) / 2;
      const heartY = y + (size - heartSize) / 2;
      
      ctx.beginPath();
      // VscHeartFilled path
      const path = new Path2D('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
      
      // Scale the path to our size (original SVG is 24x24)
      const scale = heartSize / 24;
      ctx.translate(heartX, heartY);
      ctx.scale(scale, scale);
      ctx.fill(path);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      break;
  }

  ctx.restore();
}

// Helper function to get average brightness for a region
function getRegionBrightness(
  brightnessGrid: number[][],
  startRow: number,
  startCol: number,
  size: number,
  rows: number,
  cols: number
): number {
  let total = 0;
  let count = 0;

  for (let i = 0; i < size && startRow + i < rows; i++) {
    for (let j = 0; j < size && startCol + j < cols; j++) {
      total += brightnessGrid[startRow + i][startCol + j];
      count++;
    }
  }

  return total / count;
}

// Helper function to mark region as processed
function markRegionProcessed(
  processedGrid: boolean[][],
  startRow: number,
  startCol: number,
  size: number,
  rows: number,
  cols: number
) {
  for (let i = 0; i < size && startRow + i < rows; i++) {
    for (let j = 0; j < size && startCol + j < cols; j++) {
      processedGrid[startRow + i][startCol + j] = true;
    }
  }
}

export function applyShapeGridEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: ShapeGridSettings
) {
  if (!settings.enabled) return;

  // Create temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;

  // Draw source image to temp canvas
  tempCtx.drawImage(sourceCanvas, 0, 0);

  // Get image data
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Clear the main canvas
  ctx.fillStyle = settings.colors.background;
  ctx.fillRect(0, 0, width, height);

  // Set foreground color for shapes
  ctx.fillStyle = settings.colors.foreground;

  // Calculate base grid size
  const baseSize = Math.max(1, settings.gridSize);
  const cols = Math.ceil(width / baseSize);
  const rows = Math.ceil(height / baseSize);

  // Create brightness grid
  const brightnessGrid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
  
  // Calculate brightness for each base cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let totalBrightness = 0;
      let samples = 0;

      const x = col * baseSize;
      const y = row * baseSize;

      // Sample pixels in this cell
      for (let py = y; py < Math.min(y + baseSize, height); py++) {
        for (let px = x; px < Math.min(x + baseSize, width); px++) {
          const i = (py * width + px) * 4;
          const brightness = getBrightness(data[i], data[i + 1], data[i + 2]);
          totalBrightness += brightness;
          samples++;
        }
      }

      brightnessGrid[row][col] = totalBrightness / samples;
    }
  }

  // Create processed grid
  const processedGrid: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));

  // Calculate maximum shape size based on mergeLevels
  const maxShapeSize = Math.pow(2, settings.mergeLevels);

  // Process grid with decreasing shape sizes
  for (let shapeSize = maxShapeSize; shapeSize >= 1; shapeSize /= 2) {
    const currentCellSize = baseSize * shapeSize;
    const brightnessThreshold = settings.threshold + (shapeSize - 1) * 20; // Increase threshold for larger shapes

    for (let row = 0; row < rows; row += shapeSize) {
      for (let col = 0; col < cols; col += shapeSize) {
        // Skip if any cell in this region has been processed
        if (processedGrid[row][col]) continue;

        // Get average brightness for this region
        const avgBrightness = getRegionBrightness(brightnessGrid, row, col, shapeSize, rows, cols);

        // Draw shape if brightness is high enough
        if (avgBrightness > brightnessThreshold) {
          // Select shape based on brightness
          const shapeIndex = Math.floor((avgBrightness / 255) * settings.shapes.length);
          const shape = settings.shapes[Math.min(shapeIndex, settings.shapes.length - 1)];
          
          // Calculate rotation if enabled
          const rotation = settings.randomRotation ? Math.floor(Math.random() * 4) * 90 : 0;
          
          // Draw the shape
          drawShape(
            ctx,
            col * baseSize,
            row * baseSize,
            currentCellSize,
            shape,
            rotation
          );

          // Mark region as processed
          markRegionProcessed(processedGrid, row, col, shapeSize, rows, cols);
        }
      }
    }
  }
} 