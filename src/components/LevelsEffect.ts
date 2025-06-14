/**
 * Levels Effect Utility Functions
 * 
 * This module provides functionality similar to Photoshop's Levels adjustment:
 * 1. Input Levels (black point, white point)
 * 2. Gamma adjustment
 * 3. Output Levels (black point, white point)
 */

export interface LevelsEffectSettings {
  enabled: boolean;
  // Input levels (0-255)
  inputBlack: number;
  inputWhite: number;
  // Gamma (0.1-10)
  gamma: number;
  // Output levels (0-255)
  outputBlack: number;
  outputWhite: number;
}

/**
 * Apply gamma correction to a value
 */
function applyGamma(value: number, gamma: number): number {
  return Math.pow(value, 1 / gamma);
}

/**
 * Map a value from one range to another
 */
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  // Ensure we don't divide by zero
  if (inMax === inMin) return outMin;
  
  // Calculate the input ratio (0-1)
  let ratio = (value - inMin) / (inMax - inMin);
  
  // Clamp the ratio to 0-1
  ratio = Math.max(0, Math.min(1, ratio));
  
  // Map to output range
  return outMin + ratio * (outMax - outMin);
}

/**
 * Apply levels adjustment to a single channel
 */
function adjustChannel(
  value: number,
  inputBlack: number,
  inputWhite: number,
  gamma: number,
  outputBlack: number,
  outputWhite: number
): number {
  // Normalize input to 0-1 range based on input levels
  let normalized = mapRange(value, inputBlack, inputWhite, 0, 1);
  
  // Apply gamma correction
  normalized = applyGamma(normalized, gamma);
  
  // Map to output range
  const result = mapRange(normalized, 0, 1, outputBlack, outputWhite);
  
  // Ensure result is within 0-255 range
  return Math.round(Math.max(0, Math.min(255, result)));
}

/**
 * Apply the levels effect to a canvas
 */
export function applyLevelsEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: LevelsEffectSettings
): void {
  if (!settings.enabled) return;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Apply RGB adjustments
    for (let c = 0; c < 3; c++) {
      data[i + c] = adjustChannel(
        data[i + c],
        settings.inputBlack,
        settings.inputWhite,
        settings.gamma,
        settings.outputBlack,
        settings.outputWhite
      );
    }
    // Alpha channel remains unchanged
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
} 