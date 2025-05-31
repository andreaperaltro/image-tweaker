import { saveAs } from 'file-saver';
import { DitherSettings } from '../components/DitherUtils';
import { HalftoneSettings } from '../components/Halftone';
import { ColorSettings } from '../components/ColorUtils';
import { ThresholdSettings } from '../components/ThresholdUtils';
import { GlitchSettings } from '../components/GlitchUtils';
import { GradientMapSettings } from '../components/GradientMapUtils';
import { GridSettings } from '../components/Grid';
import { BlurSettings, EffectInstance, MosaicShiftSettings, AsciiEffectSettings, TextEffectSettings } from '../types';
import { SliceShiftSettings } from '../components/SliceShift';
import { PosterizeSettings } from '../components/Posterize';
import { FindEdgesSettings } from '../components/FindEdges';
import { BlobSettings } from '../components/Blob';
import { PixelEffectSettings } from '../components/PixelEffect';
import { LinocutEffectSettings } from '../components/LinocutEffect';

export interface EffectSettings {
  ditherSettings?: DitherSettings;
  halftoneSettings?: HalftoneSettings;
  colorSettings?: ColorSettings;
  thresholdSettings?: ThresholdSettings;
  glitchSettings?: GlitchSettings;
  gradientMapSettings?: GradientMapSettings;
  gridSettings?: GridSettings;
  effectInstances?: EffectInstance[];
  blur?: BlurSettings;
  mosaicShiftSettings?: MosaicShiftSettings;
  sliceShiftSettings?: SliceShiftSettings;
  posterizeSettings?: PosterizeSettings;
  findEdgesSettings?: FindEdgesSettings;
  blobSettings?: BlobSettings;
  pixelSettings?: PixelEffectSettings;
  linocutSettings?: LinocutEffectSettings;
  instanceSettings?: {[id: string]: any};
  textEffectSettings?: TextEffectSettings;
}

export const saveEffectSettings = (settings: EffectSettings) => {
  const settingsJson = JSON.stringify(settings, null, 2);
  const blob = new Blob([settingsJson], { type: 'application/json' });
  saveAs(blob, 'image-tweaker-settings.json');
};

export const loadEffectSettings = (file: File): Promise<EffectSettings> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const settings = JSON.parse(event.target?.result as string);
        resolve(settings);
      } catch (error) {
        reject(new Error('Invalid settings file format'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}; 