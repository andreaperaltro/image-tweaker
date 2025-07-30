// Common types used across components
import type { DitherSettings } from './components/DitherUtils';
import type { HalftoneSettings } from './components/Halftone';
import type { ColorSettings } from './components/ColorUtils';
import type { ThresholdSettings } from './components/ThresholdUtils';
import type { GlitchSettings } from './components/GlitchUtils';
import type { GradientMapSettings } from './components/GradientMapUtils';
import type { GridSettings } from './components/Grid';
import type { ShiftPattern } from './components/MosaicShift';
import type { SliceShiftSettings } from './components/SliceShift';
import type { PosterizeSettings } from './components/Posterize';
import type { FindEdgesSettings } from './components/FindEdges';
import type { BlobSettings } from './components/Blob';
import type { PixelEffectSettings } from './components/PixelEffect';
import type { PaintEffectSettings } from './components/PaintEffect';

// Re-export all imported types
export type {
  DitherSettings,
  HalftoneSettings,
  ColorSettings,
  ThresholdSettings,
  GlitchSettings,
  GradientMapSettings,
  GridSettings,
  ShiftPattern,
  SliceShiftSettings,
  PosterizeSettings,
  FindEdgesSettings,
  BlobSettings,
  PixelEffectSettings,
  PaintEffectSettings
};

// Effect settings types
export type ColorAdjustmentSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  invert: boolean;
};

// Add 'spin' to BlurType
type BlurType = 'gaussian' | 'box' | 'radial' | 'motion' | 'tiltshift' | 'spin';

export interface BlurSettings {
  enabled: boolean;
  type: BlurType;
  radius: number;
  angle?: number;
  centerX?: number;
  centerY?: number;
  centerRadius?: number;
  centerGradient?: number;
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

export interface BaseEffectSettings {
  enabled: boolean;
}

export interface DistortSettings {
  enabled: boolean;
  xAmount: number;  // -500 to 500
  yAmount: number;  // -500 to 500
  displacementMap: string | null;  // Base64 string of the image or null
  preserveAspectRatio: boolean;  // Whether to preserve aspect ratio or stretch
  scale: number;  // Scale factor for the displacement map (0.1 to 5.0)
  smoothness: number;  // Controls how smooth the distortion appears (0 to 100)
  offsetX: number;  // X position offset (-100 to 100)
  offsetY: number;  // Y position offset (-100 to 100)
  displacementMapUpdatedAt?: number;
}

export interface Effects {
  distort: DistortSettings;
  [key: string]: BaseEffectSettings;  // Allow other effects with at least the base settings
}

export interface EffectSettings {
  ditherSettings: DitherSettings;
  halftoneSettings: HalftoneSettings;
  colorSettings: ColorSettings;
  thresholdSettings: ThresholdSettings;
  glitchSettings: GlitchSettings;
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
  lcdSettings?: LCDEffectSettings;
  instanceSettings?: {[id: string]: any};
  distortSettings: DistortSettings;
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

export interface AsciiEffectSettings {
  enabled: boolean;
  cellSize: number;
  fontSize: number;
  charset: string;
  backgroundColor?: string;
  monochrome?: boolean;
  jitter?: number;
  preset?: string;
  textColor?: string;
  rotationMax?: number;
  rotationMode?: 'none' | 'random' | 'flow';
}

export interface TextEffectSettings {
  enabled: boolean;
  text: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  x: number; // 0-1, relative position
  y: number; // 0-1, relative position
  align: 'left' | 'center' | 'right';
  fontFamily?: string;
  rotation?: number; // degrees
  blendMode?: GlobalCompositeOperation; // e.g. 'normal', 'multiply', etc.
  textStyle?: 'fill' | 'stroke'; // new property for fill/stroke selection
  strokeWeight?: number; // stroke width in pixels
  variableSettings?: { [key: string]: number }; // Variable font axis settings
  customFontUrl?: string; // URL for custom uploaded font
}

export type EffectType =
  | 'color'
  | 'halftone'
  | 'dither'
  | 'threshold'
  | 'glitch'
  | 'gradient-map'
  | 'grid'
  | 'blur'
  | 'mosaic-shift'
  | 'slice-shift'
  | 'posterize'
  | 'find-edges'
  | 'blob'
  | 'polar-pixel'
  | 'pixel'
  | 'noise'
  | 'linocut'
  | 'levels'
  | 'ascii'
  | 'text'
  | 'lcd'
  | 'snake'
  | 'threeD'
  | 'distort'
  | 'paint';

export interface NoiseEffectSettings {
  enabled: boolean;
  type: 'perlin';
  intensity: number; // 0-1
  scale: number; // 0.01-500
  seed: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
  monochrome?: boolean; // If true, use grayscale noise for all channels
  channel?: 'all' | 'r' | 'g' | 'b'; // Which channel(s) to apply noise to
  octaves?: number; // Number of octaves for fBm
  persistence?: number; // Persistence for fBm
  amount?: number; // Amount of noise to apply (0-1)
  density?: number; // Density of noise (0-1)
}

export interface LCDEffectSettings {
  enabled: boolean;
  cellWidth: number;
  cellHeight: number;
  intensity: number;
  pattern?: 'TV CRT' | 'PC CRT' | 'XO-1 LCD' | 'LCD';
  padding?: number;
}

export interface ThreeDEffectSettings {
  enabled: boolean;
  rotationX: number; // -180 to 180 degrees
  rotationY: number; // -180 to 180 degrees
  rotationZ: number; // -180 to 180 degrees
  scale: number; // 0.1 to 2
  backgroundColor: string; // hex color code
  perspective: number; // 0 to 100, controls field of view
  distance: number; // 100 to 1000, controls camera distance
} 