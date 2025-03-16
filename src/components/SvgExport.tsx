/**
 * SVG Export Utility Functions
 * 
 * This module provides functionality for:
 * 1. Converting canvas to SVG
 * 2. Exporting SVG as a file
 */

import { saveAs } from 'file-saver';
import C2S from 'canvas2svg';

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
 * Converts a regular canvas to SVG format
 */
export function canvasToSvg(canvas: HTMLCanvasElement): string {
  const width = canvas.width;
  const height = canvas.height;
  
  // Create SVG context with the same dimensions
  const ctx = createSvgContext(width, height);
  
  // Draw the canvas content to the SVG context
  ctx.drawImage(canvas, 0, 0);
  
  // Get the SVG as a string
  return ctx.getSerializedSvg(true);
}

/**
 * Exports the canvas as an SVG file
 */
export function exportAsSvg(canvas: HTMLCanvasElement, filename: string = 'imagetweaker-export.svg'): void {
  // Convert the canvas to SVG
  const svgContent = canvasToSvg(canvas);
  
  // Create a blob with the SVG content
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  
  // Save the file using file-saver
  saveAs(blob, filename);
}

/**
 * Exports the canvas as a PNG file
 */
export function exportAsPng(canvas: HTMLCanvasElement, filename: string = 'imagetweaker-export.png'): void {
  // Convert the canvas to a data URL and download it
  const dataUrl = canvas.toDataURL('image/png');
  
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
  renderFunction: (ctx: CanvasRenderingContext2D) => void
): string {
  // Create an SVG context
  const ctx = createSvgContext(width, height);
  
  // Apply the render function to draw on the SVG context
  renderFunction(ctx as unknown as CanvasRenderingContext2D);
  
  // Get the SVG as a string
  return ctx.getSerializedSvg(true);
}

/**
 * Saves SVG string content to a file
 */
export function saveSvgString(svgString: string, filename: string = 'imagetweaker-export.svg'): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, filename);
} 