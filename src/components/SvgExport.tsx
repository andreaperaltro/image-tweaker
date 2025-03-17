/**
 * SVG Export Utility Functions
 * 
 * This module provides functionality for:
 * 1. Converting canvas to SVG
 * 2. Exporting SVG as a file
 * 3. Adding metadata and timestamps to exports
 * 4. Creating vector-based halftone patterns
 */

import { saveAs } from 'file-saver';
import C2S from 'canvas2svg';
import { HalftoneSettings, HalftoneShape } from './Halftone';

/**
 * Creates a Canvas2SVG context that can be used like a regular canvas context
 * but will generate SVG content
 */
export function createSvgContext(width: number, height: number): any {
  // The canvas2svg library returns a context that works like CanvasRenderingContext2D
  // but actually builds an SVG document
  return new C2S(width, height);
}

/**
 * Adds metadata to an SVG string
 */
export function addSvgMetadata(svgString: string, imageInfo: Record<string, string> = {}): string {
  // Create timestamp
  const now = new Date();
  const timestamp = now.toISOString();
  
  // Basic metadata
  const metadata = {
    creator: 'ImageTweaker',
    creationDate: timestamp,
    software: 'ImageTweaker v0.1.0',
    ...imageInfo
  };
  
  // Create metadata tags
  const metadataTags = Object.entries(metadata)
    .map(([key, value]) => `    <meta name="${key}" content="${value}" />`)
    .join('\n');
  
  // Add metadata section after the opening SVG tag
  return svgString.replace(
    '<svg',
    `<svg xmlns:metadata="http://www.w3.org/ns/metadata/"
     data-creation-date="${timestamp}"`
  ).replace(
    '</svg>',
    `  <metadata>
${metadataTags}
  </metadata>
</svg>`
  );
}

/**
 * Converts a regular canvas to SVG format
 */
export function canvasToSvg(canvas: HTMLCanvasElement, imageInfo: Record<string, string> = {}): string {
  const width = canvas.width;
  const height = canvas.height;
  
  // Create SVG context with the same dimensions
  const ctx = createSvgContext(width, height);
  
  // Draw the canvas content to the SVG context
  ctx.drawImage(canvas, 0, 0);
  
  // Get the SVG as a string and add metadata
  const svgString = ctx.getSerializedSvg(true);
  return addSvgMetadata(svgString, imageInfo);
}

/**
 * Exports the canvas as an SVG file
 */
export function exportAsSvg(
  canvas: HTMLCanvasElement, 
  filename: string = 'imagetweaker-export.svg',
  imageInfo: Record<string, string> = {}
): void {
  // Convert the canvas to SVG
  const svgContent = canvasToSvg(canvas, imageInfo);
  
  // Create a blob with the SVG content
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  
  // Save the file using file-saver
  saveAs(blob, filename);
}

/**
 * Exports the canvas as a PNG file with embedded metadata
 */
export function exportAsPng(
  canvas: HTMLCanvasElement, 
  filename: string = 'imagetweaker-export.png',
  imageInfo: Record<string, string> = {}
): void {
  // Create a temporary canvas to add metadata
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) return;
  
  // Draw the original canvas
  ctx.drawImage(canvas, 0, 0);
  
  // Add timestamp as small text in the bottom corner
  const timestamp = new Date().toISOString();
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(`Created: ${timestamp}`, 10, canvas.height - 10);
  
  // Convert the canvas to a data URL and download it
  const dataUrl = tempCanvas.toDataURL('image/png');
  
  // Remove the data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = dataUrl.split(',')[1];
  
  // Create a blob from the base64 data
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  const blob = new Blob(byteArrays, { type: 'image/png' });
  saveAs(blob, filename);
}

/**
 * Recreates an image on an SVG context with all the applied effects
 * 
 * This function is used when we need to generate an SVG with the same
 * effects that have been applied to a canvas. It accepts a render function
 * that should contain all the drawing logic.
 */
export function recreateImageAsSvg(
  width: number, 
  height: number, 
  renderFunction: (ctx: CanvasRenderingContext2D) => void,
  imageInfo: Record<string, string> = {}
): string {
  // Create an SVG context
  const ctx = createSvgContext(width, height);
  
  // Apply the render function to draw on the SVG context
  renderFunction(ctx as unknown as CanvasRenderingContext2D);
  
  // Get the SVG as a string and add metadata
  const svgString = ctx.getSerializedSvg(true);
  return addSvgMetadata(svgString, imageInfo);
}

/**
 * Saves SVG string content to a file
 */
export function saveSvgString(
  svgString: string, 
  filename: string = 'imagetweaker-export.svg',
  imageInfo: Record<string, string> = {}
): void {
  // Add metadata if it's not already there
  const svgWithMetadata = svgString.includes('<metadata>') 
    ? svgString 
    : addSvgMetadata(svgString, imageInfo);
    
  const blob = new Blob([svgWithMetadata], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, filename);
}

/**
 * Create an SVG halftone pattern directly without using canvas
 * This creates true vector shapes for each dot, making it ideal for vector editing software
 */
export function createHalftoneVectorSvg(
  imageData: ImageData,
  width: number,
  height: number,
  settings: HalftoneSettings,
  imageInfo: Record<string, string> = {}
): string {
  const { cellSize, dotScaleFactor, shape, arrangement, spiralTightness, enableCMYK, channels, cmykAngles } = settings;
  
  // Calculate number of cells
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  
  // Start building SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  
  // Add a white background
  svg += `  <rect width="${width}" height="${height}" fill="white" />\n`;
  
  // RGB to CMYK conversion for CMYK mode
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
  
  // If CMYK mode is enabled
  if (enableCMYK && (channels.cyan || channels.magenta || channels.yellow || channels.black)) {
    // Create group for each channel
    if (channels.cyan) {
      svg += `  <g id="cyan-channel" fill="cyan" opacity="0.8">\n`;
      processChannel('c', cmykAngles.cyan);
      svg += `  </g>\n`;
    }
    
    if (channels.magenta) {
      svg += `  <g id="magenta-channel" fill="magenta" opacity="0.8">\n`;
      processChannel('m', cmykAngles.magenta);
      svg += `  </g>\n`;
    }
    
    if (channels.yellow) {
      svg += `  <g id="yellow-channel" fill="yellow" opacity="0.8">\n`;
      processChannel('y', cmykAngles.yellow);
      svg += `  </g>\n`;
    }
    
    if (channels.black) {
      svg += `  <g id="black-channel" fill="black" opacity="0.9">\n`;
      processChannel('k', cmykAngles.black);
      svg += `  </g>\n`;
    }
  } else {
    // Standard halftone (B&W)
    svg += `  <g id="halftone-dots" fill="black">\n`;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Cell position
        let centerX = x * cellSize + cellSize / 2;
        let centerY = y * cellSize + cellSize / 2;
        
        // Apply arrangement adjustments
        centerX = adjustForArrangement(centerX, centerY, x, y).x;
        centerY = adjustForArrangement(centerX, centerY, x, y).y;
        
        // Get the pixel at this position
        const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
        const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
        const pixelIndex = (pixelY * width + pixelX) * 4;
        
        // Get RGB values
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        
        // Calculate brightness (0 to 1)
        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // For standard halftone, we want dark areas to have large dots
        if (!settings.invertBrightness) {
          brightness = 1 - brightness;
        }
        
        // Apply size variation
        const sizeVariation = 1 + (Math.random() - 0.5) * settings.sizeVariation;
        
        // Calculate max dot size
        const maxDotSize = cellSize * dotScaleFactor * sizeVariation;
        
        // Calculate actual dot size
        const dotSize = maxDotSize * brightness;
        
        // Skip drawing dots that are too small
        if (dotSize < 0.5) continue;
        
        // Add the vector shape
        svg += addVectorShape(centerX, centerY, dotSize, shape, 0);
      }
    }
    
    svg += `  </g>\n`;
  }
  
  // Close SVG tag
  svg += `</svg>`;
  
  // Add metadata
  return addSvgMetadata(svg, imageInfo);
  
  // Helper function to adjust point positions for different arrangements
  function adjustForArrangement(centerX: number, centerY: number, x: number, y: number): { x: number, y: number } {
    let adjustedX = centerX;
    let adjustedY = centerY;
    
    if (arrangement === 'hexagonal' && y % 2 === 0) {
      adjustedX += cellSize / 2;
    } else if (arrangement === 'spiral') {
      const dx = centerX - width / 2;
      const dy = centerY - height / 2;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      
      let angle = Math.atan2(dy, dx);
      const spiralAngle = angle + distanceFromCenter * spiralTightness / cellSize;
      
      adjustedX = width / 2 + Math.cos(spiralAngle) * distanceFromCenter;
      adjustedY = height / 2 + Math.sin(spiralAngle) * distanceFromCenter;
    } else if (arrangement === 'concentric') {
      const distance = Math.sqrt(Math.pow(centerX - width / 2, 2) + Math.pow(centerY - height / 2, 2));
      const rings = Math.floor(distance / cellSize);
      if (rings % 2 === 0) {
        adjustedX += cellSize / 4;
        adjustedY += cellSize / 4;
      }
    } else if (arrangement === 'random') {
      adjustedX += (Math.random() - 0.5) * cellSize / 2;
      adjustedY += (Math.random() - 0.5) * cellSize / 2;
    }
    
    return { x: adjustedX, y: adjustedY };
  }
  
  // Helper function to process each CMYK channel
  function processChannel(channel: 'c' | 'm' | 'y' | 'k', angle: number): void {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Cell position
        let centerX = x * cellSize + cellSize / 2;
        let centerY = y * cellSize + cellSize / 2;
        
        // Adjust position based on arrangement
        const adjusted = adjustForArrangement(centerX, centerY, x, y);
        centerX = adjusted.x;
        centerY = adjusted.y;
        
        // Get the pixel at this position
        const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
        const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
        const pixelIndex = (pixelY * width + pixelX) * 4;
        
        // Get RGB values
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        
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
        const maxDotSize = cellSize * dotScaleFactor * sizeVariation;
        
        // Calculate actual dot size
        const dotSize = maxDotSize * value;
        
        // Skip drawing dots that are too small
        if (dotSize < 0.5) continue;
        
        // Add the vector shape
        svg += addVectorShape(centerX, centerY, dotSize, shape, angle);
      }
    }
  }
  
  // Helper function to add vector shapes
  function addVectorShape(x: number, y: number, size: number, shape: HalftoneShape, angle: number): string {
    switch (shape) {
      case 'circle':
        return `    <circle cx="${x}" cy="${y}" r="${size/2}" />\n`;
        
      case 'square':
        return `    <rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" transform="rotate(${angle} ${x} ${y})" />\n`;
        
      case 'diamond':
        return `    <rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}" transform="rotate(45 ${x} ${y}) rotate(${angle} ${x} ${y})" />\n`;
        
      case 'line':
        return `    <line x1="${x - size/2}" y1="${y}" x2="${x + size/2}" y2="${y}" stroke="currentColor" stroke-width="${size/4}" transform="rotate(${angle} ${x} ${y})" />\n`;
        
      case 'cross':
        return `    <path d="M ${x - size/2} ${y} L ${x + size/2} ${y} M ${x} ${y - size/2} L ${x} ${y + size/2}" stroke="currentColor" stroke-width="${size/4}" transform="rotate(${angle} ${x} ${y})" />\n`;
        
      case 'ellipse':
        return `    <ellipse cx="${x}" cy="${y}" rx="${size/2}" ry="${size/4}" transform="rotate(${angle} ${x} ${y})" />\n`;
        
      case 'triangle':
        const h = size * Math.sqrt(3) / 2;
        return `    <polygon points="${x},${y - size/2} ${x - size/2},${y + h/2} ${x + size/2},${y + h/2}" transform="rotate(${angle} ${x} ${y})" />\n`;
        
      case 'hexagon':
        return `    <polygon points="${x + size/2},${y} ${x + size/4},${y + size*0.433} ${x - size/4},${y + size*0.433} ${x - size/2},${y} ${x - size/4},${y - size*0.433} ${x + size/4},${y - size*0.433}" transform="rotate(${angle} ${x} ${y})" />\n`;
        
      default:
        return `    <circle cx="${x}" cy="${y}" r="${size/2}" />\n`;
    }
  }
}

/**
 * Creates a true vector-based SVG from the canvas content
 * This uses image tracing to convert the canvas content to vector paths
 */
export function createVectorSvg(
  canvas: HTMLCanvasElement,
  imageInfo: Record<string, string> = {}
): string {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Error: Could not get canvas context</text></svg>';
  }
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Start building SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  
  // Add a white background
  svg += `  <rect width="${width}" height="${height}" fill="white" />\n`;
  
  // Detect and create vector paths for different color regions
  // This is a simplified version - we'll use color quantization to reduce colors
  
  // Quantize the colors (reduce to a manageable number)
  const maxColors = 32; // Maximum number of colors to use
  const colorMap = quantizeColors(imageData, maxColors);
  
  // Create paths for each color
  for (const [colorStr, pixels] of Object.entries(colorMap)) {
    // Skip colors with very few pixels (likely noise)
    if (pixels.length < 10) continue;
    
    // Group adjacent pixels into regions
    const regions = createRegions(pixels, width, height);
    
    // Create path for each region
    for (const region of regions) {
      const path = createSvgPath(region);
      svg += `  <path d="${path}" fill="${colorStr}" />\n`;
    }
  }
  
  // Close SVG tag
  svg += `</svg>`;
  
  // Add metadata
  return addSvgMetadata(svg, imageInfo);
  
  // Helper function to quantize colors in the image
  function quantizeColors(imageData: ImageData, maxColors: number): Record<string, Array<{x: number, y: number}>> {
    const colorMap: Record<string, Array<{x: number, y: number}>> = {};
    const data = imageData.data;
    const width = imageData.width;
    const colorStep = Math.ceil(256 / Math.cbrt(maxColors));
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Quantize by rounding to nearest multiple of colorStep
        const r = Math.round(data[i] / colorStep) * colorStep;
        const g = Math.round(data[i + 1] / colorStep) * colorStep;
        const b = Math.round(data[i + 2] / colorStep) * colorStep;
        const a = data[i + 3];
        
        // Skip fully transparent pixels
        if (a < 10) continue;
        
        // Create color string
        const colorStr = `rgba(${r},${g},${b},${a/255})`;
        
        // Add pixel to color map
        if (!colorMap[colorStr]) {
          colorMap[colorStr] = [];
        }
        colorMap[colorStr].push({x, y});
      }
    }
    
    return colorMap;
  }
  
  // Helper function to group adjacent pixels into regions
  function createRegions(pixels: Array<{x: number, y: number}>, width: number, height: number): Array<Array<{x: number, y: number}>> {
    // A simple way to create regions is to use a grid approach
    const cellSize = 4;  // Size of each cell in the grid
    const regions: Array<Array<{x: number, y: number}>> = [];
    
    // Group pixels by their cell coordinates
    const cellMap: Record<string, Array<{x: number, y: number}>> = {};
    
    for (const pixel of pixels) {
      const cellX = Math.floor(pixel.x / cellSize);
      const cellY = Math.floor(pixel.y / cellSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!cellMap[cellKey]) {
        cellMap[cellKey] = [];
      }
      cellMap[cellKey].push(pixel);
    }
    
    // Add each cell as a region
    for (const cellPixels of Object.values(cellMap)) {
      regions.push(cellPixels);
    }
    
    return regions;
  }
  
  // Helper function to create an SVG path from a region of pixels
  function createSvgPath(region: Array<{x: number, y: number}>): string {
    // For simplicity, we'll just create a rectangle for each region
    // A more advanced approach would use an actual path tracing algorithm
    
    if (region.length === 0) return '';
    
    // Find the bounding box of the region
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    
    for (const pixel of region) {
      minX = Math.min(minX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxX = Math.max(maxX, pixel.x);
      maxY = Math.max(maxY, pixel.y);
    }
    
    // Create a simple rectangle path
    return `M${minX},${minY} H${maxX} V${maxY} H${minX} Z`;
  }
}

/**
 * Exports the canvas as a true vector SVG file
 * Uses createVectorSvg for true vector paths
 */
export function exportAsVectorSvg(
  canvas: HTMLCanvasElement, 
  filename: string = 'imagetweaker-vector-export.svg',
  imageInfo: Record<string, string> = {}
): void {
  // Convert the canvas to vector SVG
  const svgContent = createVectorSvg(canvas, imageInfo);
  
  // Create a blob with the SVG content
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  
  // Save the file using file-saver
  saveAs(blob, filename);
} 