import React from 'react';
import { GiSnake } from 'react-icons/gi';

export type SnakeColorMode = 'grayscale' | 'dominant';
export type SnakeOutlineStyle = 'pixel' | 'smooth';
export type SnakeShape = 'row' | 'column';

export interface SnakeEffectSettings {
  enabled: boolean;
  gridSize: number;  // Size of each circle in the grid
  colorCount: number;  // Number of colors to use (2-30)
  cornerRadius: number;  // Radius for connected shapes (0-1, relative to cell size)
  colorMode: SnakeColorMode; // grayscale or dominant
  padding: number; // px, space between dots
  backgroundColor: string; // hex color for background
  outlineStyle: SnakeOutlineStyle; // pixel or smooth
  shape: SnakeShape; // row or column
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

type ColorGrid = Color[][];

// Helper: Convert RGB to grayscale value
function rgbToGray(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

// Helper: Quantize to N grays
function quantizeGrayscale(grid: ColorGrid, colorCount: number): ColorGrid {
  const levels = colorCount;
  const step = 255 / (levels - 1);
  return grid.map(row =>
    row.map(cell => {
      const gray = rgbToGray(cell.r, cell.g, cell.b);
      const quant = Math.round(gray / step) * step;
      return { r: quant, g: quant, b: quant, a: cell.a };
    })
  );
}

// Helper: Simple k-means for dominant colors (returns palette and quantized grid)
function quantizeKMeans(grid: ColorGrid, colorCount: number): ColorGrid {
  // Flatten grid
  const pixels: Color[] = grid.flat();
  // Initialize palette with random pixels
  let palette: Color[] = [];
  for (let i = 0; i < colorCount; i++) {
    palette.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }
  // Run a few k-means iterations
  for (let iter = 0; iter < 6; iter++) {
    // Assign pixels to nearest palette color
    const clusters: Color[][] = Array.from({ length: colorCount }, () => []);
    for (const px of pixels) {
      let minDist = Infinity, idx = 0;
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        const dist = (px.r - p.r) ** 2 + (px.g - p.g) ** 2 + (px.b - p.b) ** 2;
        if (dist < minDist) {
          minDist = dist;
          idx = i;
        }
      }
      clusters[idx].push(px);
    }
    // Update palette
    for (let i = 0; i < colorCount; i++) {
      if (clusters[i].length > 0) {
        const r = Math.round(clusters[i].reduce((s, c) => s + c.r, 0) / clusters[i].length);
        const g = Math.round(clusters[i].reduce((s, c) => s + c.g, 0) / clusters[i].length);
        const b = Math.round(clusters[i].reduce((s, c) => s + c.b, 0) / clusters[i].length);
        palette[i] = { r, g, b, a: 255 };
      }
    }
  }
  // Quantize grid
  const quantized: ColorGrid = grid.map(row =>
    row.map(cell => {
      let minDist = Infinity, idx = 0;
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        const dist = (cell.r - p.r) ** 2 + (cell.g - p.g) ** 2 + (cell.b - p.b) ** 2;
        if (dist < minDist) {
          minDist = dist;
          idx = i;
        }
      }
      const p = palette[idx];
      return { r: p.r, g: p.g, b: p.b, a: cell.a };
    })
  );
  return quantized;
}

// Helper: Find contiguous regions (snakes) of the same color
function findRegions(grid: ColorGrid): { color: Color; cells: [number, number][] }[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const regions: { color: Color; cells: [number, number][] }[] = [];
  const colorKey = (c: Color) => `${c.r},${c.g},${c.b}`;

  function dfs(r: number, c: number, color: Color, region: [number, number][]) {
    if (
      r < 0 || r >= rows || c < 0 || c >= cols ||
      visited[r][c] || colorKey(grid[r][c]) !== colorKey(color)
    ) return;
    visited[r][c] = true;
    region.push([r, c]);
    // 4-connectivity
    dfs(r + 1, c, color, region);
    dfs(r - 1, c, color, region);
    dfs(r, c + 1, color, region);
    dfs(r, c - 1, color, region);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!visited[r][c]) {
        const region: [number, number][] = [];
        dfs(r, c, grid[r][c], region);
        if (region.length > 0) regions.push({ color: grid[r][c], cells: region });
      }
    }
  }
  return regions;
}

export function applySnakeEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: SnakeEffectSettings
) {
  const { gridSize, colorCount, cornerRadius, colorMode, padding, backgroundColor, shape } = settings;
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;

  // Get source image data
  const srcData = srcCtx.getImageData(0, 0, width, height);

  // Calculate grid dimensions
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);

  // Create a 2D array to store the average color of each cell
  const grid: ColorGrid = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  // First pass: calculate average color for each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let y = row * gridSize; y < Math.min((row + 1) * gridSize, height); y++) {
        for (let x = col * gridSize; x < Math.min((col + 1) * gridSize, width); x++) {
          const idx = (y * width + x) * 4;
          rSum += srcData.data[idx];
          gSum += srcData.data[idx + 1];
          bSum += srcData.data[idx + 2];
          aSum += srcData.data[idx + 3];
          count++;
        }
      }
      grid[row][col] = {
        r: Math.round(rSum / count),
        g: Math.round(gSum / count),
        b: Math.round(bSum / count),
        a: Math.round(aSum / count)
      };
    }
  }

  // Quantize colors
  let quantizedGrid: ColorGrid;
  if (colorMode === 'grayscale') {
    quantizedGrid = quantizeGrayscale(grid, colorCount);
  } else {
    quantizedGrid = quantizeKMeans(grid, colorCount);
  }

  // Fill background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = backgroundColor || '#fff';
  ctx.fillRect(0, 0, width, height);

  const cellPad = padding / 2;
  const cellW = gridSize - padding;
  const cellH = gridSize - padding;
  
  // Use cornerRadius as a pixel value (0-20)
  const actualRadius = Math.min(cornerRadius, Math.min(cellW, cellH) / 2);

  const colorKey = (c: Color) => `${c.r},${c.g},${c.b}`;
  const colorMap = new Map<string, [number, number][]>();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = colorKey(quantizedGrid[row][col]);
      if (!colorMap.has(key)) colorMap.set(key, []);
      colorMap.get(key)!.push([row, col]);
    }
  }

  colorMap.forEach((positions, key) => {
    const [r, g, b] = key.split(',').map(Number);
    ctx.fillStyle = `rgba(${r},${g},${b},1)`;
    if (shape === 'row') {
      // Horizontal runs
      let direction = 1;
      for (let row = 0; row < rows; row++) {
        const runCols: number[] = [];
        for (let col = 0; col < cols; col++) {
          if (colorKey(quantizedGrid[row][col]) === key) runCols.push(col);
        }
        if (runCols.length === 0) continue;
        let runs: number[][] = [];
        let currentRun: number[] = [];
        for (let i = 0; i < runCols.length; i++) {
          if (i === 0 || runCols[i] === runCols[i - 1] + 1) {
            currentRun.push(runCols[i]);
          } else {
            runs.push(currentRun);
            currentRun = [runCols[i]];
          }
        }
        if (currentRun.length > 0) runs.push(currentRun);
        for (let runIdx = 0; runIdx < runs.length; runIdx++) {
          const run = runs[runIdx];
          const startCol = direction === 1 ? run[0] : run[run.length - 1];
          const endCol = direction === 1 ? run[run.length - 1] : run[0];
          const x = Math.min(startCol, endCol) * gridSize + cellPad;
          const y = row * gridSize + cellPad;
          const w = (Math.abs(endCol - startCol) + 1) * gridSize - padding;
          const h = cellH;
          ctx.beginPath();
          ctx.moveTo(x + actualRadius, y);
          ctx.lineTo(x + w - actualRadius, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + actualRadius);
          ctx.lineTo(x + w, y + h - actualRadius);
          ctx.quadraticCurveTo(x + w, y + h, x + w - actualRadius, y + h);
          ctx.lineTo(x + actualRadius, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - actualRadius);
          ctx.lineTo(x, y + actualRadius);
          ctx.quadraticCurveTo(x, y, x + actualRadius, y);
          ctx.closePath();
          ctx.fill();
        }
        direction *= -1;
      }
    } else if (shape === 'column') {
      // Vertical runs
      let direction = 1;
      for (let col = 0; col < cols; col++) {
        const runRows: number[] = [];
        for (let row = 0; row < rows; row++) {
          if (colorKey(quantizedGrid[row][col]) === key) runRows.push(row);
        }
        if (runRows.length === 0) continue;
        let runs: number[][] = [];
        let currentRun: number[] = [];
        for (let i = 0; i < runRows.length; i++) {
          if (i === 0 || runRows[i] === runRows[i - 1] + 1) {
            currentRun.push(runRows[i]);
          } else {
            runs.push(currentRun);
            currentRun = [runRows[i]];
          }
        }
        if (currentRun.length > 0) runs.push(currentRun);
        for (let runIdx = 0; runIdx < runs.length; runIdx++) {
          const run = runs[runIdx];
          const startRow = direction === 1 ? run[0] : run[run.length - 1];
          const endRow = direction === 1 ? run[run.length - 1] : run[0];
          const x = col * gridSize + cellPad;
          const y = Math.min(startRow, endRow) * gridSize + cellPad;
          const w = cellW;
          const h = (Math.abs(endRow - startRow) + 1) * gridSize - padding;
          ctx.beginPath();
          ctx.moveTo(x + actualRadius, y);
          ctx.lineTo(x + w - actualRadius, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + actualRadius);
          ctx.lineTo(x + w, y + h - actualRadius);
          ctx.quadraticCurveTo(x + w, y + h, x + w - actualRadius, y + h);
          ctx.lineTo(x + actualRadius, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - actualRadius);
          ctx.lineTo(x, y + actualRadius);
          ctx.quadraticCurveTo(x, y, x + actualRadius, y);
          ctx.closePath();
          ctx.fill();
        }
        direction *= -1;
      }
    }
  });
}

// Export the icon component
export const SnakeIcon = GiSnake; 