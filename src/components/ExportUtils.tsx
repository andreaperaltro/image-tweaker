/**
 * ExportUtils.tsx
 * Clean implementations of image export functions without timestamps in the image itself
 */

import { saveAs } from 'file-saver';

/**
 * Exports a canvas as a PNG file with the timestamp in the filename
 */
export function exportCanvasAsPng(canvas: HTMLCanvasElement): void {
  if (!canvas) return;
  
  // Create timestamp for filename
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `imagetweaker-${dateStr}.png`;

  // Create a temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) return;
  
  // Draw the original canvas without adding any timestamp text
  ctx.drawImage(canvas, 0, 0);
  
  // Convert to data URL and download
  try {
    tempCanvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, filename);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting PNG:', error);
  }
}

/**
 * Exports a canvas as an SVG file with the timestamp in the filename
 */
export function exportCanvasAsSvg(canvas: HTMLCanvasElement): void {
  if (!canvas) return;
  
  // Create timestamp for filename
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `imagetweaker-${dateStr}.svg`;

  // Create SVG content
  const width = canvas.width;
  const height = canvas.height;
  
  // Create simple SVG with the canvas content as an image
  const dataURL = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" xlink:href="${dataURL}" />
</svg>`;
  
  try {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting SVG:', error);
  }
} 