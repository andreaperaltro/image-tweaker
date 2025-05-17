/**
 * Dithering Rendering Utility Functions
 * 
 * This module provides functionality for:
 * 1. Creating dithering patterns with different algorithms
 * 2. Supporting both grayscale and color dithering
 * 3. Controlling resolution and color depth
 */

import { ColorSettings } from './ColorUtils';

// Define exact dot info type to store the exact parameters for each dot
export type DitherDotInfo = {
  x: number;
  y: number;
  size: number;
  color?: string;
};

// Create a global store to access the dot information for SVG export
export const ditherDotsStore = {
  dots: [] as DitherDotInfo[],
  width: 0,
  height: 0,
  settings: null as DitherSettings | null,
  updateDots(newDots: DitherDotInfo[], width: number, height: number, settings: DitherSettings) {
    this.dots = [...newDots]; // Create a copy of the array
    this.width = width;
    this.height = height;
    this.settings = {...settings};
  }
};

// Dithering matrices for different algorithms
const DITHER_MATRICES: Record<Exclude<DitherType, 'ordered'>, { matrix: number[][], width: number, height: number }> = {
  'floyd-steinberg': {
    matrix: [
      [0, 0, 7/16],
      [3/16, 5/16, 1/16]
    ],
    width: 3,
    height: 2
  },
  'jarvis': {
    matrix: [
      [0, 0, 0, 7/48, 5/48],
      [3/48, 5/48, 7/48, 5/48, 3/48],
      [1/48, 3/48, 5/48, 3/48, 1/48]
    ],
    width: 5,
    height: 3
  },
  'judice-ninke': {
    matrix: [
      [0, 0, 0, 7/48, 5/48],
      [3/48, 5/48, 7/48, 5/48, 3/48],
      [1/48, 3/48, 5/48, 3/48, 1/48]
    ],
    width: 5,
    height: 3
  },
  'stucki': {
    matrix: [
      [0, 0, 0, 8/42, 4/42],
      [2/42, 4/42, 8/42, 4/42, 2/42],
      [1/42, 2/42, 4/42, 2/42, 1/42]
    ],
    width: 5,
    height: 3
  },
  'burkes': {
    matrix: [
      [0, 0, 0, 8/32, 4/32],
      [2/32, 4/32, 8/32, 4/32, 2/32]
    ],
    width: 5,
    height: 2
  }
};

// Pre-computed Bayer matrices for common sizes
const BAYER_MATRICES: Record<number, number[][]> = {
  1: [[0]],
  2: [
    [0, 2],
    [3, 1]
  ],
  4: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ],
  8: [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ]
};

export type DitherType = 'ordered' | 'floyd-steinberg' | 'jarvis' | 'judice-ninke' | 'stucki' | 'burkes';
export type DitherColorMode = 'grayscale' | 'color' | '2-color';

export interface DitherSettings {
  enabled: boolean;
  type: DitherType;
  threshold: number;
  colorMode: DitherColorMode;
  resolution: number; // 1-100, where 100 is full resolution
  colorDepth: number; // 2-256 colors
  darkColor: string;  // Color for dark areas when using 2-color mode
  lightColor: string; // Color for light areas when using 2-color mode
}

/**
 * Apply dithering effect to a canvas
 */
export function applyDithering(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: DitherSettings
): void {
  if (!settings.enabled) return;
  
  // Get source context
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;
  
  // Calculate scaled dimensions based on resolution
  const scale = settings.resolution / 100;
  const scaledWidth = Math.max(1, Math.floor(width * scale));
  const scaledHeight = Math.max(1, Math.floor(height * scale));
  
  // Create temporary canvas for resolution reduction
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // Disable image smoothing for sharp pixel art look
  tempCtx.imageSmoothingEnabled = false;
  
  // Draw source image at reduced resolution
  tempCtx.drawImage(sourceCanvas, 0, 0, scaledWidth, scaledHeight);
  
  // Get image data from temporary canvas
  const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
  
  // Collection of dots for vector SVG export
  const ditherDots: DitherDotInfo[] = [];
  
  // Apply the appropriate dithering algorithm
  if (settings.type === 'ordered') {
    applyOrderedDithering(imageData, settings, ditherDots);
  } else {
    applyErrorDiffusionDithering(imageData, settings, ditherDots);
  }
  
  // Store the dots for SVG export
  ditherDotsStore.updateDots(ditherDots, width, height, settings);
  
  // Put the modified image data back to the temporary canvas
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw the result back to the main canvas at full resolution
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false; // Maintain sharpness when scaling up
  ctx.drawImage(tempCanvas, 0, 0, width, height);
}

function applyOrderedDithering(
  imageData: ImageData,
  settings: DitherSettings,
  ditherDots: DitherDotInfo[] = []
): void {
  const { width, height, data } = imageData;
  const colorSteps = Math.max(2, Math.min(256, settings.colorDepth));
  const threshold = settings.threshold / 255; // Normalize threshold to 0-1 range
  
  // Generate a fixed color palette for color mode
  const palette = settings.colorMode === 'color' ? generateColorPalette(imageData, colorSteps) : null;
  
  // Parse custom colors for 2-color mode
  let darkColor: number[] = [0, 0, 0];
  let lightColor: number[] = [255, 255, 255];
  
  if (settings.colorMode === '2-color') {
    // Parse hex colors to RGB
    darkColor = hexToRgb(settings.darkColor) || darkColor;
    lightColor = hexToRgb(settings.lightColor) || lightColor;
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      if (settings.colorMode === 'grayscale') {
        // Convert to grayscale using weighted average
        const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        // Apply threshold and quantize
        const adjustedGray = gray < threshold * 255 ? 0 : gray;
        const value = Math.round(adjustedGray / (255 / (colorSteps - 1))) * (255 / (colorSteps - 1));
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        
        // Add pixel to dots for SVG export only if it's not white/transparent
        if (value < 255) {
          // Calculate the actual size based on proportions between scaled and original canvas
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${value}, ${value}, ${value})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        }
      } else if (settings.colorMode === '2-color') {
        // Convert to grayscale using weighted average
        const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        
        // Apply threshold to determine if pixel should be dark or light
        if (gray < threshold * 255) {
          data[i] = darkColor[0];       // R
          data[i + 1] = darkColor[1];   // G
          data[i + 2] = darkColor[2];   // B
          
          // Add pixel to dots for SVG export
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${darkColor[0]}, ${darkColor[1]}, ${darkColor[2]})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        } else {
          data[i] = lightColor[0];      // R
          data[i + 1] = lightColor[1];  // G
          data[i + 2] = lightColor[2];  // B
          
          // Don't add light pixels to SVG export unless they're not white
          if (lightColor[0] < 255 || lightColor[1] < 255 || lightColor[2] < 255) {
            const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
            const dotColor = `rgb(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]})`;
            
            ditherDots.push({
              x: x * scaledPixelSize,
              y: y * scaledPixelSize,
              size: scaledPixelSize,
              color: dotColor
            });
          }
        }
      } else if (palette) {
        // Find the closest color in the palette
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skip if below threshold
        if ((r + g + b) / 3 < threshold * 255) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          
          // Add black pixel to dots for SVG export
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: 'rgb(0, 0, 0)'
          });
          
          continue;
        }
        
        let closestColor = palette[0];
        let minDistance = Infinity;
        
        for (const color of palette) {
          const distance = Math.sqrt(
            Math.pow(r - color[0], 2) +
            Math.pow(g - color[1], 2) +
            Math.pow(b - color[2], 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
          }
        }
        
        data[i] = closestColor[0];
        data[i + 1] = closestColor[1];
        data[i + 2] = closestColor[2];
        
        // Add pixel to dots for SVG export only if it's not white/transparent
        if (closestColor[0] < 255 || closestColor[1] < 255 || closestColor[2] < 255) {
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${closestColor[0]}, ${closestColor[1]}, ${closestColor[2]})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        }
      }
      // Alpha channel remains unchanged
    }
  }
}

function applyErrorDiffusionDithering(
  imageData: ImageData,
  settings: DitherSettings,
  ditherDots: DitherDotInfo[] = []
): void {
  const { width, height, data } = imageData;
  const colorSteps = Math.max(2, Math.min(256, settings.colorDepth));
  const threshold = settings.threshold / 255; // Normalize threshold to 0-1 range
  
  // Get the dithering matrix for the selected algorithm
  const ditherMatrix = settings.type === 'ordered' ? null : DITHER_MATRICES[settings.type];
  const matrixWidth = ditherMatrix?.width ?? 0;
  const matrixHeight = ditherMatrix?.height ?? 0;
  
  // Generate color palette based on the actual image colors
  const palette = settings.colorMode === 'color' ? generateColorPalette(imageData, colorSteps) : null;
  
  // Parse custom colors for 2-color mode
  let darkColor: number[] = [0, 0, 0];
  let lightColor: number[] = [255, 255, 255];
  
  if (settings.colorMode === '2-color') {
    // Parse hex colors to RGB
    darkColor = hexToRgb(settings.darkColor) || darkColor;
    lightColor = hexToRgb(settings.lightColor) || lightColor;
  }
  
  // Create a copy of the image data to work with
  const workingData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      if (settings.colorMode === 'grayscale') {
        // Convert to grayscale using weighted average
        const gray = (workingData[i] * 0.299 + workingData[i + 1] * 0.587 + workingData[i + 2] * 0.114);
        // Apply threshold and quantize
        const adjustedGray = gray < threshold * 255 ? 0 : gray;
        const newValue = Math.round(adjustedGray / (255 / (colorSteps - 1))) * (255 / (colorSteps - 1));
        const error = gray - newValue;
        
        data[i] = newValue;     // R
        data[i + 1] = newValue; // G
        data[i + 2] = newValue; // B

        // Add pixel to dots for SVG export only if it's not white/transparent
        if (newValue < 255) {
          // Calculate the actual size based on proportions between scaled and original canvas
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${newValue}, ${newValue}, ${newValue})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        }
        
        // Distribute error to neighboring pixels
        if (ditherMatrix) {
          for (let dy = 0; dy < matrixHeight; dy++) {
            for (let dx = -Math.floor(matrixWidth/2); dx <= Math.floor(matrixWidth/2); dx++) {
              if (dy === 0 && dx <= 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny < height) {
                const ni = (ny * width + nx) * 4;
                const factor = ditherMatrix.matrix[dy][dx + Math.floor(matrixWidth/2)];
                workingData[ni] = Math.min(255, Math.max(0, workingData[ni] + error * factor));
                workingData[ni + 1] = Math.min(255, Math.max(0, workingData[ni + 1] + error * factor));
                workingData[ni + 2] = Math.min(255, Math.max(0, workingData[ni + 2] + error * factor));
              }
            }
          }
        }
      } else if (settings.colorMode === '2-color') {
        // Convert to grayscale using weighted average
        const gray = (workingData[i] * 0.299 + workingData[i + 1] * 0.587 + workingData[i + 2] * 0.114);
        
        let newValue: number;
        let newR: number, newG: number, newB: number;
        
        // Apply threshold to determine if pixel should be dark or light
        if (gray < threshold * 255) {
          newR = darkColor[0];
          newG = darkColor[1];
          newB = darkColor[2];
          newValue = 0; // Use this for error calculation

          // Add pixel to dots for SVG export
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${newR}, ${newG}, ${newB})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        } else {
          newR = lightColor[0];
          newG = lightColor[1];
          newB = lightColor[2];
          newValue = 255; // Use this for error calculation

          // Don't add light pixels to SVG export unless they're not white
          if (lightColor[0] < 255 || lightColor[1] < 255 || lightColor[2] < 255) {
            const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
            const dotColor = `rgb(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]})`;
            
            ditherDots.push({
              x: x * scaledPixelSize,
              y: y * scaledPixelSize,
              size: scaledPixelSize,
              color: dotColor
            });
          }
        }
        
        data[i] = newR;     // R
        data[i + 1] = newG; // G
        data[i + 2] = newB; // B
        
        // Calculate error based on grayscale value
        const error = gray - newValue;
        
        // Distribute error to neighboring pixels
        if (ditherMatrix) {
          for (let dy = 0; dy < matrixHeight; dy++) {
            for (let dx = -Math.floor(matrixWidth/2); dx <= Math.floor(matrixWidth/2); dx++) {
              if (dy === 0 && dx <= 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny < height) {
                const ni = (ny * width + nx) * 4;
                const factor = ditherMatrix.matrix[dy][dx + Math.floor(matrixWidth/2)];
                // Only adjust the gray value for error diffusion
                const errorFactor = error * factor;
                workingData[ni] = Math.min(255, Math.max(0, workingData[ni] + errorFactor));
                workingData[ni + 1] = Math.min(255, Math.max(0, workingData[ni + 1] + errorFactor));
                workingData[ni + 2] = Math.min(255, Math.max(0, workingData[ni + 2] + errorFactor));
              }
            }
          }
        }
      } else if (palette) {
        // Find the closest color in the palette
        const r = workingData[i];
        const g = workingData[i + 1];
        const b = workingData[i + 2];
        
        // Skip if below threshold
        if ((r + g + b) / 3 < threshold * 255) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;

          // Add black pixel to dots for SVG export
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: 'rgb(0, 0, 0)'
          });
          
          continue;
        }
        
        let closestColor = palette[0];
        let minDistance = Infinity;
        
        for (const color of palette) {
          const distance = Math.sqrt(
            Math.pow(r - color[0], 2) +
            Math.pow(g - color[1], 2) +
            Math.pow(b - color[2], 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
          }
        }
        
        data[i] = closestColor[0];
        data[i + 1] = closestColor[1];
        data[i + 2] = closestColor[2];

        // Add pixel to dots for SVG export only if it's not white/transparent
        if (closestColor[0] < 255 || closestColor[1] < 255 || closestColor[2] < 255) {
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${closestColor[0]}, ${closestColor[1]}, ${closestColor[2]})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        }
        
        // Calculate error for each channel
        const errorR = r - closestColor[0];
        const errorG = g - closestColor[1];
        const errorB = b - closestColor[2];
        
        // Distribute error to neighboring pixels
        if (ditherMatrix) {
          for (let dy = 0; dy < matrixHeight; dy++) {
            for (let dx = -Math.floor(matrixWidth/2); dx <= Math.floor(matrixWidth/2); dx++) {
              if (dy === 0 && dx <= 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny < height) {
                const ni = (ny * width + nx) * 4;
                const factor = ditherMatrix.matrix[dy][dx + Math.floor(matrixWidth/2)];
                workingData[ni] = Math.min(255, Math.max(0, workingData[ni] + errorR * factor));
                workingData[ni + 1] = Math.min(255, Math.max(0, workingData[ni + 1] + errorG * factor));
                workingData[ni + 2] = Math.min(255, Math.max(0, workingData[ni + 2] + errorB * factor));
              }
            }
          }
        }
      }
      // Alpha channel remains unchanged
    }
  }
}

// Function to generate a color palette using k-means clustering
function generateColorPalette(imageData: ImageData, numColors: number): number[][] {
  const { data, width, height } = imageData;
  const pixels: number[][] = [];
  
  // Collect all non-black pixels
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  
  if (pixels.length === 0) return [[0, 0, 0]];
  
  // Initialize centroids with random pixels
  const centroids: number[][] = [];
  for (let i = 0; i < numColors; i++) {
    const randomIndex = Math.floor(Math.random() * pixels.length);
    centroids.push([...pixels[randomIndex]]);
  }
  
  // K-means clustering
  const maxIterations = 10;
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign pixels to nearest centroid - create array of empty arrays manually
    const clusters: number[][][] = [];
    for (let i = 0; i < numColors; i++) {
      clusters.push([]);
    }
    
    for (const pixel of pixels) {
      let minDist = Infinity;
      let nearestCentroid = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const dist = Math.sqrt(
          Math.pow(pixel[0] - centroids[i][0], 2) +
          Math.pow(pixel[1] - centroids[i][1], 2) +
          Math.pow(pixel[2] - centroids[i][2], 2)
        );
        
        if (dist < minDist) {
          minDist = dist;
          nearestCentroid = i;
        }
      }
      
      clusters[nearestCentroid].push(pixel);
    }
    
    // Update centroids
    let changed = false;
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length === 0) continue;
      
      const newCentroid = [0, 0, 0];
      for (const pixel of clusters[i]) {
        newCentroid[0] += pixel[0];
        newCentroid[1] += pixel[1];
        newCentroid[2] += pixel[2];
      }
      
      newCentroid[0] = Math.round(newCentroid[0] / clusters[i].length);
      newCentroid[1] = Math.round(newCentroid[1] / clusters[i].length);
      newCentroid[2] = Math.round(newCentroid[2] / clusters[i].length);
      
      if (newCentroid[0] !== centroids[i][0] ||
          newCentroid[1] !== centroids[i][1] ||
          newCentroid[2] !== centroids[i][2]) {
        changed = true;
      }
      
      centroids[i] = newCentroid;
    }
    
    if (!changed) break;
  }
  
  return centroids;
}

// Helper function to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): number[] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): number[] | undefined {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r !== undefined && g !== undefined && b !== undefined ? [r, g, b] : undefined;
} 