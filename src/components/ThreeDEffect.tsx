import { ThreeDEffectSettings } from '../types';

export function applyThreeDEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: ThreeDEffectSettings
) {
  if (!settings.enabled) return;

  const { rotationX, rotationY, rotationZ, scale, backgroundColor } = settings;

  // Create a temporary canvas for the transformation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return;

  // Clear the temporary canvas and fill with background color
  tempCtx.fillStyle = backgroundColor || '#000000';
  tempCtx.fillRect(0, 0, width, height);

  // Save the current context state
  tempCtx.save();

  // Move to center
  tempCtx.translate(width / 2, height / 2);
  
  // Apply rotation in the correct order: Z -> Y -> X
  tempCtx.rotate((rotationZ * Math.PI) / 180);
  tempCtx.scale(Math.cos((rotationY * Math.PI) / 180), 1);
  tempCtx.scale(1, Math.cos((rotationX * Math.PI) / 180));

  // Apply overall scale
  tempCtx.scale(scale, scale);

  // Draw the source image centered
  tempCtx.drawImage(sourceCanvas, -width / 2, -height / 2);

  // Restore the context state
  tempCtx.restore();

  // Copy the result back to the main canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
}

// Helper function to multiply two 4x4 matrices
function multiplyMatrices(a: number[], b: number[]): number[] {
  const result = new Array(16).fill(0);
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
      }
    }
  }
  
  return result;
} 