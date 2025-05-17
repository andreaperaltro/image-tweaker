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
import { HalftoneSettings, HalftoneShape, HalftoneArrangement, halftoneDotsStore } from './Halftone';
import { DitherSettings, DitherDotInfo, ditherDotsStore, DitherType, DitherColorMode } from './DitherUtils';

// Define a type for the dot parameter
interface DotParams {
  x: number;
  y: number;
  size: number;
  color?: string;
}

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
 * Add metadata to SVG
 */
export function addSvgMetadata(svg: string, metadata: Record<string, string>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return svg;
  }
  
  // Find the closing </svg> tag
  const closingTag = '</svg>';
  const closingTagIndex = svg.lastIndexOf(closingTag);
  
  if (closingTagIndex === -1) {
    return svg;
  }
  
  // Generate metadata XML
  let metadataXml = `  <metadata>\n    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" xmlns:dc="http://purl.org/dc/elements/1.1/">\n      <rdf:Description>\n`;
  
  // Add each piece of metadata
  for (const [key, value] of Object.entries(metadata)) {
    // Escape XML special characters
    const escapedValue = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
      
    metadataXml += `        <dc:${key}>${escapedValue}</dc:${key}>\n`;
  }
  
  // Add ImageTweaker creator info
  metadataXml += `        <dc:creator>ImageTweaker</dc:creator>\n`;
  metadataXml += `        <dc:description>Halftone image created with ImageTweaker</dc:description>\n`;
  
  // Group halftone parameters in a separate section for better organization
  metadataXml += `        <dc:halftoneSettings>\n`;
  
  // Add halftone specific settings with nicer formatting
  const halftoneParams = [
    'cellSize', 'dotScale', 'shape', 'pattern', 'sizeVariation', 
    'invertBrightness', 'colored', 'spiralTightness', 'spiralExpansion',
    'spiralRotation', 'spiralCenterX', 'spiralCenterY',
    'concentricRingSpacing', 'concentricCenterX', 'concentricCenterY'
  ];
  
  for (const param of halftoneParams) {
    if (metadata[param]) {
      metadataXml += `          <dc:${param}>${metadata[param]}</dc:${param}>\n`;
    }
  }
  
  metadataXml += `        </dc:halftoneSettings>\n`;
  metadataXml += `      </rdf:Description>\n    </rdf:RDF>\n  </metadata>\n`;
  
  // Insert metadata before closing tag
  return svg.slice(0, closingTagIndex) + metadataXml + svg.slice(closingTagIndex);
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
  // Generate a timestamp for the filename if not provided
  if (filename === 'imagetweaker-export.png') {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    filename = `imagetweaker-${dateStr}.png`;
  }

  // Create a temporary canvas to add metadata
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) return;
  
  // Draw the original canvas without adding timestamp text
  ctx.drawImage(canvas, 0, 0);
  
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
  const { shape } = settings;
  
  // Start building SVG
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  
  // Add a white background only if not transparent
  const backgroundEnabled = imageInfo.backgroundEnabled === 'true';
  const backgroundType = imageInfo.backgroundType || 'white';
  
  if (!backgroundEnabled || backgroundType !== 'transparent') {
    svg += `  <rect width="${width}" height="${height}" fill="white" />\n`;
  }
  
  // Helper function to add vector shapes
  function addVectorShape(x: number, y: number, size: number, shape: HalftoneShape, angle: number, fill?: string): string {
    // Make sure coordinates and size are valid numbers
    if (isNaN(x) || isNaN(y) || isNaN(size) || size <= 0) {
      return '';
    }
    
    // Don't round coordinates or size to ensure exact match with canvas
    const fx = x;
    const fy = y;
    const fsize = size;
    const fangle = angle;
    
    // Optional fill attribute
    const fillAttr = fill ? ` fill="${fill}"` : '';
    
    try {
      switch (shape) {
        case 'circle':
          return `    <circle cx="${fx}" cy="${fy}" r="${fsize/2}"${fillAttr} />\n`;
          
        case 'square':
          return `    <rect x="${fx - fsize/2}" y="${fy - fsize/2}" width="${fsize}" height="${fsize}" transform="rotate(${fangle} ${fx} ${fy})"${fillAttr} />\n`;
          
        case 'diamond':
          return `    <rect x="${fx - fsize/2}" y="${fy - fsize/2}" width="${fsize}" height="${fsize}" transform="rotate(45 ${fx} ${fy})"${fillAttr} />\n`;
          
        case 'line':
          return `    <line x1="${fx - fsize/2}" y1="${fy}" x2="${fx + fsize/2}" y2="${fy}" stroke-width="${fsize/4}" stroke="currentColor" transform="rotate(${fangle} ${fx} ${fy})"${fillAttr} />\n`;
          
        case 'cross':
          return `    <path d="M ${fx - fsize/2} ${fy} L ${fx + fsize/2} ${fy} M ${fx} ${fy - fsize/2} L ${fx} ${fy + fsize/2}" stroke-width="${fsize/4}" stroke="currentColor" transform="rotate(${fangle} ${fx} ${fy})"${fillAttr} />\n`;
          
        case 'ellipse':
          return `    <ellipse cx="${fx}" cy="${fy}" rx="${fsize/2}" ry="${fsize/4}" transform="rotate(${fangle} ${fx} ${fy})"${fillAttr} />\n`;
          
        case 'triangle':
          const h = fsize * Math.sqrt(3) / 2;
          return `    <polygon points="${fx},${fy - fsize/2} ${fx - fsize/2},${fy + h/2} ${fx + fsize/2},${fy + h/2}" transform="rotate(${fangle} ${fx} ${fy})"${fillAttr} />\n`;
          
        case 'hexagon':
          return `    <polygon points="${fx + fsize/2},${fy} ${fx + fsize/4},${fy + fsize*0.433} ${fx - fsize/4},${fy + fsize*0.433} ${fx - fsize/2},${fy} ${fx - fsize/4},${fy - fsize*0.433} ${fx + fsize/4},${fy - fsize*0.433}" transform="rotate(${fangle} ${fx} ${fy})"${fillAttr} />\n`;
          
        default:
          return `    <circle cx="${fx}" cy="${fy}" r="${fsize/2}"${fillAttr} />\n`;
      }
    } catch (error) {
      console.error(`Error creating shape: ${error}`);
      // Return a simple circle as fallback
      return `    <circle cx="${fx}" cy="${fy}" r="${fsize/2}"${fillAttr} />\n`;
    }
  }
  
  // Helper function to adjust point positions for different arrangements
  function adjustForArrangement(centerX: number, centerY: number, x: number, y: number, cellSize: number, arrangement: HalftoneArrangement): { x: number, y: number } {
    let adjustedX = centerX;
    let adjustedY = centerY;
    
    try {
      if (arrangement === 'hexagonal' && y % 2 === 0) {
        adjustedX += cellSize / 2;
      } else if (arrangement === 'spiral') {
        // Calculate center point with offset
        const spiralCenterX = width / 2 + (settings.spiralCenterX || 0);
        const spiralCenterY = height / 2 + (settings.spiralCenterY || 0);
        
        // Calculate distance and angle from the center point
        const dx = centerX - spiralCenterX;
        const dy = centerY - spiralCenterY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Get the angle to the center
        let angle = Math.atan2(dy, dx);
        
        // Add rotation offset (convert degrees to radians)
        const rotationRadians = (settings.spiralRotation || 0) * (Math.PI / 180);
        
        // Calculate spiral angle with expansion
        const expansion = settings.spiralExpansion || 1.0;
        const spiralAngle = angle + rotationRadians + (distanceFromCenter * (settings.spiralTightness || 0.1) * expansion / cellSize);
        
        // Place the dot on the calculated spiral
        adjustedX = spiralCenterX + Math.cos(spiralAngle) * distanceFromCenter;
        adjustedY = spiralCenterY + Math.sin(spiralAngle) * distanceFromCenter;
      } else if (arrangement === 'concentric') {
        // Calculate center point with offset
        const concentricCenterX = width / 2 + (settings.concentricCenterX || 0);
        const concentricCenterY = height / 2 + (settings.concentricCenterY || 0);
        
        // Calculate distance from the center point
        const dx = centerX - concentricCenterX;
        const dy = centerY - concentricCenterY;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle from center
        const angle = Math.atan2(dy, dx);
        
        // Adjust spacing with the concentricRingSpacing setting
        const ringSpacing = cellSize * (settings.concentricRingSpacing || 1);
        const ringNumber = Math.floor(distanceFromCenter / ringSpacing);
        
        // Quantize the distance to create distinct rings
        const quantizedDistance = ringNumber * ringSpacing;
        
        // Place the dot on the quantized circle
        adjustedX = concentricCenterX + Math.cos(angle) * quantizedDistance;
        adjustedY = concentricCenterY + Math.sin(angle) * quantizedDistance;
      } else if (arrangement === 'random') {
        // Use a seeded random to ensure consistent results
        const randomSeed = (x * 10000 + y) / (width * height);
        const randomOffset = Math.sin(randomSeed) * 0.5 + 0.5;
        adjustedX += (randomOffset - 0.5) * cellSize / 2;
        adjustedY += (Math.cos(randomSeed) - 0.5) * cellSize / 2;
      }
    } catch (error) {
      console.error("Error in adjustForArrangement:", error);
      // Return original coordinates if there's an error
      return { x: centerX, y: centerY };
    }
    
    return { x: adjustedX, y: adjustedY };
  }
  
  // Helper function to process each CMYK channel
  function processChannel(channel: 'c' | 'm' | 'y' | 'k', angle: number, cellSize: number, dotScaleFactor: number, invertBrightness: boolean): string {
    let channelSvg = '';
    
    // Use seeded random for consistency with canvas rendering
    const seedRandom = (x: number, y: number) => {
      const seed = (x * 9999 + y * 9973) % 10000;
      return Math.sin(seed) * 0.5 + 0.5;
    };
    
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
    
    // Calculate number of cells
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    
    // Pre-calculate all dots for better overall distribution
    type DotInfo = {
      x: number;
      y: number;
      size: number;
    };
    
    const dots: DotInfo[] = [];
    
    // First pass - collect all dot information
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        try {
          // Cell position
          const initialCenterX = Math.floor(x * cellSize + cellSize / 2);
          const initialCenterY = Math.floor(y * cellSize + cellSize / 2);
          
          // Adjust position based on arrangement
          const adjusted = adjustForArrangement(initialCenterX, initialCenterY, x, y, cellSize, settings.arrangement);
          const centerX = adjusted.x;
          const centerY = adjusted.y;
          
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
          if (invertBrightness) {
            value = 1 - value;
          }
          
          // Apply enhanced contrast curve to match canvas
          value = Math.pow(value, 1.35);
          
          // Apply size variation - use seeded random for consistency
          const randomValue = seedRandom(x, y);
          const sizeVariation = 1 + (randomValue - 0.5) * settings.sizeVariation;
          
          // More aggressive shape-specific scaling corrections to match canvas exactly
          const shapeScaleCorrection: Record<HalftoneShape, number> = {
            'circle': 1.0,    // Base reference
            'square': 0.85,   // Squares need to be smaller
            'diamond': 0.85,  // Diamonds need to be smaller
            'line': 1.0,      
            'cross': 1.0,
            'ellipse': 1.0,
            'triangle': 0.92, // Triangles need more adjustment
            'hexagon': 0.9    // Hexagons need more adjustment
          };
          
          // Apply shape-specific scaling correction
          const correctedDotScaleFactor = dotScaleFactor * (shapeScaleCorrection[shape] || 1.0);
          
          // Calculate max dot size with correction for shape
          const maxDotSize = cellSize * correctedDotScaleFactor * sizeVariation;
          
          // Calculate actual dot size
          const dotSize = maxDotSize * value;
          
          // Skip drawing dots that are too small
          if (dotSize < 0.5) continue;
          
          // Store the dot info
          dots.push({
            x: centerX,
            y: centerY,
            size: dotSize
          });
        } catch (error) {
          console.error("Error in processChannel:", error);
          // Skip this dot if there's an error
          continue;
        }
      }
    }
    
    // Sort dots by size to make sure larger dots are rendered first (behind smaller ones)
    dots.sort((a, b) => b.size - a.size);
    
    // Second pass - render the dots in order of size (largest first)
    for (const dot of dots as DotParams[]) {
      channelSvg += addVectorShape(dot.x, dot.y, dot.size, shape, angle);
    }
    
    return channelSvg;
  }
  
  try {
    // Check if we have stored dots from the canvas rendering - improved check
    if (halftoneDotsStore.dots.length > 0 && 
        halftoneDotsStore.width === width && 
        halftoneDotsStore.height === height) {
      
      console.log(`Using ${halftoneDotsStore.dots.length} stored dots for vector SVG`);
      
      // If we have CMYK channels, group them
      if (settings.enableCMYK && (settings.channels.cyan || settings.channels.magenta || settings.channels.yellow || settings.channels.black)) {
        // Group dots by color (channel)
        const cyan = halftoneDotsStore.dots.filter(dot => dot.color === 'cyan');
        const magenta = halftoneDotsStore.dots.filter(dot => dot.color === 'magenta');
        const yellow = halftoneDotsStore.dots.filter(dot => dot.color === 'yellow');
        const black = halftoneDotsStore.dots.filter(dot => dot.color === 'black');
        
        // Create group for each channel
        if (cyan.length > 0 && settings.channels.cyan) {
          svg += `  <g id="cyan-channel" fill="cyan" opacity="0.8">\n`;
          for (const dot of cyan) {
            // Use exact dot size from stored data without modifying it
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, settings.cmykAngles.cyan);
          }
          svg += `  </g>\n`;
        }
        
        if (magenta.length > 0 && settings.channels.magenta) {
          svg += `  <g id="magenta-channel" fill="magenta" opacity="0.8">\n`;
          for (const dot of magenta) {
            // Use exact dot size from stored data without modifying it
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, settings.cmykAngles.magenta);
          }
          svg += `  </g>\n`;
        }
        
        if (yellow.length > 0 && settings.channels.yellow) {
          svg += `  <g id="yellow-channel" fill="yellow" opacity="0.8">\n`;
          for (const dot of yellow) {
            // Use exact dot size from stored data without modifying it
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, settings.cmykAngles.yellow);
          }
          svg += `  </g>\n`;
        }
        
        if (black.length > 0 && settings.channels.black) {
          svg += `  <g id="black-channel" fill="black" opacity="0.9">\n`;
          for (const dot of black) {
            // Use exact dot size from stored data without modifying it
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, settings.cmykAngles.black);
          }
          svg += `  </g>\n`;
        }
      } else {
        // Standard halftone (B&W or colored)
        const groupFill = settings.colored ? "currentColor" : "black";
        svg += `  <g id="halftone-dots" fill="${groupFill}">\n`;
        
        // Sort dots by size (largest first) to match canvas rendering
        const sortedDots = [...halftoneDotsStore.dots].sort((a, b) => b.size - a.size);
        
        for (const dot of sortedDots) {
          // Use exact dot size from stored data without modifying it
          if (dot.color && settings.colored) {
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, 0, dot.color);
          } else {
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, 0);
          }
        }
        
        svg += `  </g>\n`;
      }
    } else {
      // Fallback to calculation method if no stored dots
      console.log("No stored dots available - calculating halftone pattern for SVG");
      
      const { cellSize, dotScaleFactor, arrangement, spiralTightness, enableCMYK, channels, cmykAngles, invertBrightness } = settings;
      
      // Calculate number of cells
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      
      // More aggressive shape-specific scaling corrections to match canvas exactly
      const shapeScaleCorrection: Record<HalftoneShape, number> = {
        'circle': 1.0,    // Base reference
        'square': 0.85,   // Squares need to be smaller
        'diamond': 0.85,  // Diamonds need to be smaller
        'line': 1.0,      
        'cross': 1.0,
        'ellipse': 1.0,
        'triangle': 0.92, // Triangles need more adjustment
        'hexagon': 0.9    // Hexagons need more adjustment
      };
      
      // Apply shape-specific scaling correction
      const correctedDotScaleFactor = dotScaleFactor * (shapeScaleCorrection[shape] || 1.0);
      
      // If CMYK mode is enabled
      if (enableCMYK && (channels.cyan || channels.magenta || channels.yellow || channels.black)) {
        // Create group for each channel
        if (channels.cyan) {
          svg += `  <g id="cyan-channel" fill="cyan" opacity="0.8">\n`;
          svg += processChannel('c', cmykAngles.cyan, cellSize, correctedDotScaleFactor, invertBrightness);
          svg += `  </g>\n`;
        }
        
        if (channels.magenta) {
          svg += `  <g id="magenta-channel" fill="magenta" opacity="0.8">\n`;
          svg += processChannel('m', cmykAngles.magenta, cellSize, correctedDotScaleFactor, invertBrightness);
          svg += `  </g>\n`;
        }
        
        if (channels.yellow) {
          svg += `  <g id="yellow-channel" fill="yellow" opacity="0.8">\n`;
          svg += processChannel('y', cmykAngles.yellow, cellSize, correctedDotScaleFactor, invertBrightness);
          svg += `  </g>\n`;
        }
        
        if (channels.black) {
          svg += `  <g id="black-channel" fill="black" opacity="0.9">\n`;
          svg += processChannel('k', cmykAngles.black, cellSize, correctedDotScaleFactor, invertBrightness);
          svg += `  </g>\n`;
        }
      } else {
        // Standard halftone (B&W or colored)
        const groupFill = settings.colored ? "currentColor" : "black";
        svg += `  <g id="halftone-dots" fill="${groupFill}">\n`;
        
        // Use a seeded random generator for consistency with the canvas rendering
        const seedRandom = (x: number, y: number) => {
          const seed = (x * 9999 + y * 9973) % 10000;
          return Math.sin(seed) * 0.5 + 0.5;
        };
        
        // Pre-calculate all dots for better overall distribution
        type DotInfo = {
          x: number;
          y: number;
          size: number;
          color?: string;
        };
        
        const dots: DotInfo[] = [];
        
        // First pass - collect all dot information
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            // Cell position - use exact matching with canvas
            const initialCenterX = Math.floor(x * cellSize + cellSize / 2);
            const initialCenterY = Math.floor(y * cellSize + cellSize / 2);
            
            // Apply arrangement adjustments
            const adjusted = adjustForArrangement(initialCenterX, initialCenterY, x, y, cellSize, arrangement);
            const centerX = adjusted.x;
            const centerY = adjusted.y;
            
            // Get the pixel at this position
            const pixelX = Math.min(width - 1, Math.max(0, Math.floor(centerX)));
            const pixelY = Math.min(height - 1, Math.max(0, Math.floor(centerY)));
            const pixelIndex = (pixelY * width + pixelX) * 4;
            
            // Get RGB values
            const r = imageData.data[pixelIndex];
            const g = imageData.data[pixelIndex + 1];
            const b = imageData.data[pixelIndex + 2];
            
            // Calculate brightness (0 to 1) - Use the EXACT same formula as in the canvas rendering
            let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            
            // For standard halftone, we want dark areas to have large dots
            if (!invertBrightness) {
              brightness = 1 - brightness;
            }
            
            // Apply a non-linear curve to better match canvas rendering
            // This makes dark areas darker and light areas lighter for more contrast
            brightness = Math.pow(brightness, 1.35);
            
            // Apply size variation with seeded random for consistency
            const randomValue = seedRandom(x, y);
            const sizeVariation = 1 + (randomValue - 0.5) * settings.sizeVariation;
            
            // Calculate max dot size with correction
            const maxDotSize = cellSize * correctedDotScaleFactor * sizeVariation;
            
            // Calculate actual dot size
            let dotSize = maxDotSize * brightness;
            
            // Skip drawing dots that are too small
            if (dotSize < 0.5) continue;
            
            // Store the dot info
            if (settings.colored) {
              dots.push({
                x: centerX,
                y: centerY,
                size: dotSize,
                color: `rgb(${r},${g},${b})`
              });
            } else {
              dots.push({
                x: centerX,
                y: centerY,
                size: dotSize
              });
            }
          }
        }
        
        // Sort dots by size to make sure larger dots are rendered first (behind smaller ones)
        // This creates a more accurate visual match with the canvas
        dots.sort((a, b) => b.size - a.size);
        
        // Second pass - render the dots in order of size (largest first)
        for (const dot of dots as DotParams[]) {
          if (dot.color) {
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, 0, dot.color);
          } else {
            svg += addVectorShape(dot.x, dot.y, dot.size, shape, 0);
          }
        }
        
        svg += `  </g>\n`;
      }
    }
  } catch (error) {
    console.error("Error generating SVG halftone:", error);
    // Return a minimal valid SVG with an error message
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white" />
  <text x="10" y="20" fill="red">Error generating SVG</text>
</svg>`;
  }
  
  // Close SVG tag
  svg += `</svg>`;
  
  // Add metadata
  return addSvgMetadata(svg, imageInfo);
}

/**
 * Creates a true vector-based SVG from the canvas content
 * Prioritizes halftone or dither effects if they were the last applied effects
 */
export function createVectorSvg(
  canvas: HTMLCanvasElement,
  imageInfo: Record<string, string> = {}
): string {
  const width = canvas.width;
  const height = canvas.height;
  
  // Get ImageData for potential backup conversions
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Cannot get canvas context');
  }
  
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Check for stored halftone dots first
  if (halftoneDotsStore.dots.length > 0 && halftoneDotsStore.settings) {
    console.log(`Using ${halftoneDotsStore.dots.length} stored dots for vector SVG`);
    
    // Use the halftone vector generation
    try {
      return createHalftoneVectorSvg(imageData, width, height, halftoneDotsStore.settings, imageInfo);
    } catch (error) {
      console.error('Error creating halftone vector SVG:', error);
      // Fall back to default SVG if halftone generation fails
    }
  }
  
  // Check for stored dither dots next
  if (ditherDotsStore.dots.length > 0 && ditherDotsStore.settings) {
    console.log(`Using ${ditherDotsStore.dots.length} stored dither dots for vector SVG`);
    
    // Use the dither vector generation
    try {
      return createDitherVectorSvg(imageData, width, height, ditherDotsStore.settings, imageInfo);
    } catch (error) {
      console.error('Error creating dither vector SVG:', error);
      // Fall back to default SVG if dither generation fails
    }
  }
  
  // If no specialized vector generation is available, return default SVG with embedded image
  return canvasToSvg(canvas, imageInfo);
}

/**
 * Create an SVG dithering pattern directly without using canvas
 * This creates true vector shapes for each dithered pixel, making it ideal for vector editing software
 */
export function createDitherVectorSvg(
  imageData: ImageData,
  width: number,
  height: number,
  settings: DitherSettings,
  imageInfo: Record<string, string> = {}
): string {
  // Start building SVG
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  
  // Add a white background
  const backgroundEnabled = imageInfo.backgroundEnabled === 'true';
  const backgroundType = imageInfo.backgroundType || 'white';
  
  if (!backgroundEnabled || backgroundType !== 'transparent') {
    svg += `  <rect width="${width}" height="${height}" fill="white" />\n`;
  }
  
  // Import the dots from the global store
  const { dots } = ditherDotsStore;
  
  if (!dots || dots.length === 0) {
    throw new Error('No dither dots available for SVG export');
  }
  
  // Group the dots by color for better SVG structure and smaller file size
  const dotsByColor: Record<string, Array<{x: number, y: number, size: number}>> = {};
  
  dots.forEach(dot => {
    const color = dot.color || 'black';
    if (!dotsByColor[color]) {
      dotsByColor[color] = [];
    }
    dotsByColor[color].push({
      x: dot.x,
      y: dot.y,
      size: dot.size
    });
  });
  
  // Add each color group
  Object.entries(dotsByColor).forEach(([color, colorDots]) => {
    // Start a group for this color
    svg += `  <g fill="${color}">\n`;
    
    // Add each rectangle (pixel) for this color
    colorDots.forEach(dot => {
      svg += `    <rect x="${dot.x}" y="${dot.y}" width="${dot.size}" height="${dot.size}" />\n`;
    });
    
    // Close the group
    svg += `  </g>\n`;
  });
  
  // Add metadata with dithering settings
  const metadataProps: Record<string, string> = {
    ...imageInfo,
    // Add dithering specific settings
    ditherType: settings.type || 'ordered',
    colorMode: settings.colorMode || 'grayscale',
    threshold: String(settings.threshold || 128),
    resolution: String(settings.resolution || 100),
    colorDepth: String(settings.colorDepth || 2)
  };
  
  // Format color settings if in 2-color mode
  if (settings.colorMode === '2-color') {
    metadataProps.darkColor = settings.darkColor || '#000000';
    metadataProps.lightColor = settings.lightColor || '#FFFFFF';
  }
  
  // Close the SVG
  svg += `</svg>`;
  
  // Add metadata
  return addSvgMetadata(svg, metadataProps);
}