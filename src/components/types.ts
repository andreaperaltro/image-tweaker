export interface ColorSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  invert: boolean;
  grayscale: boolean;
}

export interface DitherSettings {
  type: 'ordered' | 'floyd-steinberg';
  threshold: number;
  colorMode: 'grayscale' | 'color';
}

export interface GridSettings {
  enabled: boolean;
  cellSize: number;
  color: string;
  lineWidth: number;
} 