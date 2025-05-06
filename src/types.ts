// Common types used across components

// Effect settings types
export type ColorAdjustmentSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  invert: boolean;
};

export type GradientMapSettings = {
  enabled: boolean;
  opacity: number;
  blendMode: string;
  darkColor: string;
  midColor: string;
  lightColor: string;
};

export type GlitchSettings = {
  enabled: boolean;
  intensity: number;
  density: number;
  direction: 'horizontal' | 'vertical' | 'both';
  glitchSize: number;
};

export type HalftoneSettings = {
  enabled: boolean;
  cellSize: number;
  mix: number;
  colored: boolean;
  enableCMYK: boolean;
  arrangement: 'grid' | 'spiral' | 'concentric';
  shape: 'circle' | 'square' | 'diamond' | 'line' | 'cross' | 'ellipse' | 'triangle' | 'hexagon';
  angleOffset: number;
  sizeVariation: number;
  dotScaleFactor: number;
  invertBrightness: boolean;
  spiralTightness: number;
  spiralExpansion: number;
  spiralRotation: number;
  spiralCenterX: number;
  spiralCenterY: number;
  concentricCenterX: number;
  concentricCenterY: number;
  concentricRingSpacing: number;
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

export type GridSettings = {
  enabled: boolean;
  columns: number;
  rows: number;
  applyRotation: boolean;
  maxRotation: number;
  splitEnabled: boolean;
  splitProbability: number;
  maxSplitLevels: number;
  minCellSize: number;
};

export type DitherSettings = {
  enabled: boolean;
  type: 'ordered' | 'floydSteinberg' | 'atkinson';
  threshold: number;
  colorMode: 'grayscale' | 'color' | 'twoColor';
  resolution: number;
  colorDepth: number;
  darkColor: string;
  lightColor: string;
};

export type TextDitherSettings = {
  enabled: boolean;
  text: string;
  fontSize: number;
  fontFamily: string;
  colorMode: 'monochrome' | 'colored';
  contrast: number;
  brightness: number;
  invert: boolean;
  resolution: number;
};

export interface BlurSettings {
  enabled: boolean;
  type: 'gaussian' | 'radial' | 'motion' | 'tiltshift';
  radius: number;
  centerX?: number;
  centerY?: number;
  angle?: number;
  focusPosition?: number;
  focusWidth?: number;
  gradient?: number;
}

export interface EffectInstance {
  id: string;
  type: string;
  enabled: boolean;
}

import { ShiftPattern } from './components/MosaicShift';
import { SliceShiftSettings } from './components/SliceShift';

export type MosaicShiftSettings = {
  enabled: boolean;
  columns: number;
  rows: number;
  maxOffsetX: number;
  maxOffsetY: number;
  pattern: ShiftPattern;
  intensity: number;
  seed: number;
  preserveEdges: boolean;
  randomRotation: boolean;
  maxRotation: number;
}; 