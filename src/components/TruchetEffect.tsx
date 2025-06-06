import { useCallback } from 'react';

export type TruchetTileType = 'triangles' | 'quarter-circles' | 'diagonal';

export interface TruchetSettings {
  enabled: boolean;
  tileSize: number;  // Size of each tile in pixels
  tileTypes: TruchetTileType[];  // Which tile types to use
  colors: {
    background: string;
    foreground: string;
  };
  threshold: number;  // 0-255 brightness threshold
  patternDensity: number;  // 0-100, affects how many tiles show patterns
  lineWidth: number;  // Width of the lines in the patterns
}

// Helper function to get brightness from RGB values (0-255)
function getBrightness(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b);
}

// Draw different types of Truchet tiles
function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: TruchetTileType,
  lineWidth: number
) {
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'diagonal':
      // Draw diagonal line (randomly choose direction)
      ctx.beginPath();
      if (Math.random() < 0.5) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y + size);
      } else {
        ctx.moveTo(x + size, y);
        ctx.lineTo(x, y + size);
      }
      ctx.stroke();
      break;

    case 'quarter-circles':
      // Draw quarter circles (randomly choose configuration)
      ctx.beginPath();
      if (Math.random() < 0.5) {
        ctx.arc(x, y, size, 0, Math.PI / 2);
        ctx.arc(x + size, y + size, size, Math.PI, (3 * Math.PI) / 2);
      } else {
        ctx.arc(x + size, y, size, Math.PI / 2, Math.PI);
        ctx.arc(x, y + size, size, (3 * Math.PI) / 2, 2 * Math.PI);
      }
      ctx.stroke();
      break;

    case 'triangles':
      // Draw triangles (randomly choose configuration)
      ctx.beginPath();
      if (Math.random() < 0.5) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size / 2, y + size);
        ctx.closePath();
      } else {
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x, y + size);
        ctx.closePath();
      }
      ctx.stroke();
      break;
  }
}

export function useTruchetEffect() {
  return useCallback((canvas: HTMLCanvasElement | null, settings: TruchetSettings) => {
    if (!canvas || !settings.enabled || settings.tileTypes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const { tileSize } = settings;

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    // Clear canvas with background color
    ctx.fillStyle = settings.colors.background;
    ctx.fillRect(0, 0, width, height);

    // Set stroke style
    ctx.strokeStyle = settings.colors.foreground;

    // Calculate grid dimensions
    const rows = Math.ceil(height / tileSize);
    const cols = Math.ceil(width / tileSize);

    // Pre-calculate brightness map for better performance
    const brightnessMap = new Float32Array(rows * cols);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let totalBrightness = 0;
        let samples = 0;

        const startX = col * tileSize;
        const startY = row * tileSize;
        const endX = Math.min(startX + tileSize, width);
        const endY = Math.min(startY + tileSize, height);

        for (let py = startY; py < endY; py++) {
          for (let px = startX; px < endX; px++) {
            const i = (py * width + px) * 4;
            const brightness = getBrightness(data[i], data[i + 1], data[i + 2]);
            totalBrightness += brightness;
            samples++;
          }
        }

        brightnessMap[row * cols + col] = totalBrightness / samples;
      }
    }

    // Draw patterns based on brightness map
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        const avgBrightness = brightnessMap[row * cols + col];

        // Calculate pattern probability based on brightness and density
        const brightnessFactor = 1 - (avgBrightness / 255); // Invert brightness (0-1)
        const densityFactor = settings.patternDensity / 100; // Convert to 0-1
        const probability = Math.min(1, brightnessFactor * densityFactor * 2); // Double the effect of density

        // Draw pattern based on probability and threshold
        if (avgBrightness < settings.threshold && Math.random() < probability) {
          // Select a random tile type from the available ones
          const tileType = settings.tileTypes[Math.floor(Math.random() * settings.tileTypes.length)];
          drawTile(ctx, x, y, tileSize, tileType, settings.lineWidth);
        }
      }
    }
  }, []);
} 