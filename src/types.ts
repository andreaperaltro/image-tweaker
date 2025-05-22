// Common types used across components
import type { DitherSettings } from './components/DitherUtils';
import type { HalftoneSettings } from './components/Halftone';
import type { ColorSettings } from './components/ColorUtils';
import type { ThresholdSettings } from './components/ThresholdUtils';
import type { GlitchSettings } from './components/GlitchUtils';
import type { TextDitherSettings } from './components/TextDitherUtils';
import type { GradientMapSettings } from './components/GradientMapUtils';
import type { GridSettings } from './components/Grid';
import type { ShiftPattern } from './components/MosaicShift';
import type { SliceShiftSettings } from './components/SliceShift';
import type { PosterizeSettings } from './components/Posterize';
import type { FindEdgesSettings } from './components/FindEdges';
import type { BlobSettings } from './components/Blob';
import type { PixelEffectSettings } from './components/PixelEffect';

// Re-export all imported types
export type {
  DitherSettings,
  HalftoneSettings,
  ColorSettings,
  ThresholdSettings,
  GlitchSettings,
  TextDitherSettings,
  GradientMapSettings,
  GridSettings,
  ShiftPattern,
  SliceShiftSettings,
  PosterizeSettings,
  FindEdgesSettings,
  BlobSettings,
  PixelEffectSettings
};

// Effect settings types
export type ColorAdjustmentSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  invert: boolean;
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
  backgroundColor: string;
  useBackgroundColor: boolean;
};

export interface EffectSettings {
  ditherSettings: DitherSettings;
  halftoneSettings: HalftoneSettings;
  colorSettings: ColorSettings;
  thresholdSettings: ThresholdSettings;
  glitchSettings: GlitchSettings;
  textDitherSettings: TextDitherSettings;
  gradientMapSettings: GradientMapSettings;
  gridSettings: GridSettings;
  effectInstances: EffectInstance[];
  blur: BlurSettings;
  mosaicShiftSettings: MosaicShiftSettings;
  sliceShiftSettings: SliceShiftSettings;
  posterizeSettings: PosterizeSettings;
  findEdgesSettings: FindEdgesSettings;
  blobSettings: BlobSettings;
  pixelSettings: PixelEffectSettings;
  linocutSettings?: LinocutEffectSettings;
  instanceSettings?: {[id: string]: any};
}

export interface GlowSettings {
  enabled: boolean;
  color: string;
  intensity: number;
  threshold: number;
  softness: number;
  blendMode: 'add' | 'normal';
}

export interface LinocutEffectSettings {
  enabled: boolean;
  lineSpacing: number; // Distance between lines
  strokeWidth: number; // Maximum line thickness
  noiseScale: number; // organic distortion
  centerX: number; // 0-1, relative
  centerY: number; // 0-1, relative
  invert?: boolean; // optional, for white-on-black
  orientation?: 'horizontal' | 'vertical'; // optional
  threshold?: number; // 0-1, for line visibility
  minLine?: number; // minimum line thickness
}

export type EffectType = 
  | 'color' 
  | 'blur' 
  | 'gradient' 
  | 'threshold' 
  | 'dither' 
  | 'halftone' 
  | 'textDither' 
  | 'glitch' 
  | 'grid' 
  | 'glow'
  | 'mosaicShift'
  | 'sliceShift'
  | 'posterize'
  | 'findEdges'
  | 'blob'
  | 'pixel'
  | 'noise'
  | 'linocut';

export interface NoiseEffectSettings {
  enabled: boolean;
  type: 'perlin';
  intensity: number; // 0-1
  scale: number; // 0.01-500
  seed: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
  monochrome?: boolean; // If true, use grayscale noise for all channels
  channel?: 'all' | 'r' | 'g' | 'b'; // Which channel(s) to apply noise to
} 