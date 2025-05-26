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
        settings.centerX ?? 0.5, 
        settings.centerY ?? 0.5,
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
        settings.centerX ?? 0.5, 
        settings.centerY ?? 0.5,
        settings.variant || 'classic',
        settings.posterizeLevels || 4,
        settings.grayscaleLevels || 2
      );
      break;
    case 'random':
      applyRandomBlockPixelation(
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