import React from 'react';

export type PixelMode =
  | 'grid'
  | 'radial'
  | 'offgrid'
  | 'voronoi'
  | 'rings'
  | 'random';

export interface PixelEffectSettings {
  enabled: boolean;
  mode: PixelMode;
  cellSize?: number;
  rings?: number;
  segments?: number;
  centerX?: number;
  centerY?: number;
  offGridSize?: number;
  offGridOrientation?: 'horizontal' | 'vertical';
  voronoiSeeds?: number;
  voronoiJitter?: number;
  ringCount?: number;
  minBlockSize?: number;
  maxBlockSize?: number;
}

export function applyPixelEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: PixelEffectSettings
) {
  if (!settings.enabled) return;
  switch (settings.mode) {
    case 'grid':
      applyGridPixelation(ctx, sourceCanvas, width, height, settings.cellSize || 16);
      break;
    case 'radial':
      applyRadialPixelation(ctx, sourceCanvas, width, height, settings.rings || 24, settings.segments || 48, settings.centerX ?? 0.5, settings.centerY ?? 0.5);
      break;
    case 'offgrid':
      applyOffGridPixelation(ctx, sourceCanvas, width, height, settings.offGridSize || 16, settings.offGridOrientation || 'horizontal');
      break;
    case 'voronoi':
      applyVoronoiPixelation(ctx, sourceCanvas, width, height, settings.voronoiSeeds || 32, settings.voronoiJitter || 0.2);
      break;
    case 'rings':
      applyRingsPixelation(ctx, sourceCanvas, width, height, settings.ringCount || 24, settings.centerX ?? 0.5, settings.centerY ?? 0.5);
      break;
    case 'random':
      applyRandomBlockPixelation(ctx, sourceCanvas, width, height, settings.minBlockSize || 8, settings.maxBlockSize || 32);
      break;
  }
}

// Standard grid mosaic pixelation
function applyGridPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  cellSize: number
) {
  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      // Compute average color for this cell
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= width || py >= height) continue;
          const idx = (py * width + px) * 4;
          rSum += srcData.data[idx];
          gSum += srcData.data[idx + 1];
          bSum += srcData.data[idx + 2];
          aSum += srcData.data[idx + 3];
          count++;
        }
      }
      if (count === 0) continue;
      const avgR = Math.round(rSum / count);
      const avgG = Math.round(gSum / count);
      const avgB = Math.round(bSum / count);
      const avgA = Math.round(aSum / count);
      // Fill cell with average color
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= width || py >= height) continue;
          const idx = (py * width + px) * 4;
          dstData.data[idx] = avgR;
          dstData.data[idx + 1] = avgG;
          dstData.data[idx + 2] = avgB;
          dstData.data[idx + 3] = avgA;
        }
      }
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

// Radial (polar) pixelation (optimized)
function applyRadialPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  rings: number,
  segments: number,
  centerX: number,
  centerY: number
) {
  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  const cx = centerX * width;
  const cy = centerY * height;
  const maxRadius = Math.sqrt(Math.max(cx, width - cx) ** 2 + Math.max(cy, height - cy) ** 2);
  const ringStep = maxRadius / rings;
  const angleStep = (2 * Math.PI) / segments;
  const sectorCount = rings * segments;
  const rSum = new Uint32Array(sectorCount);
  const gSum = new Uint32Array(sectorCount);
  const bSum = new Uint32Array(sectorCount);
  const aSum = new Uint32Array(sectorCount);
  const count = new Uint32Array(sectorCount);
  // First pass: accumulate
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      const ringIdx = Math.min(Math.floor(radius / ringStep), rings - 1);
      const segIdx = Math.min(Math.floor(angle / angleStep), segments - 1);
      const sectorIdx = ringIdx * segments + segIdx;
      const idx = (y * width + x) * 4;
      rSum[sectorIdx] += srcData.data[idx];
      gSum[sectorIdx] += srcData.data[idx + 1];
      bSum[sectorIdx] += srcData.data[idx + 2];
      aSum[sectorIdx] += srcData.data[idx + 3];
      count[sectorIdx]++;
    }
  }
  // Compute averages
  const avgR = new Uint8ClampedArray(sectorCount);
  const avgG = new Uint8ClampedArray(sectorCount);
  const avgB = new Uint8ClampedArray(sectorCount);
  const avgA = new Uint8ClampedArray(sectorCount);
  for (let i = 0; i < sectorCount; i++) {
    if (count[i] > 0) {
      avgR[i] = Math.round(rSum[i] / count[i]);
      avgG[i] = Math.round(gSum[i] / count[i]);
      avgB[i] = Math.round(bSum[i] / count[i]);
      avgA[i] = Math.round(aSum[i] / count[i]);
    } else {
      avgR[i] = avgG[i] = avgB[i] = avgA[i] = 0;
    }
  }
  // Second pass: assign
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      const ringIdx = Math.min(Math.floor(radius / ringStep), rings - 1);
      const segIdx = Math.min(Math.floor(angle / angleStep), segments - 1);
      const sectorIdx = ringIdx * segments + segIdx;
      const idx = (y * width + x) * 4;
      dstData.data[idx] = avgR[sectorIdx];
      dstData.data[idx + 1] = avgG[sectorIdx];
      dstData.data[idx + 2] = avgB[sectorIdx];
      dstData.data[idx + 3] = avgA[sectorIdx];
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

// Rename the current implementation to Off Grid
function applyOffGridPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  size: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  
  // Calculate hex grid parameters
  const hexWidth = size * 2;
  const hexHeight = size * Math.sqrt(3);
  const vertSpacing = hexHeight * 0.75; // Overlap for better coverage
  
  // Helper function to check if a point is inside a hexagon
  function isPointInHex(px: number, py: number, centerX: number, centerY: number, size: number): boolean {
    // Convert to hex coordinates
    const dx = Math.abs(px - centerX);
    const dy = Math.abs(py - centerY);
    
    // Hexagon boundary check using the correct geometric formula
    // For a regular hexagon, the boundary is defined by:
    // |x| ≤ size and |y| ≤ size * √3/2 and |y| ≤ size * √3 - |x| * √3/2
    return dx <= size && 
           dy <= size * Math.sqrt(3) / 2 && 
           dy <= size * Math.sqrt(3) - dx * Math.sqrt(3) / 2;
  }
  
  if (orientation === 'horizontal') {
    // Horizontal hex grid (default)
    const cols = Math.ceil(width / (hexWidth * 0.75)) + 1;
    const rows = Math.ceil(height / vertSpacing) + 1;
    for (let row = 0; row < rows; row++) {
      const y = row * vertSpacing;
      const offsetX = row % 2 ? hexWidth * 0.375 : 0;
      for (let col = 0; col < cols; col++) {
        const x = col * hexWidth * 0.75 + offsetX;
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (!isPointInHex(px, py, x, y, size)) continue;
            if (px < 0 || px >= width || py < 0 || py >= height) continue;
            const idx = (Math.floor(py) * width + Math.floor(px)) * 4;
            rSum += srcData.data[idx];
            gSum += srcData.data[idx + 1];
            bSum += srcData.data[idx + 2];
            aSum += srcData.data[idx + 3];
            count++;
          }
        }
        if (count === 0) continue;
        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);
        const avgA = Math.round(aSum / count);
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (!isPointInHex(px, py, x, y, size)) continue;
            if (px < 0 || px >= width || py < 0 || py >= height) continue;
            const idx = (Math.floor(py) * width + Math.floor(px)) * 4;
            dstData.data[idx] = avgR;
            dstData.data[idx + 1] = avgG;
            dstData.data[idx + 2] = avgB;
            dstData.data[idx + 3] = avgA;
          }
        }
      }
    }
  } else {
    // Vertical hex grid: columns are straight, offset is on y
    const rows = Math.ceil(height / (hexWidth * 0.75)) + 1;
    const cols = Math.ceil(width / vertSpacing) + 1;
    for (let col = 0; col < cols; col++) {
      const x = col * vertSpacing;
      const offsetY = col % 2 ? hexWidth * 0.375 : 0;
      for (let row = 0; row < rows; row++) {
        const y = row * hexWidth * 0.75 + offsetY;
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (!isPointInHex(px, py, x, y, size)) continue;
            if (px < 0 || px >= width || py < 0 || py >= height) continue;
            const idx = (Math.floor(py) * width + Math.floor(px)) * 4;
            rSum += srcData.data[idx];
            gSum += srcData.data[idx + 1];
            bSum += srcData.data[idx + 2];
            aSum += srcData.data[idx + 3];
            count++;
          }
        }
        if (count === 0) continue;
        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);
        const avgA = Math.round(aSum / count);
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (!isPointInHex(px, py, x, y, size)) continue;
            if (px < 0 || px >= width || py < 0 || py >= height) continue;
            const idx = (Math.floor(py) * width + Math.floor(px)) * 4;
            dstData.data[idx] = avgR;
            dstData.data[idx + 1] = avgG;
            dstData.data[idx + 2] = avgB;
            dstData.data[idx + 3] = avgA;
          }
        }
      }
    }
  }
  
  ctx.putImageData(dstData, 0, 0);
}

// Voronoi pixelation (real implementation)
function applyVoronoiPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  seeds: number,
  jitter: number
) {
  // 1. Generate random seed points
  const seedPoints: {x: number, y: number}[] = [];
  for (let i = 0; i < seeds; i++) {
    seedPoints.push({
      x: Math.random() * width * (1 - jitter) + (Math.random() * width * jitter),
      y: Math.random() * height * (1 - jitter) + (Math.random() * height * jitter)
    });
  }

  // 2. Prepare accumulators for each region
  const rSum = new Uint32Array(seeds);
  const gSum = new Uint32Array(seeds);
  const bSum = new Uint32Array(seeds);
  const aSum = new Uint32Array(seeds);
  const count = new Uint32Array(seeds);
  // 3. For each pixel, find nearest seed and accumulate color
  const srcData = ctx.getImageData(0, 0, width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < seeds; i++) {
        const dx = x - seedPoints[i].x;
        const dy = y - seedPoints[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      const idx = (y * width + x) * 4;
      rSum[minIdx] += srcData.data[idx];
      gSum[minIdx] += srcData.data[idx + 1];
      bSum[minIdx] += srcData.data[idx + 2];
      aSum[minIdx] += srcData.data[idx + 3];
      count[minIdx]++;
    }
  }
  // 4. Compute average color for each region
  const avgR = new Uint8ClampedArray(seeds);
  const avgG = new Uint8ClampedArray(seeds);
  const avgB = new Uint8ClampedArray(seeds);
  const avgA = new Uint8ClampedArray(seeds);
  for (let i = 0; i < seeds; i++) {
    if (count[i] > 0) {
      avgR[i] = Math.round(rSum[i] / count[i]);
      avgG[i] = Math.round(gSum[i] / count[i]);
      avgB[i] = Math.round(bSum[i] / count[i]);
      avgA[i] = Math.round(aSum[i] / count[i]);
    } else {
      avgR[i] = avgG[i] = avgB[i] = avgA[i] = 0;
    }
  }
  // 5. Second pass: assign average color to each pixel
  const dstData = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < seeds; i++) {
        const dx = x - seedPoints[i].x;
        const dy = y - seedPoints[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      const idx = (y * width + x) * 4;
      dstData.data[idx] = avgR[minIdx];
      dstData.data[idx + 1] = avgG[minIdx];
      dstData.data[idx + 2] = avgB[minIdx];
      dstData.data[idx + 3] = avgA[minIdx];
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

// Concentric rings pixelation (stub)
function applyRingsPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  ringCount: number,
  centerX: number,
  centerY: number
) {
  // TODO: Implement real rings pixelation
  applyRadialPixelation(ctx, sourceCanvas, width, height, ringCount, 1, centerX, centerY);
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function applyRandomBlockPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  minBlock: number,
  maxBlock: number
) {
  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);

  // Calculate average background color
  let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
  for (let i = 0; i < srcData.data.length; i += 4) {
    totalR += srcData.data[i];
    totalG += srcData.data[i + 1];
    totalB += srcData.data[i + 2];
    totalA += srcData.data[i + 3];
  }
  const pixelCount = srcData.data.length / 4;
  const avgR = Math.round(totalR / pixelCount);
  const avgG = Math.round(totalG / pixelCount);
  const avgB = Math.round(totalB / pixelCount);
  const avgA = Math.round(totalA / pixelCount);

  // Fill with average background color
  for (let i = 0; i < dstData.data.length; i += 4) {
    dstData.data[i] = avgR;
    dstData.data[i + 1] = avgG;
    dstData.data[i + 2] = avgB;
    dstData.data[i + 3] = avgA;
  }

  // Track filled pixels (1D mask)
  const filled = new Uint8Array(width * height);
  const blocks: {x: number, y: number, w: number, h: number}[] = [];

  // Build and shuffle a list of all pixel indices
  const pixelIndices: number[] = [];
  for (let i = 0; i < width * height; i++) pixelIndices.push(i);
  shuffleArray(pixelIndices);
  let pixelPointer = 0;

  // Helper function to check if a block can be placed
  function canPlaceBlock(x: number, y: number, w: number, h: number): boolean {
    if (x < 0 || y < 0 || x + w > width || y + h > height) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (filled[(y + dy) * width + (x + dx)]) return false;
      }
    }
    return true;
  }

  // Helper function to mark a block as filled
  function markBlockFilled(x: number, y: number, w: number, h: number) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        filled[(y + dy) * width + (x + dx)] = 1;
      }
    }
  }

  // Generate blocks efficiently
  while (pixelPointer < pixelIndices.length) {
    // Find the next unfilled pixel from the shuffled list
    let found = false;
    let startIdx = -1;
    while (pixelPointer < pixelIndices.length && !found) {
      const idx = pixelIndices[pixelPointer++];
      if (!filled[idx]) {
        startIdx = idx;
        found = true;
      }
    }
    if (!found) break;
    const startX = startIdx % width;
    const startY = Math.floor(startIdx / width);

    let blockPlaced = false;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts && !blockPlaced; attempt++) {
      const w = Math.floor(Math.random() * (maxBlock - minBlock + 1)) + minBlock;
      const h = Math.floor(Math.random() * (maxBlock/2 - minBlock + 1)) + minBlock;
      const offsetX = Math.floor(Math.random() * 3) - 1;
      const offsetY = Math.floor(Math.random() * 3) - 1;
      const x = startX + offsetX;
      const y = startY + offsetY;
      if (canPlaceBlock(x, y, w, h)) {
        blocks.push({ x, y, w, h });
        markBlockFilled(x, y, w, h);
        blockPlaced = true;
      }
    }
    if (!blockPlaced) {
      filled[startY * width + startX] = 1;
      // Copy the original pixel color to the output
      const idx = (startY * width + startX) * 4;
      dstData.data[idx] = srcData.data[idx];
      dstData.data[idx + 1] = srcData.data[idx + 1];
      dstData.data[idx + 2] = srcData.data[idx + 2];
      dstData.data[idx + 3] = srcData.data[idx + 3];
    }
  }

  // Color each block with the average color
  for (const block of blocks) {
    let r = 0, g = 0, b = 0, a = 0, count = 0;
    for (let dy = 0; dy < block.h; dy++) {
      for (let dx = 0; dx < block.w; dx++) {
        const px = (block.x + dx) + (block.y + dy) * width;
        r += srcData.data[px * 4 + 0];
        g += srcData.data[px * 4 + 1];
        b += srcData.data[px * 4 + 2];
        a += srcData.data[px * 4 + 3];
        count++;
      }
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    a = Math.round(a / count);
    for (let dy = 0; dy < block.h; dy++) {
      for (let dx = 0; dx < block.w; dx++) {
        const px = (block.x + dx) + (block.y + dy) * width;
        dstData.data[px * 4 + 0] = r;
        dstData.data[px * 4 + 1] = g;
        dstData.data[px * 4 + 2] = b;
        dstData.data[px * 4 + 3] = a;
      }
    }
  }

  ctx.putImageData(dstData, 0, 0);
} 