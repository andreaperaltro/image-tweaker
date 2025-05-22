import React from 'react';

export interface PolarPixelSettings {
  enabled: boolean;
  rings: number; // Number of concentric circles
  segments: number; // Number of angular segments per ring
  centerX: number; // Center X (0-1, relative to width)
  centerY: number; // Center Y (0-1, relative to height)
}

/**
 * Apply the polar pixel effect to a canvas (optimized version)
 */
export function applyPolarPixelEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: PolarPixelSettings
): void {
  if (!settings.enabled) return;

  // Get image data from the source canvas
  const srcData = ctx.getImageData(0, 0, width, height);
  const dstData = ctx.createImageData(width, height);

  // Center in pixels
  const cx = settings.centerX * width;
  const cy = settings.centerY * height;
  const maxRadius = Math.sqrt(Math.max(cx, width - cx) ** 2 + Math.max(cy, height - cy) ** 2);

  // Precompute ring and segment sizes
  const ringStep = maxRadius / settings.rings;
  const angleStep = (2 * Math.PI) / settings.segments;

  // Prepare accumulators for each sector
  const sectorCount = settings.rings * settings.segments;
  const rSum = new Uint32Array(sectorCount);
  const gSum = new Uint32Array(sectorCount);
  const bSum = new Uint32Array(sectorCount);
  const aSum = new Uint32Array(sectorCount);
  const count = new Uint32Array(sectorCount);

  // First pass: accumulate sums and counts for each sector
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      const ringIdx = Math.min(Math.floor(radius / ringStep), settings.rings - 1);
      const segIdx = Math.min(Math.floor(angle / angleStep), settings.segments - 1);
      const sectorIdx = ringIdx * settings.segments + segIdx;
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
      avgR[i] = Math.round(rSum[i] / count[i]);
      avgG[i] = Math.round(gSum[i] / count[i]);
      avgB[i] = Math.round(bSum[i] / count[i]);
      avgA[i] = Math.round(aSum[i] / count[i]);
    } else {
      avgR[i] = avgG[i] = avgB[i] = avgA[i] = 0;
    }
  }

  // Second pass: assign average color to each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      const ringIdx = Math.min(Math.floor(radius / ringStep), settings.rings - 1);
      const segIdx = Math.min(Math.floor(angle / angleStep), settings.segments - 1);
      const sectorIdx = ringIdx * settings.segments + segIdx;
      const idx = (y * width + x) * 4;
      dstData.data[idx] = avgR[sectorIdx];
      dstData.data[idx + 1] = avgG[sectorIdx];
      dstData.data[idx + 2] = avgB[sectorIdx];
      dstData.data[idx + 3] = avgA[sectorIdx];
    }
  }

  ctx.putImageData(dstData, 0, 0);
} 