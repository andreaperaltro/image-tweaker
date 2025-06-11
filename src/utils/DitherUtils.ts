// Bayer dithering matrices for different sizes
const BAYER_MATRICES = {
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

// Helper function to convert hex color to RGB array
function hexToRgb(hex: string): number[] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

// Helper function to generate a color palette
function generateColorPalette(imageData: ImageData, colorSteps: number): number[][] {
  const palette: number[][] = [];
  const step = 256 / (colorSteps - 1);
  
  for (let i = 0; i < colorSteps; i++) {
    const value = Math.round(i * step);
    palette.push([value, value, value]);
  }
  
  return palette;
}

// Function to apply dithering to an image
export function applyDithering(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: DitherSettings
): void {
  if (!settings.enabled) return;
  
  // Get source context and data
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
  ctx.imageSmoothingEnabled = false;
  
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
    applyErrorDiffusionDithering(imageData, { ...settings, type: settings.type }, ditherDots);
  }
  
  // Store the dots for SVG export
  ditherDotsStore.updateDots(ditherDots, width, height, settings);
  
  // Put the modified image data back to the temporary canvas
  tempCtx.putImageData(imageData, 0, 0);
  
  // Clear the target canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw the result back to the main canvas at full resolution
  ctx.drawImage(tempCanvas, 0, 0, width, height);
  
  // Clean up
  tempCanvas.remove();
}

function applyOrderedDithering(
  imageData: ImageData,
  settings: DitherSettings,
  ditherDots: DitherDotInfo[] = []
): void {
  const { width, height, data } = imageData;
  const colorSteps = Math.max(2, Math.min(256, settings.colorDepth));
  const threshold = settings.threshold / 255; // Normalize threshold to 0-1 range
  
  // Get the appropriate Bayer matrix size based on resolution
  const matrixSize = settings.resolution < 33 ? 2 : settings.resolution < 66 ? 4 : 8;
  const matrix = BAYER_MATRICES[matrixSize];
  const matrixScale = 1 / (matrixSize * matrixSize);
  
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
      
      // Get the threshold from the Bayer matrix
      const matrixX = x % matrixSize;
      const matrixY = y % matrixSize;
      const bayerThreshold = (matrix[matrixY][matrixX] * matrixScale + threshold) * 255;
      
      if (settings.colorMode === 'grayscale') {
        // Convert to grayscale using weighted average
        const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        // Apply threshold and quantize
        const value = gray < bayerThreshold ? 0 : 255;
        const quantizedValue = Math.round(value / (255 / (colorSteps - 1))) * (255 / (colorSteps - 1));
        
        data[i] = quantizedValue;     // R
        data[i + 1] = quantizedValue; // G
        data[i + 2] = quantizedValue; // B
        
        // Add pixel to dots for SVG export only if it's not white/transparent
        if (quantizedValue < 255) {
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${quantizedValue}, ${quantizedValue}, ${quantizedValue})`;
          
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
        
        // Apply Bayer matrix threshold
        if (gray < bayerThreshold) {
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
      } else if (settings.colorMode === 'color' && palette) { // Add null check for palette
        // Get the current color
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skip if below threshold
        if ((r + g + b) / 3 < bayerThreshold) {
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
        
        // Find the closest color in the palette
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
  settings: DitherSettings & { type: Exclude<DitherType, 'ordered'> },
  ditherDots: DitherDotInfo[] = []
): void {
  const { width, height, data } = imageData;
  const colorSteps = Math.max(2, Math.min(256, settings.colorDepth));
  const threshold = settings.threshold / 255; // Normalize threshold to 0-1 range
  
  // Get the dithering matrix for the selected algorithm
  const ditherMatrix = DITHER_MATRICES[settings.type];
  const matrixWidth = ditherMatrix.width;
  const matrixHeight = ditherMatrix.height;
  
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
        
        // Quantize to nearest step
        const step = 255 / (colorSteps - 1);
        const newValue = Math.round(gray / step) * step;
        
        data[i] = newValue;     // R
        data[i + 1] = newValue; // G
        data[i + 2] = newValue; // B
        
        // Add pixel to dots for SVG export only if it's not white/transparent
        if (newValue < 255) {
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${newValue}, ${newValue}, ${newValue})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        }
        
        // Calculate error
        const error = gray - newValue;
        
        // Distribute error to neighboring pixels
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
      } else if (settings.colorMode === '2-color') {
        // Convert to grayscale using weighted average
        const gray = (workingData[i] * 0.299 + workingData[i + 1] * 0.587 + workingData[i + 2] * 0.114);
        
        // Apply threshold
        const isDark = gray < threshold * 255;
        const newR = isDark ? darkColor[0] : lightColor[0];
        const newG = isDark ? darkColor[1] : lightColor[1];
        const newB = isDark ? darkColor[2] : lightColor[2];
        
        data[i] = newR;     // R
        data[i + 1] = newG; // G
        data[i + 2] = newB; // B
        
        // Add pixel to dots for SVG export
        if (isDark || (lightColor[0] < 255 || lightColor[1] < 255 || lightColor[2] < 255)) {
          const scaledPixelSize = Math.max(1, Math.ceil(width / imageData.width));
          const dotColor = `rgb(${newR}, ${newG}, ${newB})`;
          
          ditherDots.push({
            x: x * scaledPixelSize,
            y: y * scaledPixelSize,
            size: scaledPixelSize,
            color: dotColor
          });
        }
        
        // Calculate error
        const error = gray - (isDark ? 0 : 255);
        
        // Distribute error to neighboring pixels
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
      } else if (settings.colorMode === 'color' && palette) {
        // Get the current color
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
        
        // Find the closest color in the palette
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
      // Alpha channel remains unchanged
    }
  }
} 