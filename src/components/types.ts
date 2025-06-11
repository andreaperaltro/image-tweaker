export interface ColorSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  invert: boolean;
  grayscale: boolean;
}

export interface DitherSettings {
  enabled: boolean;
  type: 'ordered' | 'floyd-steinberg' | 'jarvis' | 'judice-ninke' | 'stucki' | 'burkes';
  threshold: number;
  colorMode: 'grayscale' | 'color' | '2-color';
  resolution: number; // 1-100, where 100 is full resolution
  colorDepth: number; // 2-256 colors
  darkColor: string;  // Color for dark areas when using 2-color mode
  lightColor: string; // Color for light areas when using 2-color mode
}

export interface GridSettings {
  enabled: boolean;
  cellSize: number;
  color: string;
  lineWidth: number;
} 