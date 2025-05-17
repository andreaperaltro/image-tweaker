import { Keyframe, EasingType } from '../types/animations';
import { EffectSettings } from './EffectSettingsUtils';
import { EffectInstance } from '../types';

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Apply easing to the interpolation factor
 */
export function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'cubic-bezier':
      // Example cubic-bezier curve: ease-in-out-like curve
      return t * t * (3 - 2 * t);
    default:
      return t;
  }
}

/**
 * Find the keyframes that surround the given time
 */
export function findSurroundingKeyframes(keyframes: Keyframe[], time: number): [Keyframe | null, Keyframe | null] {
  if (keyframes.length === 0) return [null, null];
  
  // Sort keyframes by time
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
  
  let before: Keyframe | null = null;
  let after: Keyframe | null = null;
  
  // Find keyframes before and after the time
  for (let i = 0; i < sortedKeyframes.length; i++) {
    const keyframe = sortedKeyframes[i];
    
    if (keyframe.time <= time) {
      before = keyframe;
    } else {
      after = keyframe;
      break;
    }
  }
  
  return [before, after];
}

/**
 * Check if a value is a number
 */
function isNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Interpolate between two primitive values
 */
function interpolateValue(a: any, b: any, t: number): any {
  if (a === undefined || b === undefined) {
    return a !== undefined ? a : b;
  }
  
  if (isNumber(a) && isNumber(b)) {
    return lerp(a, b, t);
  }
  
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return t < 0.5 ? a : b;
  }
  
  if (typeof a === 'string' && typeof b === 'string') {
    // For colors in hex format
    if (a.startsWith('#') && b.startsWith('#') && a.length === 7 && b.length === 7) {
      const aRGB = [
        parseInt(a.slice(1, 3), 16),
        parseInt(a.slice(3, 5), 16),
        parseInt(a.slice(5, 7), 16)
      ];
      
      const bRGB = [
        parseInt(b.slice(1, 3), 16),
        parseInt(b.slice(3, 5), 16),
        parseInt(b.slice(5, 7), 16)
      ];
      
      const rLerp = Math.round(lerp(aRGB[0], bRGB[0], t));
      const gLerp = Math.round(lerp(aRGB[1], bRGB[1], t));
      const bLerp = Math.round(lerp(aRGB[2], bRGB[2], t));
      
      return `#${rLerp.toString(16).padStart(2, '0')}${gLerp.toString(16).padStart(2, '0')}${bLerp.toString(16).padStart(2, '0')}`;
    }
    
    return t < 0.5 ? a : b;
  }
  
  return t < 0.5 ? a : b;
}

/**
 * Recursively interpolate between two objects
 */
function interpolateObject(a: any, b: any, t: number): any {
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return interpolateValue(a, b, t);
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length === b.length) {
      return a.map((item, index) => interpolateObject(item, b[index], t));
    }
    return t < 0.5 ? a : b;
  }
  
  // Handle objects
  const result: any = {};
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  
  allKeys.forEach(key => {
    if (key in a && key in b) {
      result[key] = interpolateObject(a[key], b[key], t);
    } else if (key in a) {
      result[key] = a[key];
    } else if (key in b) {
      result[key] = b[key];
    }
  });
  
  return result;
}

/**
 * Get interpolated effect settings at the given time
 */
export function getSettingsAtTime(keyframes: Keyframe[], time: number): EffectSettings | null {
  if (keyframes.length === 0) return null;
  
  // If only one keyframe, return its settings
  if (keyframes.length === 1) {
    return keyframes[0].settings;
  }
  
  const [before, after] = findSurroundingKeyframes(keyframes, time);
  
  // If no keyframe before time, use the first keyframe's settings
  if (!before) {
    return keyframes[0].settings;
  }
  
  // If no keyframe after time, use the last keyframe's settings
  if (!after) {
    return before.settings;
  }
  
  // Calculate interpolation factor
  const factor = (time - before.time) / (after.time - before.time);
  
  // Apply easing
  const easedFactor = applyEasing(factor, before.easing);
  
  // Interpolate between the two settings
  return interpolateObject(before.settings, after.settings, easedFactor);
} 