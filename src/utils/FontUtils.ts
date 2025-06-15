/**
 * Font Utilities
 */

interface FontVariableAxis {
  tag: string;
  name: string;
  minValue: number;
  maxValue: number;
  defaultValue: number;
}

interface FontVariationSettings {
  min: number;
  max: number;
  default: number;
}

interface ExtendedFontFace extends FontFace {
  variations?: { [key: string]: FontVariationSettings };
}

export interface SystemFont {
  family: string;
  fullName: string;
  postscriptName?: string;
  style: string;
  weights: number[];  // Available font weights
}

export interface VariableAxis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
}

/**
 * Check if the Local Font Access API is available and has permission
 */
export async function isSystemFontsAvailable(): Promise<boolean> {
  try {
    // Check if the API exists
    if (!('queryLocalFonts' in window)) {
      console.error('Local Font Access API not available in this browser');
      return false;
    }

    console.log('Local Font Access API is available, checking permissions...');

    // Check if we have permission
    const permissionStatus = await (navigator as any).permissions.query({
      name: 'local-fonts'
    });

    console.log('Permission status:', permissionStatus.state);

    if (permissionStatus.state === 'granted') {
      return true;
    }

    if (permissionStatus.state === 'prompt') {
      try {
        // This will trigger the permission prompt
        console.log('Requesting permission for Local Font Access API...');
        await (window as any).queryLocalFonts();
        console.log('Permission granted successfully');
        return true;
      } catch (error) {
        console.error('Permission denied for Local Font Access API:', error);
        return false;
      }
    }

    console.warn('Permission not granted for Local Font Access API');
    return false;
  } catch (error) {
    console.error('Error checking Local Font Access API availability:', error);
    return false;
  }
}

/**
 * Get available system fonts using the Local Font Access API
 */
export async function getSystemFonts(): Promise<SystemFont[]> {
  try {
    // First check if we have or can get access
    const hasAccess = await isSystemFontsAvailable();
    if (!hasAccess) {
      console.error('No access to system fonts - API not available or permission denied');
      return [];
    }

    // Now we should have permission, try to query fonts
    const rawFonts = await (window as any).queryLocalFonts();
    if (!rawFonts || rawFonts.length === 0) {
      console.error('No system fonts found in query result');
      return [];
    }
    
    // Group fonts by family
    const fontMap = new Map<string, SystemFont>();
    
    // Process fonts sequentially to handle async operations
    for (const font of rawFonts) {
      try {
        const fontFamily = font.family;
        
        // If this font family already exists in our map, update it
        if (fontMap.has(fontFamily)) {
          const existingFont = fontMap.get(fontFamily)!;
          
          // Try to get weight from style name
          let weight = 400; // Default weight
          const style = font.style.toLowerCase();
          
          if (style.includes('bold')) weight = 700;
          else if (style.includes('light')) weight = 300;
          else if (style.includes('thin')) weight = 100;
          else if (style.includes('medium')) weight = 500;
          else if (style.includes('black')) weight = 900;
          else if (style.includes('regular') || style.includes('normal')) weight = 400;
          
          // Add the weight if it's not already in the list
          if (!existingFont.weights.includes(weight)) {
            existingFont.weights.push(weight);
            existingFont.weights.sort((a, b) => a - b); // Keep weights sorted
          }
          
        } else {
          // Create new font entry
          const fontInfo: SystemFont = {
            family: fontFamily,
            fullName: font.fullName,
            postscriptName: font.postscriptName,
            style: font.style,
            weights: []
          };
          
          // Get weight from style name
          let weight = 400; // Default weight
          const style = font.style.toLowerCase();
          
          if (style.includes('bold')) weight = 700;
          else if (style.includes('light')) weight = 300;
          else if (style.includes('thin')) weight = 100;
          else if (style.includes('medium')) weight = 500;
          else if (style.includes('black')) weight = 900;
          else if (style.includes('regular') || style.includes('normal')) weight = 400;
          
          fontInfo.weights.push(weight);
          fontMap.set(fontFamily, fontInfo);
        }
      } catch (error) {
        console.error(`Error processing font ${font.family}:`, error);
      }
    }

    const fonts = Array.from(fontMap.values());
    console.log('Successfully loaded system fonts:', fonts.length);
    return fonts;
  } catch (error) {
    console.error('Error getting system fonts:', error);
    return [];
  }
}

/**
 * Load a custom font from a file
 */
export async function loadCustomFont(file: File): Promise<{ family: string, url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) throw new Error('Failed to read font file');

        // Create a unique font family name
        const fontFamily = `custom-font-${Date.now()}`;
        
        // Create a blob URL for the font
        const blob = new Blob([arrayBuffer], { type: file.type });
        const url = URL.createObjectURL(blob);

        // Load the font
        const fontFace = new FontFace(fontFamily, `url(${url})`);
        await fontFace.load();
        document.fonts.add(fontFace);

        resolve({ family: fontFamily, url });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read font file'));
    reader.readAsArrayBuffer(file);
  });
}

// Common web-safe fonts with their typical weights
export const WEB_SAFE_FONTS = [
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