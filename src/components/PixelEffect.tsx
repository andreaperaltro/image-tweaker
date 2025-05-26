import React from 'react';

export type PixelMode =
  | 'grid'
  | 'radial'
  | 'offgrid'
  | 'voronoi'
  | 'rings'
  | 'random';

export type PixelVariant = 'classic' | 'posterized' | 'grayscale';

export interface PixelEffectSettings {
  enabled: boolean;
  mode: PixelMode;
  variant: PixelVariant;
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
  posterizeLevels?: number; // Number of color levels for posterization (2-8)
  grayscaleLevels?: number; // Number of grayscale levels (2-256)
}

// Levels effect settings
export interface LevelsEffectSettings {
  enabled: boolean;
  black: number; // 0-255
  gamma: number; // 0.1-5
  white: number; // 0-255
}

// Helper functions for different pixelation modes
function applyGridPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  cellSize: number,
  variant: PixelVariant,
  posterizeLevels: number,
  grayscaleLevels: number
) {
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let j = y; j < Math.min(y + cellSize, height); j++) {
        for (let i = x; i < Math.min(x + cellSize, width); i++) {
          const idx = (j * width + i) * 4;
          rSum += srcData.data[idx];
          gSum += srcData.data[idx + 1];
          bSum += srcData.data[idx + 2];
          aSum += srcData.data[idx + 3];
          count++;
        }
      }
      let r = Math.round(rSum / count);
      let g = Math.round(gSum / count);
      let b = Math.round(bSum / count);
      let a = Math.round(aSum / count);
      // Color variant logic
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      for (let j = y; j < Math.min(y + cellSize, height); j++) {
        for (let i = x; i < Math.min(x + cellSize, width); i++) {
          const idx = (j * width + i) * 4;
          dstData.data[idx] = r;
          dstData.data[idx + 1] = g;
          dstData.data[idx + 2] = b;
          dstData.data[idx + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

function applyRadialPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  rings: number,
  segments: number,
  centerX: number,
  centerY: number,
  variant: PixelVariant,
  posterizeLevels: number,
  grayscaleLevels: number
) {
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  const cx = centerX * width;
  const cy = centerY * height;
  const maxRadius = Math.sqrt(Math.max(cx, width - cx) ** 2 + Math.max(cy, height - cy) ** 2);
  const ringStep = maxRadius / rings;
  const angleStep = (2 * Math.PI) / segments;
  // Accumulators
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
  // Compute average color for each sector
  const avgR = new Uint8ClampedArray(sectorCount);
  const avgG = new Uint8ClampedArray(sectorCount);
  const avgB = new Uint8ClampedArray(sectorCount);
  const avgA = new Uint8ClampedArray(sectorCount);
  for (let i = 0; i < sectorCount; i++) {
    if (count[i] > 0) {
      let r = Math.round(rSum[i] / count[i]);
      let g = Math.round(gSum[i] / count[i]);
      let b = Math.round(bSum[i] / count[i]);
      let a = Math.round(aSum[i] / count[i]);
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      avgR[i] = r;
      avgG[i] = g;
      avgB[i] = b;
      avgA[i] = a;
    } else {
      avgR[i] = avgG[i] = avgB[i] = avgA[i] = 0;
    }
  }
  // Second pass: assign color
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

function applyOffGridPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  size: number,
  orientation: 'horizontal' | 'vertical',
  variant: PixelVariant,
  posterizeLevels: number,
  grayscaleLevels: number
) {
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  if (orientation === 'horizontal') {
    for (let y = 0; y < height; y += size) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let j = y; j < Math.min(y + size, height); j++) {
        for (let i = 0; i < width; i++) {
          const idx = (j * width + i) * 4;
          rSum += srcData.data[idx];
          gSum += srcData.data[idx + 1];
          bSum += srcData.data[idx + 2];
          aSum += srcData.data[idx + 3];
          count++;
        }
      }
      let r = Math.round(rSum / count);
      let g = Math.round(gSum / count);
      let b = Math.round(bSum / count);
      let a = Math.round(aSum / count);
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      for (let j = y; j < Math.min(y + size, height); j++) {
        for (let i = 0; i < width; i++) {
          const idx = (j * width + i) * 4;
          dstData.data[idx] = r;
          dstData.data[idx + 1] = g;
          dstData.data[idx + 2] = b;
          dstData.data[idx + 3] = a;
        }
      }
    }
  } else {
    for (let x = 0; x < width; x += size) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let i = x; i < Math.min(x + size, width); i++) {
        for (let j = 0; j < height; j++) {
          const idx = (j * width + i) * 4;
          rSum += srcData.data[idx];
          gSum += srcData.data[idx + 1];
          bSum += srcData.data[idx + 2];
          aSum += srcData.data[idx + 3];
          count++;
        }
      }
      let r = Math.round(rSum / count);
      let g = Math.round(gSum / count);
      let b = Math.round(bSum / count);
      let a = Math.round(aSum / count);
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      for (let i = x; i < Math.min(x + size, width); i++) {
        for (let j = 0; j < height; j++) {
          const idx = (j * width + i) * 4;
          dstData.data[idx] = r;
          dstData.data[idx + 1] = g;
          dstData.data[idx + 2] = b;
          dstData.data[idx + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

function applyVoronoiPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  seeds: number,
  jitter: number,
  variant: PixelVariant,
  posterizeLevels: number,
  grayscaleLevels: number
) {
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  // Generate random seed points
  const points = [];
  for (let i = 0; i < seeds; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height
    });
  }
  // Assign each pixel to the nearest seed
  const regionMap = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < seeds; i++) {
        const dx = x - points[i].x;
        const dy = y - points[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      regionMap[y * width + x] = minIdx;
    }
  }
  // Accumulate colors for each region
  const rSum = new Uint32Array(seeds);
  const gSum = new Uint32Array(seeds);
  const bSum = new Uint32Array(seeds);
  const aSum = new Uint32Array(seeds);
  const count = new Uint32Array(seeds);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const region = regionMap[y * width + x];
      rSum[region] += srcData.data[idx];
      gSum[region] += srcData.data[idx + 1];
      bSum[region] += srcData.data[idx + 2];
      aSum[region] += srcData.data[idx + 3];
      count[region]++;
    }
  }
  // Compute average color for each region
  const avgR = new Uint8ClampedArray(seeds);
  const avgG = new Uint8ClampedArray(seeds);
  const avgB = new Uint8ClampedArray(seeds);
  const avgA = new Uint8ClampedArray(seeds);
  for (let i = 0; i < seeds; i++) {
    if (count[i] > 0) {
      let r = Math.round(rSum[i] / count[i]);
      let g = Math.round(gSum[i] / count[i]);
      let b = Math.round(bSum[i] / count[i]);
      let a = Math.round(aSum[i] / count[i]);
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      avgR[i] = r;
      avgG[i] = g;
      avgB[i] = b;
      avgA[i] = a;
    } else {
      avgR[i] = avgG[i] = avgB[i] = avgA[i] = 0;
    }
  }
  // Assign color to each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const region = regionMap[y * width + x];
      dstData.data[idx] = avgR[region];
      dstData.data[idx + 1] = avgG[region];
      dstData.data[idx + 2] = avgB[region];
      dstData.data[idx + 3] = avgA[region];
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

function applyRingsPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  ringCount: number,
  variant: PixelVariant,
  posterizeLevels: number,
  grayscaleLevels: number
) {
  // This is a simplified version: treat as concentric rings from center
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  const ringStep = maxRadius / ringCount;
  // Accumulators
  const rSum = new Uint32Array(ringCount);
  const gSum = new Uint32Array(ringCount);
  const bSum = new Uint32Array(ringCount);
  const aSum = new Uint32Array(ringCount);
  const count = new Uint32Array(ringCount);
  // First pass: accumulate
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const ringIdx = Math.min(Math.floor(radius / ringStep), ringCount - 1);
      const idx = (y * width + x) * 4;
      rSum[ringIdx] += srcData.data[idx];
      gSum[ringIdx] += srcData.data[idx + 1];
      bSum[ringIdx] += srcData.data[idx + 2];
      aSum[ringIdx] += srcData.data[idx + 3];
      count[ringIdx]++;
    }
  }
  // Compute average color for each ring
  const avgR = new Uint8ClampedArray(ringCount);
  const avgG = new Uint8ClampedArray(ringCount);
  const avgB = new Uint8ClampedArray(ringCount);
  const avgA = new Uint8ClampedArray(ringCount);
  for (let i = 0; i < ringCount; i++) {
    if (count[i] > 0) {
      let r = Math.round(rSum[i] / count[i]);
      let g = Math.round(gSum[i] / count[i]);
      let b = Math.round(bSum[i] / count[i]);
      let a = Math.round(aSum[i] / count[i]);
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      avgR[i] = r;
      avgG[i] = g;
      avgB[i] = b;
      avgA[i] = a;
    } else {
      avgR[i] = avgG[i] = avgB[i] = avgA[i] = 0;
    }
  }
  // Second pass: assign color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const ringIdx = Math.min(Math.floor(radius / ringStep), ringCount - 1);
      const idx = (y * width + x) * 4;
      dstData.data[idx] = avgR[ringIdx];
      dstData.data[idx + 1] = avgG[ringIdx];
      dstData.data[idx + 2] = avgB[ringIdx];
      dstData.data[idx + 3] = avgA[ringIdx];
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

function applyRandomPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  minBlockSize: number,
  maxBlockSize: number,
  variant: PixelVariant,
  posterizeLevels: number,
  grayscaleLevels: number
) {
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);
  for (let y = 0; y < height; ) {
    for (let x = 0; x < width; ) {
      const blockSize = Math.floor(Math.random() * (maxBlockSize - minBlockSize + 1)) + minBlockSize;
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
      for (let j = y; j < Math.min(y + blockSize, height); j++) {
        for (let i = x; i < Math.min(x + blockSize, width); i++) {
          const idx = (j * width + i) * 4;
          rSum += srcData.data[idx];
          gSum += srcData.data[idx + 1];
          bSum += srcData.data[idx + 2];
          aSum += srcData.data[idx + 3];
          count++;
        }
      }
      let r = Math.round(rSum / count);
      let g = Math.round(gSum / count);
      let b = Math.round(bSum / count);
      let a = Math.round(aSum / count);
      if (variant === 'posterized') {
        const levels = Math.max(2, Math.min(8, posterizeLevels));
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      } else if (variant === 'grayscale') {
        const levels = Math.max(2, Math.min(256, grayscaleLevels));
        const grayStep = 255 / (levels - 1);
        const brightness = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        const gray = Math.round(Math.round(brightness / grayStep) * grayStep);
        r = g = b = gray;
      }
      for (let j = y; j < Math.min(y + blockSize, height); j++) {
        for (let i = x; i < Math.min(x + blockSize, width); i++) {
          const idx = (j * width + i) * 4;
          dstData.data[idx] = r;
          dstData.data[idx + 1] = g;
          dstData.data[idx + 2] = b;
          dstData.data[idx + 3] = a;
        }
      }
      x += blockSize;
    }
    y += Math.floor(Math.random() * (maxBlockSize - minBlockSize + 1)) + minBlockSize;
  }
  ctx.putImageData(dstData, 0, 0);
}

// Main effect function
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
      applyGridPixelation(
        ctx, 
        sourceCanvas, 
        width, 
        height, 
        settings.cellSize || 16,
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
    case 'radial':
      applyRadialPixelation(
        ctx, 
        sourceCanvas, 
        width, 
        height, 
        settings.rings || 24, 
        settings.segments || 48, 
        settings.centerX || 0.5, 
        settings.centerY || 0.5,
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
    case 'offgrid':
      applyOffGridPixelation(
        ctx, 
        sourceCanvas, 
        width, 
        height, 
        settings.offGridSize || 16,
        settings.offGridOrientation || 'horizontal',
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
    case 'voronoi':
      applyVoronoiPixelation(
        ctx, 
        sourceCanvas, 
        width, 
        height, 
        settings.voronoiSeeds || 32,
        settings.voronoiJitter || 0.2,
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
    case 'rings':
      applyRingsPixelation(
        ctx, 
        sourceCanvas, 
        width, 
        height, 
        settings.ringCount || 24,
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
    case 'random':
      applyRandomPixelation(
        ctx, 
        sourceCanvas, 
        width, 
        height, 
        settings.minBlockSize || 8,
        settings.maxBlockSize || 32,
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
  }
} 