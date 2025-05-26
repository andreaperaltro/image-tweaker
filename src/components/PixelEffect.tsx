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