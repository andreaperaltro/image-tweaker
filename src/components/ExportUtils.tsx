/**
 * ExportUtils.tsx
 * Clean implementations of image export functions without timestamps in the image itself
 */

import { saveAs } from 'file-saver';
import { addPngMetadata } from '../utils/PngMetadata';

/**
 * Exports a canvas as a PNG file with the timestamp in the filename
 */
export function exportCanvasAsPng(canvas: HTMLCanvasElement): void {
  if (!canvas) return;
  
  // Create timestamp for filename
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `imagetweaker-${dateStr}.png`;

  // Use the canvas toBlob method directly
  try {
    canvas.toBlob(async (blob) => {
      if (blob) {
        // Add metadata to the PNG
        const metadata = {
          'Software': 'ImageTweaker v0.2.0',
          'Author': 'ImageTweaker realized by andreaperato.com',
          'Website': 'https://image-tweaker.vercel.app/'
        };
        
        try {
          // Add metadata to the PNG
          const metaBlob = await addPngMetadata(blob, metadata);
          // Save the PNG with metadata
          saveAs(metaBlob, filename);
        } catch (metaError) {
          console.error('Error adding metadata:', metaError);
          // Fall back to saving without metadata if there's an error
          saveAs(blob, filename);
        }
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
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>ImageTweaker Export</dc:title>
        <dc:creator>ImageTweaker realized by andreaperato.com</dc:creator>
        <dc:source>https://image-tweaker.vercel.app/</dc:source>
        <dc:date>${new Date().toISOString()}</dc:date>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
</svg>`;
  
  try {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting SVG:', error);
  }
} 