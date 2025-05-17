import { BlurSettings } from '../types';

// Helper function to create a Gaussian kernel
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
        const offsetY = y + i - center;
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

  ctx.putImageData(imageData, 0, 0);
}

// Apply radial blur
function applyRadialBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  centerX: number,
  centerY: number
): void {
  if (radius <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  // Convert percentage coordinates to pixel coordinates
  const centerXPixels = (centerX / 100) * width;
  const centerYPixels = (centerY / 100) * height;

  // Create a temporary canvas for intermediate results
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Draw the original image
  tempCtx.putImageData(imageData, 0, 0);

  // Apply radial blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerXPixels;
      const dy = y - centerYPixels;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;

      const samples = Math.ceil(radius * 2);
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const sampleDistance = distance + (t - 0.5) * radius;
        const sampleX = centerXPixels + sampleDistance * Math.cos(angle);
        const sampleY = centerYPixels + sampleDistance * Math.sin(angle);
        
        if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
        
        const idx = (Math.floor(sampleY) * width + Math.floor(sampleX)) * 4;
        const weight = 1 - Math.abs(t - 0.5) * 2;
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
        weightSum += weight;
      }

      const idx = (y * width + x) * 4;
      if (weightSum > 0) {
        tempData[idx] = r / weightSum;
        tempData[idx + 1] = g / weightSum;
        tempData[idx + 2] = b / weightSum;
        tempData[idx + 3] = a / weightSum;
      } else {
        // If no samples were taken, use the original pixel
        tempData[idx] = data[idx];
        tempData[idx + 1] = data[idx + 1];
        tempData[idx + 2] = data[idx + 2];
        tempData[idx + 3] = data[idx + 3];
      }
    }
  }

  ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
}

// Apply motion blur
function applyMotionBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  angle: number
): void {
  if (radius <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  // Convert angle from degrees to radians
  const angleRad = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;

      const samples = Math.ceil(radius * 2);
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const offset = (t - 0.5) * radius;
        const sampleX = x + offset * cos;
        const sampleY = y + offset * sin;
        
        if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
        
        const idx = (Math.floor(sampleY) * width + Math.floor(sampleX)) * 4;
        const weight = 1 - Math.abs(t - 0.5) * 2;
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
        weightSum += weight;
      }

      const idx = (y * width + x) * 4;
      if (weightSum > 0) {
        tempData[idx] = r / weightSum;
        tempData[idx + 1] = g / weightSum;
        tempData[idx + 2] = b / weightSum;
        tempData[idx + 3] = a / weightSum;
      } else {
        // If no samples were taken, use the original pixel
        tempData[idx] = data[idx];
        tempData[idx + 1] = data[idx + 1];
        tempData[idx + 2] = data[idx + 2];
        tempData[idx + 3] = data[idx + 3];
      }
    }
  }

  ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
}

// Apply tilt-shift blur
function applyTiltShiftBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  focusPosition: number,
  focusWidth: number,
  gradient: number,
  angle: number
): void {
  if (radius <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  // Convert percentage coordinates to pixel coordinates
  const focusPointXPixels = (focusPosition / 100) * width;
  const focusPointYPixels = 50 / 100 * height; // Fixed at center (50%)
  const focusWidthPixels = (focusWidth / 100) * Math.max(width, height);
  const gradientPixels = Math.max(1, (gradient / 100) * Math.max(width, height));

  // Convert angle from degrees to radians
  const angleRad = (angle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate distance from focus line
      const dx = x - focusPointXPixels;
      const dy = y - focusPointYPixels;
      
      // Project point onto the line perpendicular to the blur direction
      const distanceFromFocus = Math.abs(dx * cos + dy * sin);
      
      let blurAmount = 0;
      if (distanceFromFocus > focusWidthPixels/2) {
        blurAmount = Math.min(1, (distanceFromFocus - focusWidthPixels/2) / gradientPixels);
      }

      const currentRadius = Math.floor(radius * blurAmount);

      if (currentRadius <= 0) {
        // Copy the original pixel data for the focused area
        const idx = (y * width + x) * 4;
        tempData[idx] = data[idx];
        tempData[idx + 1] = data[idx + 1];
        tempData[idx + 2] = data[idx + 2];
        tempData[idx + 3] = data[idx + 3];
        continue;
      }

      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;

      // Sample along the blur direction
      const samples = Math.ceil(currentRadius * 2);
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        const offset = (t - 0.5) * currentRadius;
        const sampleX = x + offset * sin; // Use sin for perpendicular direction
        const sampleY = y - offset * cos; // Use cos for perpendicular direction
        
        if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
        
        const idx = (Math.floor(sampleY) * width + Math.floor(sampleX)) * 4;
        const weight = 1 - Math.abs(t - 0.5) * 2;
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
        weightSum += weight;
      }

      const idx = (y * width + x) * 4;
      if (weightSum > 0) {
        tempData[idx] = r / weightSum;
        tempData[idx + 1] = g / weightSum;
        tempData[idx + 2] = b / weightSum;
        tempData[idx + 3] = a / weightSum;
      } else {
        tempData[idx] = data[idx];
        tempData[idx + 1] = data[idx + 1];
        tempData[idx + 2] = data[idx + 2];
        tempData[idx + 3] = data[idx + 3];
      }
    }
  }

  ctx.putImageData(new ImageData(tempData, width, height), 0, 0);
}

// Main blur processing function
export function applyBlur(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BlurSettings
): void {
  if (!settings.enabled) return;

  switch (settings.type) {
    case 'gaussian':
      applyGaussianBlur(ctx, width, height, settings.radius);
      break;
    case 'radial':
      applyRadialBlur(
        ctx,
        width,
        height,
        settings.radius,
        settings.centerX || 50,
        settings.centerY || 50
      );
      break;
    case 'motion':
      applyMotionBlur(
        ctx,
        width,
        height,
        settings.radius,
        settings.angle || 0
      );
      break;
    case 'tiltshift':
      applyTiltShiftBlur(
        ctx,
        width,
        height,
        settings.radius,
        settings.focusPosition || 50,
        settings.focusWidth || 25,
        settings.gradient || 12.5,
        settings.angle || 0
      );
      break;
  }
} 