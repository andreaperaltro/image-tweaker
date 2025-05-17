/**
 * Text-based Dithering Effect
 * Converts image to a pattern made of repeating text
 */

export type TextDitherSettings = {
  enabled: boolean;
  text: string;
  fontSize: number;
  fontFamily: string;
  colorMode: 'monochrome' | 'colored';
  contrast: number;
  brightness: number;
  invert: boolean;
  resolution: number;
};

const DEFAULT_TEXT = 'MATRIX';

/**
 * Apply text-based dithering effect to the image
 */
export function applyTextDither(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: TextDitherSettings
): void {
  if (!settings.enabled) return;

  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create a temporary canvas to draw the text
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // Clear the canvas
  tempCtx.clearRect(0, 0, width, height);
  
  // Set text properties
  tempCtx.font = `${settings.fontSize}px ${settings.fontFamily}`;
  tempCtx.textAlign = 'center';
  tempCtx.textBaseline = 'middle';
  
  // Get the text to use
  const text = settings.text || DEFAULT_TEXT;
  const chars = text.split('');
  const charCount = chars.length;
  
  // Calculate the number of characters to place based on resolution
  const totalPixels = width * height;
  const pixelsPerChar = Math.max(1, Math.floor((settings.fontSize * settings.fontSize) / settings.resolution));
  const numChars = Math.floor(totalPixels / pixelsPerChar);
  
  // Place characters sequentially based on image brightness
  for (let i = 0; i < numChars; i++) {
    // Get random position
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    
    // Get brightness at this position
    const pixelIndex = (y * width + x) * 4;
    const r = data[pixelIndex];
    const g = data[pixelIndex + 1];
    const b = data[pixelIndex + 2];
    
    // Calculate brightness (0-255)
    let brightness = Math.round((r + g + b) / 3);
    
    // Apply contrast
    if (settings.contrast !== 1) {
      const factor = (259 * (settings.contrast * 100 + 255)) / (255 * (259 - settings.contrast * 100));
      brightness = factor * (brightness - 128) + 128;
    }
    
    // Apply brightness
    brightness = brightness * settings.brightness;
    
    // Clamp to 0-255 range
    brightness = Math.max(0, Math.min(255, brightness));
    
    // Invert if needed
    if (settings.invert) {
      brightness = 255 - brightness;
    }
    
    // Get the character to use (cycle through the string)
    const charIndex = i % charCount;
    const char = chars[charIndex];
    
    // Determine text color based on color mode
    if (settings.colorMode === 'colored') {
      // For colored mode, use the color at this position
      let r = data[pixelIndex];
      let g = data[pixelIndex + 1];
      let b = data[pixelIndex + 2];
      
      // Apply contrast
      if (settings.contrast !== 1) {
        const factor = (259 * (settings.contrast * 100 + 255)) / (255 * (259 - settings.contrast * 100));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }
      
      // Apply brightness
      r = r * settings.brightness;
      g = g * settings.brightness;
      b = b * settings.brightness;
      
      // Clamp to 0-255 range
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      // Invert if needed
      if (settings.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }
      
      tempCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
      // For monochrome mode, use black or white based on brightness
      const threshold = 128;
      tempCtx.fillStyle = brightness > threshold ? 'white' : 'black';
    }
    
    // Draw the character
    tempCtx.fillText(char, x, y);
  }
  
  // Draw the temporary canvas onto the main canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
}

// Helper function to estimate the visual weight of a character
function getCharWeight(char: string): number {
  // Approximate visual weight of characters (higher = darker/more dense)
  const weights: Record<string, number> = {
    '@': 10,
    'M': 9,
    'W': 9,
    'B': 8,
    'E': 8,
    'F': 8,
    'H': 8,
    'K': 8,
    'N': 8,
    'R': 8,
    'X': 8,
    'Z': 8,
    'A': 7,
    'D': 7,
    'O': 7,
    'P': 7,
    'Q': 7,
    'S': 7,
    'U': 7,
    'V': 7,
    'Y': 7,
    'G': 6,
    'J': 6,
    'T': 6,
    'C': 5,
    'I': 5,
    'L': 5,
    'i': 4,
    'l': 4,
    't': 4,
    'f': 4,
    'j': 4,
    'm': 4,
    'w': 4,
    'b': 3,
    'd': 3,
    'h': 3,
    'k': 3,
    'n': 3,
    'p': 3,
    'q': 3,
    'r': 3,
    'u': 3,
    'v': 3,
    'y': 3,
    'a': 2,
    'c': 2,
    'e': 2,
    'g': 2,
    'o': 2,
    's': 2,
    'z': 2,
    'x': 2,
    '.': 1,
    ',': 1,
    ';': 1,
    ':': 1,
    '!': 1,
    '?': 1,
    "'": 1,
    '"': 1,
    '(': 1,
    ')': 1,
    '[': 1,
    ']': 1,
    '{': 1,
    '}': 1,
    '<': 1,
    '>': 1,
    '/': 1,
    '\\': 1,
    '|': 1,
    '-': 1,
    '_': 1,
    '+': 1,
    '=': 1,
    '*': 1,
    '&': 1,
    '^': 1,
    '%': 1,
    '$': 1,
    '#': 1,
    ' ': 0
  };
  
  return weights[char] || 5; // Default to medium weight if character not found
} 