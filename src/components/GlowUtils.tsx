import { GlowSettings } from '../types';

// Apply glow effect to the canvas
export function applyGlow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: GlowSettings
): void {
  if (!settings.enabled) return;

  // Create a temporary canvas for the glow layer
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = width;
  glowCanvas.height = height;
  const glowCtx = glowCanvas.getContext('2d');
  if (!glowCtx) return;

  // Draw the original image to the glow canvas
  glowCtx.drawImage(ctx.canvas, 0, 0);

  // Get the image data
  const imageData = glowCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert glow color to RGB
  const glowColor = hexToRgb(settings.color);
  if (!glowColor) return;

  // First pass: Create glow source based on brightness with soft falloff
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate brightness with weighted RGB values
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    
    // Soft falloff based on brightness
    // This creates a smooth transition instead of a hard threshold
    const glowFactor = Math.pow(brightness / 255, 2) * (settings.intensity / 50);
    
    // Apply glow color with soft falloff
    data[i] = glowColor.r * glowFactor;
    data[i + 1] = glowColor.g * glowFactor;
    data[i + 2] = glowColor.b * glowFactor;
    data[i + 3] = 255; // Full opacity for the glow layer
  }
  glowCtx.putImageData(imageData, 0, 0);

  // Apply multiple blur passes for better glow quality
  if (settings.softness > 0) {
    // Scale the base blur radius to support larger values
    const baseBlurRadius = settings.softness * 5; // Increased multiplier for larger glow
    const numPasses = Math.min(4, Math.ceil(settings.softness / 20)); // More passes for larger softness
    
    for (let pass = 0; pass < numPasses; pass++) {
      // Increase blur radius for each pass with larger increments
      const blurRadius = baseBlurRadius * (1 + pass * 0.75);
      const kernelSize = Math.ceil(blurRadius * 2) * 2 + 1;
      const kernel = createGaussianKernel(kernelSize, blurRadius / 2);
      
      const tempData = new Uint8ClampedArray(data);
      
      // Apply horizontal blur
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, a = 0;
          let weightSum = 0;

          for (let i = 0; i < kernelSize; i++) {
            const offsetX = x + i - Math.floor(kernelSize / 2);
            if (offsetX < 0 || offsetX >= width) continue;

            const idx = (y * width + offsetX) * 4;
            const weight = kernel[i];
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
            a += data[idx + 3] * weight;
            weightSum += weight;
          }

          const idx = (y * width + x) * 4;
          tempData[idx] = r / weightSum;
          tempData[idx + 1] = g / weightSum;
          tempData[idx + 2] = b / weightSum;
          tempData[idx + 3] = a / weightSum;
        }
      }

      // Apply vertical blur
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let r = 0, g = 0, b = 0, a = 0;
          let weightSum = 0;

          for (let i = 0; i < kernelSize; i++) {
            const offsetY = y + i - Math.floor(kernelSize / 2);
            if (offsetY < 0 || offsetY >= height) continue;

            const idx = (offsetY * width + x) * 4;
            const weight = kernel[i];
            r += tempData[idx] * weight;
            g += tempData[idx + 1] * weight;
            b += tempData[idx + 2] * weight;
            a += tempData[idx + 3] * weight;
            weightSum += weight;
          }

          const idx = (y * width + x) * 4;
          data[idx] = r / weightSum;
          data[idx + 1] = g / weightSum;
          data[idx + 2] = b / weightSum;
          data[idx + 3] = a / weightSum;
        }
      }
    }
  }

  // Apply glow strength multiplier
  const glowStrength = settings.intensity / 50; // Convert to a multiplier (1-10 range)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * glowStrength);
    data[i + 1] = Math.min(255, data[i + 1] * glowStrength);
    data[i + 2] = Math.min(255, data[i + 2] * glowStrength);
  }
  glowCtx.putImageData(imageData, 0, 0);

  // Get the original image data
  const originalData = ctx.getImageData(0, 0, width, height);
  const originalPixels = originalData.data;

  // Get the glow image data
  const glowData = glowCtx.getImageData(0, 0, width, height).data;

  // Apply screen blend mode to combine the layers
  for (let i = 0; i < originalPixels.length; i += 4) {
    // Screen blend mode: 1 - (1 - a) * (1 - b)
    // This preserves the original image while adding the glow
    originalPixels[i] = 255 - ((255 - originalPixels[i]) * (255 - glowData[i])) / 255;
    originalPixels[i + 1] = 255 - ((255 - originalPixels[i + 1]) * (255 - glowData[i + 1])) / 255;
    originalPixels[i + 2] = 255 - ((255 - originalPixels[i + 2]) * (255 - glowData[i + 2])) / 255;
  }

  // Put the final result back
  ctx.putImageData(originalData, 0, 0);
}

// Helper function to create Gaussian kernel
function createGaussianKernel(size: number, sigma: number): number[] {
  const kernel: number[] = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - center;
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel[i] = value;
    sum += value;
  }

  // Normalize the kernel
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
} 