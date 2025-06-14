/**
 * Font Utilities
 */

export interface SystemFont {
  family: string;
  fullName: string;
  postscriptName?: string;
  style: string;
  variableAxes?: VariableAxis[];
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
      console.warn('Local Font Access API not available');
      return false;
    }

    // Check if we have permission
    const permissionStatus = await (navigator as any).permissions.query({
      name: 'local-fonts'
    });

    if (permissionStatus.state === 'granted') {
      return true;
    }

    if (permissionStatus.state === 'prompt') {
      try {
        // This will trigger the permission prompt
        await (window as any).queryLocalFonts();
        return true;
      } catch (error) {
        console.warn('Permission denied for Local Font Access API');
        return false;
      }
    }

    return false;
  } catch (error) {
    console.warn('Error checking Local Font Access API availability:', error);
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
      console.warn('No access to system fonts');
      return [];
    }

    // Now we should have permission, try to query fonts
    const rawFonts = await (window as any).queryLocalFonts();
    if (!rawFonts || rawFonts.length === 0) {
      console.warn('No system fonts found');
      return [];
    }
    
    // Group fonts by family
    const fontMap = new Map<string, SystemFont>();
    
    for (const font of rawFonts) {
      // Basic font info
      const fontInfo: SystemFont = {
        family: font.family,
        fullName: font.fullName,
        postscriptName: font.postscriptName,
        style: font.style,
        variableAxes: []
      };

      // Handle variable font axes if present
      if (font.tables && font.tables.fvar) {
        const axes = font.tables.fvar.axes;
        fontInfo.variableAxes = axes.map((axis: any) => ({
          tag: axis.tag,
          name: axis.name || axis.tag,
          min: axis.minValue,
          max: axis.maxValue,
          default: axis.defaultValue
        }));
      }

      // If this font family already exists, merge the axes
      if (fontMap.has(font.family)) {
        const existing = fontMap.get(font.family)!;
        if (fontInfo.variableAxes && fontInfo.variableAxes.length > 0) {
          existing.variableAxes = existing.variableAxes || [];
          for (const axis of fontInfo.variableAxes) {
            if (!existing.variableAxes.some(a => a.tag === axis.tag)) {
              existing.variableAxes.push(axis);
            }
          }
        }
      } else {
        fontMap.set(font.family, fontInfo);
      }
    }

    const fonts = Array.from(fontMap.values());
    console.log('Loaded system fonts:', fonts.length);
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

// Common web-safe fonts
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