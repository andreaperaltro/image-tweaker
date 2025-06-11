import { 
  ColorAdjustmentSettings,
  GradientMapSettings,
  GlitchSettings,
  HalftoneSettings,
  GridSettings,
  DitherSettings,
  BlurSettings
} from '../types';
import { applyBlur } from './BlurUtils';
import { applyDithering } from './DitherUtils';

export const processImage = (
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
    blur: BlurSettings;
  }
) => {
  // Create a temporary canvas for source image
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;
  
  // Copy the current state to the source canvas
  sourceCtx.drawImage(ctx.canvas, 0, 0);

  // Apply dithering effect
  if (settings.dither.enabled) {
    applyDithering(ctx, sourceCanvas, width, height, settings.dither);
  }

  // Apply blur effects
  applyBlur(ctx, width, height, settings.blur);
}; 