import { BlurSettings } from '../types';

// Helper function to create a Gaussian kernel
function createGaussianKernel(size: number, sigma: number): number[][] {
  const kernel: number[][] = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  // Create a 1D Gaussian kernel
  for (let i = 0; i < size; i++) {
    const x = i - center;
    kernel[i] = [];
    for (let j = 0; j < size; j++) {
      const y = j - center;
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      kernel[i][j] = value;
      sum += value;
    }
  }

  // Normalize the kernel
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      kernel[i][j] /= sum;
    }
  }

  return kernel;
}

// Apply Gaussian blur using separable kernel for better performance
export function applyGaussianBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number
): void {
  if (radius <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);
  const kernelSize = Math.ceil(radius * 2) * 2 + 1;
  const sigma = radius / 2;
  const kernel = createGaussianKernel(kernelSize, sigma);
  const center = Math.floor(kernelSize / 2);

  // Apply horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;

      for (let i = 0; i < kernelSize; i++) {
        const offsetX = x + i - center;
        if (offsetX < 0 || offsetX >= width) continue;

        const idx = (y * width + offsetX) * 4;
        const weight = kernel[center][i];
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
        const offsetY = y + i - center;
        if (offsetY < 0 || offsetY >= height) continue;

        const idx = (offsetY * width + x) * 4;
        const weight = kernel[i][center];
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

  ctx.putImageData(imageData, 0, 0);
}

// Main blur processing function
export function applyBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BlurSettings
): void {
  if (!settings.enabled) return;
  applyGaussianBlur(ctx, width, height, settings.radius || 0);
} 