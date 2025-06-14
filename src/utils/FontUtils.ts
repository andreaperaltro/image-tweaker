/**
 * Font Utilities
 */

interface SystemFont {
  family: string;
  fullName: string;
  postscriptName?: string;
  style: string;
}

/**
 * Get available system fonts using the Local Font Access API
 * @returns Promise<string[]> Array of font family names
 */
export async function getSystemFonts(): Promise<string[]> {
  try {
    // Check if the Local Font Access API is available
    if ('queryLocalFonts' in window) {
      const fonts = await (window as any).queryLocalFonts() as SystemFont[];
      // Get unique font family names
      const fontFamilies = new Set(fonts.map(font => font.family));
      return Array.from(fontFamilies).sort();
    }
    throw new Error('Local Font Access API not available');
  } catch (error) {
    console.warn('Could not access system fonts:', error);
    // Return default web-safe fonts if system fonts are not accessible
    return [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Courier New',
      'Georgia',
      'Verdana',
      'Trebuchet MS',
      'Impact',
      'Comic Sans MS'
    ];
  }
}

/**
 * Check if the Local Font Access API is available
 * @returns boolean
 */
export function isSystemFontsAvailable(): boolean {
  return 'queryLocalFonts' in window;
} 