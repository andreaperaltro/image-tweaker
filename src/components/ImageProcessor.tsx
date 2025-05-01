import { 
  ColorAdjustmentSettings,
  GradientMapSettings,
  GlitchSettings,
  HalftoneSettings,
  GridSettings,
  DitherSettings,
  TextDitherSettings,
  BlurSettings
} from '../types';
import { applyBlur } from './BlurUtils';

const processImage = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: {
    colorAdjustment: ColorAdjustmentSettings;
    gradientMap: GradientMapSettings;
    glitch: GlitchSettings;
    halftone: HalftoneSettings;
    grid: GridSettings;
    dither: DitherSettings;
    textDither: TextDitherSettings;
    blur: BlurSettings;
  }
) => {
  // ... existing processing code ...

  // Apply blur effects
  applyBlur(ctx, width, height, settings.blur);

  // ... existing code ...
}; 