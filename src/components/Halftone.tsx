/**
 * Halftone Rendering Utility Functions
 * 
 * This module provides functionality for:
 * 1. Creating halftone patterns with different arrangements
 * 2. Supporting multiple dot shapes (circle, hexagon, ellipse, etc.)
 * 3. Controlling cell size, mix, and color settings
 */

import React, { useRef, useEffect } from 'react';

// Define exact dot info type to store the exact parameters for each dot
export type HalftoneDotInfo = {
  x: number;
  y: number;
  size: number;
  color?: string;
};

// Background type definitions
export type BackgroundType = 'transparent' | 'solid' | 'gradient';

export type BackgroundSettings = {
  enabled: boolean;
  type: BackgroundType;
  color: string;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientAngle: number;
};

// Create a global store to access the dot information for SVG export
export const halftoneDotsStore = {
  dots: [] as HalftoneDotInfo[],
  width: 0,
  height: 0,
  settings: null as HalftoneSettings | null,
  updateDots(newDots: HalftoneDotInfo[], width: number, height: number, settings: HalftoneSettings) {
    this.dots = newDots;
    this.width = width;
    this.height = height;
    this.settings = {...settings};
  }
};

export type HalftoneArrangement = 'grid' | 'hexagonal' | 'spiral' | 'concentric' | 'random';
export type HalftoneShape = 'circle' | 'square' | 'diamond' | 'line' | 'cross' | 'ellipse' | 'triangle' | 'hexagon';

export type HalftoneSettings = {
  enabled: boolean;
  cellSize: number;
  mix: number;
  colored: boolean;
  enableCMYK: boolean;
  arrangement: HalftoneArrangement;
  shape: HalftoneShape;
  angleOffset: number;
  sizeVariation: number;
  dotScaleFactor: number;
  invertBrightness: boolean;
  spiralTightness: number;
  spiralExpansion: number;
  spiralRotation: number;
  spiralCenterX: number;
  spiralCenterY: number;
  concentricCenterX: number;
  concentricCenterY: number;
  concentricRingSpacing: number;
  hexagonalRowOffset: number;
  channels: {
    cyan: boolean;
    magenta: boolean;
    yellow: boolean;
    black: boolean;
  };
  cmykAngles: {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
  };
};

/**
 * Apply halftone effect to a canvas
 */
export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: HalftoneSettings
): void {
  if (!settings.enabled) return;
  
  // Get source context
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;
  
  // Get image data from source
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Clear the destination canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set a background color (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Cell size should be at least 1
  const cellSize = Math.max(1, settings.cellSize);
  
  // Calculate number of cells
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  
  // Store calculated dots for SVG export
  const calculatedDots: HalftoneDotInfo[] = [];
  
  // CMYK halftone if CMYK mode is enabled and channels are selected
  if (settings.enableCMYK && (settings.channels.cyan || settings.channels.magenta || 
      settings.channels.yellow || settings.channels.black)) {
    applyCMYKHalftone(ctx, pixels, width, height, cols, rows, cellSize, settings, calculatedDots);
    
    // Apply the original image with reduced opacity for mixing if mix < 100
    if (settings.mix < 100) {
      ctx.globalAlpha = 1 - (settings.mix / 100);
      ctx.drawImage(sourceCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }
    
    // Store the dots for SVG export
    halftoneDotsStore.updateDots(calculatedDots, width, height, settings);
    
    return;
  }
  
  // Draw standard halftone pattern (RGB or grayscale)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Cell position
      const initialCenterX = x * cellSize + cellSize / 2;
      const initialCenterY = y * cellSize + cellSize / 2;
      
      // Variables to hold the final position (may be adjusted based on arrangement)
      let centerX = initialCenterX;
      let centerY = initialCenterY;
      
      // Adjust position based on arrangement
      if (settings.arrangement === 'hexagonal') {
        const rowOffset = settings.hexagonalRowOffset || 0.5;
        
        // Calculate base number of rows needed
        const neededRows = Math.ceil(height / cellSize) + 2;
        
        // Skip if we're beyond the needed rows
        if (y >= neededRows) {
          continue;
        }
        
        // Position using cell size
        centerY = y * cellSize;
        
        // Apply horizontal offset on alternate rows
        if (y % 2 === 0) {
          centerX += cellSize * rowOffset;
        }
        
        // Skip if we're beyond the image bounds
        if (centerX > width + cellSize || centerX < -cellSize) {
          continue;
        }
      } else if (settings.arrangement === 'spiral') {
        // Calculate the center point with offset
        const spiralCenterX = width / 2 + settings.spiralCenterX;
        const spiralCenterY = height / 2 + settings.spiralCenterY;
        
        // Calculate distance from the center point
        const dx = initialCenterX - spiralCenterX;
        const dy = initialCenterY - spiralCenterY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle from center
        const angle = Math.atan2(dy, dx);
        
        // Add rotation offset (convert degrees to radians)
        const rotationRadians = settings.spiralRotation * (Math.PI / 180);
        
        // Calculate spiral parameters
        // Scale tightness to be between 0.001 and 0.01 for better control
        const tightness = 0.001 + (settings.spiralTightness * 0.009);
        const expansion = settings.spiralExpansion || 1.0;
        
        // Calculate spiral angle - this is the key to creating a proper spiral
        // The angle increases as we move outward from the center
        const spiralAngle = angle + rotationRadians + (distanceFromCenter * tightness * expansion);
        
        // Calculate new position based on spiral equation
        // For a proper spiral, we need to use the original distance but with the new angle
        centerX = spiralCenterX + Math.cos(spiralAngle) * distanceFromCenter;
        centerY = spiralCenterY + Math.sin(spiralAngle) * distanceFromCenter;
        
        // Ensure the spiral covers the entire canvas by scaling the distance
        const maxDistance = Math.sqrt(width * width + height * height) / 2;
        const scaleFactor = maxDistance / (maxDistance * 0.8); // 0.8 to ensure some margin
        centerX = spiralCenterX + (centerX - spiralCenterX) * scaleFactor;
        centerY = spiralCenterY + (centerY - spiralCenterY) * scaleFactor;
      } else if (settings.arrangement === 'concentric') {
        // Calculate the center point with offset
        const concentricCenterX = width / 2 + settings.concentricCenterX;
        const concentricCenterY = height / 2 + settings.concentricCenterY;
        
        // Calculate distance from the center point
        const dx = initialCenterX - concentricCenterX;
        const dy = initialCenterY - concentricCenterY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle from center
        const angle = Math.atan2(dy, dx);
        
        // Calculate ring number (which concentric circle this point belongs to)
        // Adjust spacing with the concentricRingSpacing setting
        const ringSpacing = cellSize * (settings.concentricRingSpacing || 1);
        const ringNumber = Math.floor(distanceFromCenter / ringSpacing);
        
        // Quantize the distance to create distinct rings
        // This creates the concentric circle effect
        const quantizedDistance = ringNumber * ringSpacing;
        
        // Place the dot on the quantized circle
        centerX = concentricCenterX + Math.cos(angle) * quantizedDistance;
        centerY = concentricCenterY + Math.sin(angle) * quantizedDistance;
      } else if (settings.arrangement === 'random') {
        centerX = initialCenterX + (Math.random() - 0.5) * cellSize / 2;
        centerY = initialCenterY + (Math.random() - 0.5) * cellSize / 2;
      }
      
      // Get the pixel at this position (clamped to image boundaries)
      const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
      const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
      const pixelIndex = (pixelY * width + pixelX) * 4;
      
      // Calculate dot size based on pixel brightness
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      
      // Calculate brightness (0 to 1) - Perceived luminance approach
      let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // For standard halftone, we want dark areas to have large dots by default
      // So we invert the brightness here unless invertBrightness is true
      if (!settings.invertBrightness) {
        brightness = 1 - brightness;
      }
      
      // Apply size variation
      const sizeVariation = 1 + (Math.random() - 0.5) * settings.sizeVariation;
      
      // Calculate max dot size
      const maxDotSize = cellSize * settings.dotScaleFactor * sizeVariation;
      
      // Calculate actual dot size
      const dotSize = maxDotSize * brightness;
      
      // Skip drawing dots that are too small (optimization)
      if (dotSize < 0.5) continue;
      
      // Set the color based on settings
      if (settings.colored) {
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      } else {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
      }
      
      // Draw the dot with the selected shape
      drawHalftoneShape(
        ctx, 
        centerX, 
        centerY, 
        dotSize, 
        settings.shape, 
        settings.angleOffset
      );
      
      // Store dot information for SVG export
      calculatedDots.push({
        x: centerX,
        y: centerY,
        size: dotSize,
        color: settings.colored ? `rgb(${r},${g},${b})` : undefined
      });
    }
  }
  
  // Store the dots for SVG export
  halftoneDotsStore.updateDots(calculatedDots, width, height, settings);
  
  // Apply the original image with reduced opacity for mixing
  if (settings.mix < 100) {
    ctx.globalAlpha = 1 - (settings.mix / 100);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }
}

/**
 * Apply CMYK halftone effect
 */
function applyCMYKHalftone(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  cols: number,
  rows: number,
  cellSize: number,
  settings: HalftoneSettings,
  calculatedDots: HalftoneDotInfo[]
): void {
  // Convert RGB to CMYK function
  const rgbToCmyk = (r: number, g: number, b: number) => {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
    
    return { c, m, y, k };
  };
  
  // Use a seeded random generator for consistent results
  const seedRandom = (x: number, y: number) => {
    const seed = (x * 9999 + y * 9973) % 10000;
    return Math.sin(seed) * 0.5 + 0.5;
  };
  
  // Process each CMYK channel
  if (settings.channels.cyan) {
    ctx.fillStyle = 'cyan';
    processChannel('c', settings.cmykAngles.cyan);
  }
  
  if (settings.channels.magenta) {
    ctx.fillStyle = 'magenta';
    processChannel('m', settings.cmykAngles.magenta);
  }
  
  if (settings.channels.yellow) {
    ctx.fillStyle = 'yellow';
    processChannel('y', settings.cmykAngles.yellow);
  }
  
  if (settings.channels.black) {
    ctx.fillStyle = 'black';
    processChannel('k', settings.cmykAngles.black);
  }
  
  // Helper function to process each channel
  function processChannel(channel: 'c' | 'm' | 'y' | 'k', angle: number) {
    // Create a separate layer for channel blending
    ctx.globalCompositeOperation = 'multiply';
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Cell position
        const initialCenterX = x * cellSize + cellSize / 2;
        let initialCenterY = y * cellSize + cellSize / 2;
        
        // Variables to hold the final position (may be adjusted based on arrangement)
        let centerX = initialCenterX;
        let centerY = initialCenterY;
        
        // Adjust position based on arrangement
        if (settings.arrangement === 'hexagonal') {
          const rowOffset = settings.hexagonalRowOffset || 0.5;
          
          // Calculate base number of rows needed
          const neededRows = Math.ceil(height / cellSize) + 2;
          
          // Skip if we're beyond the needed rows
          if (y >= neededRows) {
            continue;
          }
          
          // Position using cell size
          centerY = y * cellSize;
          
          // Apply horizontal offset on alternate rows
          if (y % 2 === 0) {
            centerX += cellSize * rowOffset;
          }
          
          // Skip if we're beyond the image bounds
          if (centerX > width + cellSize || centerX < -cellSize) {
            continue;
          }
        } else if (settings.arrangement === 'spiral') {
          // Calculate the center point with offset
          const spiralCenterX = width / 2 + settings.spiralCenterX;
          const spiralCenterY = height / 2 + settings.spiralCenterY;
          
          // Calculate distance from the center point
          const dx = initialCenterX - spiralCenterX;
          const dy = initialCenterY - spiralCenterY;
          const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate angle from center
          const angle = Math.atan2(dy, dx);
          
          // Add rotation offset (convert degrees to radians)
          const rotationRadians = settings.spiralRotation * (Math.PI / 180);
          
          // Calculate spiral parameters
          const tightness = 0.001 + (settings.spiralTightness * 0.009);
          const expansion = settings.spiralExpansion || 1.0;
          
          // Calculate spiral angle - this is the key to creating a proper spiral
          // The angle increases as we move outward from the center
          const spiralAngle = angle + rotationRadians + (distanceFromCenter * tightness * expansion);
          
          // Calculate new position based on spiral equation
          // For a proper spiral, we need to use the original distance but with the new angle
          centerX = spiralCenterX + Math.cos(spiralAngle) * distanceFromCenter;
          centerY = spiralCenterY + Math.sin(spiralAngle) * distanceFromCenter;
          
          // Ensure the spiral covers the entire canvas by scaling the distance
          const maxDistance = Math.sqrt(width * width + height * height) / 2;
          const scaleFactor = maxDistance / (maxDistance * 0.8); // 0.8 to ensure some margin
          centerX = spiralCenterX + (centerX - spiralCenterX) * scaleFactor;
          centerY = spiralCenterY + (centerY - spiralCenterY) * scaleFactor;
        } else if (settings.arrangement === 'concentric') {
          // Calculate the center point with offset
          const concentricCenterX = width / 2 + settings.concentricCenterX;
          const concentricCenterY = height / 2 + settings.concentricCenterY;
          
          // Calculate distance from the center point
          const dx = initialCenterX - concentricCenterX;
          const dy = initialCenterY - concentricCenterY;
          const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate angle from center
          const angle = Math.atan2(dy, dx);
          
          // Calculate ring number (which concentric circle this point belongs to)
          // Adjust spacing with the concentricRingSpacing setting
          const ringSpacing = cellSize * (settings.concentricRingSpacing || 1);
          const ringNumber = Math.floor(distanceFromCenter / ringSpacing);
          
          // Quantize the distance to create distinct rings
          // This creates the concentric circle effect
          const quantizedDistance = ringNumber * ringSpacing;
          
          // Place the dot on the quantized circle
          centerX = concentricCenterX + Math.cos(angle) * quantizedDistance;
          centerY = concentricCenterY + Math.sin(angle) * quantizedDistance;
        } else if (settings.arrangement === 'random') {
          centerX = initialCenterX + (Math.random() - 0.5) * cellSize / 2;
          centerY = initialCenterY + (Math.random() - 0.5) * cellSize / 2;
        }
        
        // Get the pixel at this position
        const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
        const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
        const pixelIndex = (pixelY * width + pixelX) * 4;
        
        // Get RGB values
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        
        // Convert to CMYK
        const cmyk = rgbToCmyk(r, g, b);
        
        // Get the value for this channel
        let value = cmyk[channel];
        
        // Invert if needed (CMYK is subtractive)
        if (settings.invertBrightness) {
          value = 1 - value;
        }
        
        // Apply size variation
        const sizeVariation = 1 + (Math.random() - 0.5) * settings.sizeVariation;
        
        // Calculate max dot size
        const maxDotSize = cellSize * settings.dotScaleFactor * sizeVariation;
        
        // Calculate actual dot size
        const dotSize = maxDotSize * value;
        
        // Skip drawing dots that are too small
        if (dotSize < 0.5) continue;
        
        // Draw the dot with the selected shape and angle
        drawHalftoneShape(
          ctx, 
          centerX, 
          centerY, 
          dotSize, 
          settings.shape, 
          angle + settings.angleOffset
        );
        
        // Store dot information for SVG export
        const channelColor = channel === 'c' ? 'cyan' : 
                            channel === 'm' ? 'magenta' : 
                            channel === 'y' ? 'yellow' : 'black';
                            
        calculatedDots.push({
          x: centerX,
          y: centerY,
          size: dotSize,
          color: channelColor
        });
      }
    }
    
    // Reset composite operation after each channel
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Draw a halftone shape
 */
function drawHalftoneShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: HalftoneShape,
  angle: number
): void {
  // Save context state
  ctx.save();
  
  // Apply rotation if needed
  if (angle !== 0) {
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-x, -y);
  }
  
  // Begin path
  ctx.beginPath();
  
  // Draw the selected shape
  switch (shape) {
    case 'square':
      ctx.rect(x - size / 2, y - size / 2, size, size);
      ctx.fill();
      break;
      
    case 'line':
      ctx.lineWidth = size / 2;
      ctx.moveTo(x - size / 2, y);
      ctx.lineTo(x + size / 2, y);
      ctx.stroke();
      break;
      
    case 'cross':
      ctx.lineWidth = size / 4;
      ctx.moveTo(x - size / 2, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.moveTo(x - size / 2, y + size / 2);
      ctx.lineTo(x + size / 2, y - size / 2);
      ctx.stroke();
      break;
      
    case 'diamond':
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y);
      ctx.lineTo(x, y + size / 2);
      ctx.lineTo(x - size / 2, y);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'ellipse':
      ctx.ellipse(x, y, size / 2, size / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'triangle':
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'hexagon':
      const hexSize = size / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const xPos = x + hexSize * Math.cos(angle);
        const yPos = y + hexSize * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.closePath();
      ctx.fill();
      break;
      
    case 'circle':
    default:
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  // Restore context state
  ctx.restore();
}

/**
 * Generate a preview of all available halftone shapes
 */
export function generateHalftoneShapesPreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Available shapes to preview
  const shapes: HalftoneShape[] = [
    'circle', 'square', 'diamond', 'line', 'cross', 'ellipse', 'triangle', 'hexagon'
  ];
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Calculate grid layout
  const cols = 4;
  const rows = Math.ceil(shapes.length / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  // Font settings
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  // Draw each shape
  for (let i = 0; i < shapes.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;
    
    // Draw shape
    ctx.fillStyle = '#000000';
    drawHalftoneShape(ctx, x, y, Math.min(cellWidth, cellHeight) * 0.6, shapes[i], 0);
    
    // Draw label
    ctx.fillText(shapes[i], x, y + cellHeight / 2 - 10);
  }
} 