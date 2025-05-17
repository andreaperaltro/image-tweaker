/**
 * Find Edges Effect Utility Functions
 * 
 * This module provides functionality for:
 * 1. Detecting edges in an image using various algorithms
 * 2. Creating stylized edge effects
 */

export type EdgeDetectionAlgorithm = 'sobel' | 'prewitt' | 'canny' | 'laplacian';

export interface FindEdgesSettings {
  enabled: boolean;
  algorithm: EdgeDetectionAlgorithm;
  intensity: number;     // Edge detection intensity (0-100)
  threshold: number;     // Edge threshold (0-255)
  invert: boolean;       // Whether to invert the result
  colorMode: 'grayscale' | 'color' | 'inverted'; // Output color mode
  blurRadius: number;    // Pre-blur radius for noise reduction
}

/**
 * Apply the find edges effect to a canvas
 */
export function applyFindEdges(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: FindEdgesSettings
): void {
  if (!settings.enabled) return;

  // Create temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;

  // Draw source image to temp canvas
  tempCtx.drawImage(sourceCanvas, 0, 0);

  // Apply pre-blur if enabled
  if (settings.blurRadius > 0) {
    tempCtx.filter = `blur(${settings.blurRadius}px)`;
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.filter = 'none';
  }

  // Get image data
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const outputData = new Uint8ClampedArray(data.length);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  // Prewitt kernels
  const prewittX = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
  const prewittY = [-1, -1, -1, 0, 0, 0, 1, 1, 1];

  // Laplacian kernel
  const laplacian = [0, 1, 0, 1, -4, 1, 0, 1, 0];

  // Process each pixel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      let gx = 0, gy = 0;

      // Apply selected algorithm
      if (settings.algorithm === 'sobel' || settings.algorithm === 'prewitt') {
        const kernelX = settings.algorithm === 'sobel' ? sobelX : prewittX;
        const kernelY = settings.algorithm === 'sobel' ? sobelY : prewittY;

        // Convolve with kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ki = ((y + ky) * width + (x + kx)) * 4;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            
            // Use luminance for grayscale
            const luminance = (data[ki] * 0.299 + data[ki + 1] * 0.587 + data[ki + 2] * 0.114);
            
            gx += luminance * kernelX[kernelIndex];
            gy += luminance * kernelY[kernelIndex];
          }
        }
      } else if (settings.algorithm === 'laplacian') {
        // Apply Laplacian kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ki = ((y + ky) * width + (x + kx)) * 4;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            const luminance = (data[ki] * 0.299 + data[ki + 1] * 0.587 + data[ki + 2] * 0.114);
            gx += luminance * laplacian[kernelIndex];
          }
        }
        gy = gx; // Laplacian is isotropic
      } else if (settings.algorithm === 'canny') {
        // Simplified Canny-like edge detection
        // First pass: Sobel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ki = ((y + ky) * width + (x + kx)) * 4;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            const luminance = (data[ki] * 0.299 + data[ki + 1] * 0.587 + data[ki + 2] * 0.114);
            gx += luminance * sobelX[kernelIndex];
            gy += luminance * sobelY[kernelIndex];
          }
        }
      }

      // Calculate gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const normalizedMagnitude = Math.min(255, magnitude * settings.intensity / 100);

      // Apply threshold
      const thresholded = normalizedMagnitude > settings.threshold ? 255 : 0;

      // Set output pixel
      if (settings.colorMode === 'grayscale') {
        const value = settings.invert ? 255 - thresholded : thresholded;
        outputData[i] = value;
        outputData[i + 1] = value;
        outputData[i + 2] = value;
      } else if (settings.colorMode === 'color') {
        if (thresholded > 0) {
          outputData[i] = data[i];
          outputData[i + 1] = data[i + 1];
          outputData[i + 2] = data[i + 2];
        } else {
          outputData[i] = 0;
          outputData[i + 1] = 0;
          outputData[i + 2] = 0;
        }
      } else { // inverted
        if (thresholded > 0) {
          outputData[i] = 255 - data[i];
          outputData[i + 1] = 255 - data[i + 1];
          outputData[i + 2] = 255 - data[i + 2];
        } else {
          outputData[i] = 255;
          outputData[i + 1] = 255;
          outputData[i + 2] = 255;
        }
      }
      outputData[i + 3] = data[i + 3]; // Preserve alpha
    }
  }

  // Create new ImageData and put it back
  const outputImageData = new ImageData(outputData, width, height);
  ctx.putImageData(outputImageData, 0, 0);
} 