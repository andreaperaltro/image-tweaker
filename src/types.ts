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
}

export enum EffectType {
  color = 'color',
  gradient = 'gradient',
  threshold = 'threshold',
  halftone = 'halftone',
  grid = 'grid',
  dither = 'dither',
  glitch = 'glitch',
  blur = 'blur',
  mosaicShift = 'mosaicShift',
  sliceShift = 'sliceShift',
  posterize = 'posterize',
  findEdges = 'findEdges',
  blob = 'blob',
  glow = 'glow',
  polarPixel = 'polarPixel',
  pixel = 'pixel',
  noise = 'noise',
  linocut = 'linocut',
  levels = 'levels',
  ascii = 'ascii',
  text = 'text',
  lcd = 'lcd',
}

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

export interface LCDEffectSettings {
  enabled: boolean;
  cellWidth: number;
  cellHeight: number;
  intensity: number;
  pattern?: 'TV CRT' | 'PC CRT' | 'XO-1 LCD' | 'LCD';
  padding?: number;
}

// Remove the duplicate EffectSettings type at the end of the file 