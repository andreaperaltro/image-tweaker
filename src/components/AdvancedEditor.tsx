'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ColorSettings, applyColorAdjustments, BlendMode } from './ColorUtils'
import { GridSettings, GridCell, createGrid, renderGridCell } from './Grid'
import { HalftoneSettings, HalftoneArrangement, HalftoneShape, applyHalftone } from './Halftone'
import { exportAsPng, exportAsSvg } from './SvgExport'
import { exportCanvasAsPng, exportCanvasAsSvg, isVectorExportAvailable } from './ExportUtils'
import { GlitchSettings, applyGlitch } from './GlitchUtils'
import { applyDithering, DitherSettings, DitherType, DitherColorMode } from '../components/DitherUtils'
import { TextDitherSettings, applyTextDither } from './TextDitherUtils'
import { ThresholdSettings, ThresholdMode, applyThreshold } from './ThresholdUtils'
import CropEditor from './CropEditor'
import { GradientMapSettings, applyGradientMap, GradientMapBlendMode, GradientStop } from './GradientMapUtils'
import { saveAs } from 'file-saver'
import MobileControls from './MobileControls'
import { BlurSettings } from '../types'
import { applyBlur } from './BlurUtils'
import { EffectSettings, saveEffectSettings } from '../utils/EffectSettingsUtils'
import { FiUpload, FiShuffle, FiTrash, FiRefreshCw, FiSave, FiFolder, FiImage, FiFileText, FiDownload, FiCrop } from 'react-icons/fi'
import { EffectInstance } from '../types'
import { applyMosaicShift, MosaicShiftSettings } from './MosaicShift'
import { applySliceShift, SliceShiftSettings } from './SliceShift'
import { applyPosterize, PosterizeSettings } from './Posterize'
import { applyFindEdges, FindEdgesSettings } from './FindEdges'
import { applyBlob, BlobSettings } from './Blob'
import { Keyframe, EasingType } from '../types/animations'
import { useAnimation } from '../hooks/useAnimation'
import { getSettingsAtTime } from '../utils/animation'
import { exportVideo, downloadVideo } from '../utils/videoExport'
import AnimationTimeline from './AnimationTimeline'
import { nanoid } from 'nanoid'
import { drawCoverImage } from '../utils/imageUtils'
import Slider from './Slider'
import { applyGlow } from './GlowUtils'

// Define types
type AspectRatioPreset = '1:1' | '4:3' | '16:9' | '3:2' | '5:4' | '2:1' | '3:4' | '9:16' | '2:3' | '4:5' | '1:2' | 'custom';
type Orientation = 'landscape' | 'portrait';

interface AdvancedEditorProps {
  blur: BlurSettings;
  onBlurChange: (settings: BlurSettings) => void;
}

interface MobileControlsProps {
  ditherSettings: DitherSettings;
  halftoneSettings: HalftoneSettings;
  colorSettings: ColorSettings;
  thresholdSettings: ThresholdSettings;
  glitchSettings: GlitchSettings;
  textDitherSettings: TextDitherSettings;
  gradientMapSettings: GradientMapSettings;
  gridSettings: GridSettings;
  effectInstances: EffectInstance[];
  instanceSettings: {[id: string]: any};
  updateDitherSettings: (settings: Partial<DitherSettings>) => void;
  updateHalftoneSettings: (setting: keyof HalftoneSettings, value: any) => void;
  updateColorSettings: (setting: keyof ColorSettings, value: any) => void;
  updateThresholdSettings: (settings: Partial<ThresholdSettings>) => void;
  updateGlitchSettings: (settings: Partial<GlitchSettings>) => void;
  updateTextDitherSettings: (settings: Partial<TextDitherSettings>) => void;
  updateGradientMapSettings: (settings: Partial<GradientMapSettings>) => void;
  updateGridSettings: (setting: keyof GridSettings, value: any) => void;
  updateInstanceSettings: (id: string, settings: any) => void;
  updateEffectInstances: (instances: EffectInstance[]) => void;
  addEffect: (type: string) => void;
  duplicateEffect: (id: string) => void;
  removeEffect: (id: string) => void;
  onResetImage: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onCropImage: () => void;
  blur: BlurSettings;
  onBlurChange: (settings: BlurSettings) => void;
  onSettingsLoaded: (settings: EffectSettings) => void;
  mosaicShiftSettings: MosaicShiftSettings;
  updateMosaicShiftSettings: (settings: Partial<MosaicShiftSettings>) => void;
  sliceShiftSettings: SliceShiftSettings;
  updateSliceShiftSettings: (settings: Partial<SliceShiftSettings>) => void;
  posterizeSettings: PosterizeSettings;
  updatePosterizeSettings: (settings: Partial<PosterizeSettings>) => void;
  findEdgesSettings: FindEdgesSettings;
  updateFindEdgesSettings: (settings: Partial<FindEdgesSettings>) => void;
}

export default function AdvancedEditor({
  blur,
  onBlurChange,
}: AdvancedEditorProps) {
  // Canvas and image states
  const [image, setImage] = useState<string | null>(null);
  const [originalImageDataRef, setOriginalImageDataRef] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Internal buffer canvas for intermediate processing
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Canvas dimension states
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('4:3');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [lockRatio, setLockRatio] = useState(true);
  const [autoCanvasSize, setAutoCanvasSize] = useState(false);

  // Color adjustment states
  const [colorSettings, setColorSettings] = useState<ColorSettings>({
    enabled: false,
    hueShift: 0,
    saturation: 100,
    brightness: 100,
    contrast: 100,
    posterize: 0,
    invert: false,
    glitchIntensity: 0,
    glitchSeed: Math.random(),
    blendMode: 'normal'
  });
  
  // Halftone settings
  const [halftoneSettings, setHalftoneSettings] = useState<HalftoneSettings>({
    enabled: false,
    cellSize: 8,
    mix: 100,
    colored: false,
    enableCMYK: false,
    arrangement: 'grid' as HalftoneArrangement,
    shape: 'circle' as HalftoneShape,
    angleOffset: 0,
    sizeVariation: 0,
    dotScaleFactor: 0.8,
    invertBrightness: false,
    spiralTightness: 0.1,
    spiralExpansion: 1.0,
    spiralRotation: 0,
    spiralCenterX: 0,
    spiralCenterY: 0,
    concentricCenterX: 0,
    concentricCenterY: 0,
    concentricRingSpacing: 1.0,
    channels: {
      cyan: true,
      magenta: true,
      yellow: true,
      black: true
    },
    cmykAngles: {
      cyan: 15,
      magenta: 75,
      yellow: 0,
      black: 45
    }
  });
  
  // Grid settings
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    enabled: false,
    columns: 3,
    rows: 3,
    applyRotation: false,
    maxRotation: 10,
    splitEnabled: false,
    splitProbability: 0.5,
    maxSplitLevels: 2,
    minCellSize: 50
  });

  // Dither settings
  const [ditherSettings, setDitherSettings] = useState<DitherSettings>({
    enabled: false,
    type: 'floyd-steinberg',
    threshold: 128,
    colorMode: 'grayscale',
    resolution: 30,
    colorDepth: 2,
    darkColor: '#000000',
    lightColor: '#FFFFFF'
  });

  const [textDitherSettings, setTextDitherSettings] = useState<TextDitherSettings>({
    enabled: false,
    text: 'MATRIX',
    fontSize: 12,
    fontFamily: 'monospace',
    colorMode: 'monochrome' as 'monochrome',
    contrast: 1,
    brightness: 0.5,
    invert: false,
    resolution: 2
  });

  // Threshold settings
  const [thresholdSettings, setThresholdSettings] = useState<ThresholdSettings>({
    enabled: false,
    mode: 'solid',
    threshold: 128,
    // Solid colors
    darkColor: '#000000',
    lightColor: '#FFFFFF',
    // Gradient colors
    darkColorStart: '#000000',
    darkColorEnd: '#000066',
    lightColorStart: '#FFFFFF',
    lightColorEnd: '#FFFF66'
  });

  // Gradient map settings
  const [gradientMapSettings, setGradientMapSettings] = useState<GradientMapSettings>({
    enabled: false,
    stops: [
      { position: 0, color: '#000000' },
      { position: 50, color: '#ff0000' },
      { position: 100, color: '#ffffff' }
    ],
    blendMode: 'normal',
    opacity: 1
  });

  // Effects instances instead of simple order array
  const [effectInstances, setEffectInstances] = useState<EffectInstance[]>([]);
  
  // NEW: Store instance-specific settings
  const [instanceSettings, setInstanceSettings] = useState<{[id: string]: any}>({});

  // Glitch settings
  const [glitchSettings, setGlitchSettings] = useState<GlitchSettings>({
    masterEnabled: false,
    enabled: false,
    glitchIntensity: 50,
    glitchDensity: 50,
    glitchDirection: 'horizontal' as 'horizontal' | 'vertical' | 'both',
    glitchSize: 10,  // Default size value
    
    // Pixel sorting
    pixelSortingEnabled: false,
    pixelSortingThreshold: 0.5,
    pixelSortingDirection: 'horizontal' as 'horizontal' | 'vertical' | 'both',
    
    // Channel shift
    channelShiftEnabled: false,
    channelShiftAmount: 1,
    channelShiftMode: 'rgb' as 'rgb' | 'rb' | 'rg' | 'gb',
    
    // Scan lines
    scanLinesEnabled: false,
    scanLinesCount: 20,
    scanLinesIntensity: 50,
    scanLinesDirection: 'horizontal' as 'horizontal' | 'vertical' | 'both',
    
    // Noise
    noiseEnabled: false,
    noiseAmount: 20,
    
    // Blocks
    blocksEnabled: false,
    blocksSize: 20,
    blocksOffset: 10,
    blocksDensity: 20
  });

  const [isCropping, setIsCropping] = useState(false);
  const [cropImageData, setCropImageData] = useState<string | null>(null);

  // Add the ref and handler functions at the top of the component
  const saveButtonRef = React.useRef<HTMLInputElement>(null);

  // MosaicShift settings
  const [mosaicShiftSettings, setMosaicShiftSettings] = useState<MosaicShiftSettings>({
    enabled: false,
    columns: 8,
    rows: 8,
    maxOffsetX: 50,
    maxOffsetY: 50,
    pattern: 'random',
    intensity: 50,
    seed: Math.random() * 1000,
    preserveEdges: true,
    randomRotation: false,
    maxRotation: 15,
    backgroundColor: '#000000',
    useBackgroundColor: false
  });

  // SliceShift settings
  const [sliceShiftSettings, setSliceShiftSettings] = useState<SliceShiftSettings>({
    enabled: false,
    slices: 40,
    direction: 'vertical',
    maxOffset: 20,
    mode: 'random',
    intensity: 50,
    seed: Math.random() * 1000,
    feathering: false,
    featherAmount: 20,
    rearrangeMode: 'random',
    backgroundColor: '#000000',
    useBackgroundColor: false
  });

  // Add state for new effects
  const [posterizeSettings, setPosterizeSettings] = useState<PosterizeSettings>({
    enabled: false,
    levels: 2,
    colorMode: 'rgb',
    preserveLuminance: true,
    dithering: false,
    ditherAmount: 50
  });

  // Find Edges settings
  const [findEdgesSettings, setFindEdgesSettings] = useState<FindEdgesSettings>({
    enabled: false,
    algorithm: 'sobel',
    intensity: 50,
    threshold: 128,
    invert: false,
    colorMode: 'grayscale',
    blurRadius: 0
  });

  // Add Blob settings state
  const [blobSettings, setBlobSettings] = useState<BlobSettings>({
    enabled: false,
    cellSize: 8,
    mix: 100,
    colored: false,
    arrangement: 'grid',
    shape: 'circle',
    connectionType: 'straight',
    connectionStrength: 2,
    connectionColor: '#000000',
    minDistance: 10,
    maxDistance: 50,
    angleOffset: 0,
    sizeVariation: 0,
    dotScaleFactor: 0.8,
    invertBrightness: false
  });

  // Animation state for keyframes
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'complete'>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(5); // Changed back to 5 seconds
  
  // Add a ref to store the current image URL to prevent regenerating on effect change
  const currentImageUrlRef = useRef<string | null>(null);
  
  // Define VideoExportOptions type to match the imported type
  interface VideoExportOptions {
    fps: number;
    duration: number;
    width: number;
    height: number;
    quality: number;
    format: "mp4" | "webm" | undefined;
  }

  // Add a cache for the loaded image
  const imageInstanceRef = useRef<HTMLImageElement | null>(null);
  
  // Only generate crop data when needed
  const [shouldGenerateCropData, setShouldGenerateCropData] = useState(false);
  
  // Add loading indicator
  const [imageLoading, setImageLoading] = useState(false);
  
  // Define a proper type for our effect cache
  type EffectCache = {
    effects: { [id: string]: HTMLCanvasElement | null };
    lastWidth?: number;
    lastHeight?: number;
  };
  
  // Cache for effect results to avoid reprocessing 
  const effectResultsCache = useRef<EffectCache>({
    effects: {}
  });
  
  // Flag to prevent multiple simultaneous processing
  const isProcessingRef = useRef(false);
  
  // Preload image when originalImageDataRef changes
  useEffect(() => {
    if (!originalImageDataRef) return;
    
    setImageLoading(true);
    
    const img = new Image();
    img.onload = () => {
      imageInstanceRef.current = img;
      setImageLoading(false);
      
      // Trigger processing once the image is loaded
      requestAnimationFrame(() => {
        processImage();
      });
    };
    img.src = originalImageDataRef;
  }, [originalImageDataRef]);
  
  // Define processImage
  const processImage = useCallback(() => {
    // Prevent multiple simultaneous processing requests
    if (isProcessingRef.current || !canvasRef.current || !sourceCanvasRef.current) return;
    
    // Set flags
    isProcessingRef.current = true;
    setProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const sourceCanvas = sourceCanvasRef.current;
      const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx || !sourceCtx) {
        return;
      }
      
      // Set canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      sourceCanvas.width = canvasWidth;
      sourceCanvas.height = canvasHeight;
      
      // Function to actually render the image
      const performRendering = () => {
        // Clear canvases
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Load the image
        const img = new Image();
        let hasFinishedLoading = false;
        
        img.onload = () => {
          // Draw original image to source canvas
          sourceCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          
          // Get enabled effects only
          const enabledEffects = effectInstances.filter(instance => instance.enabled);
          
          // If no effects are enabled, just draw the original image
          if (enabledEffects.length === 0) {
            ctx.drawImage(sourceCanvas, 0, 0);
            
            // Set flags
            hasFinishedLoading = true;
            isProcessingRef.current = false;
            setProcessing(false);
            
            // Update crop data if needed
            if (shouldGenerateCropData) {
              setCropImageData(canvas.toDataURL());
              setShouldGenerateCropData(false);
            }
            
            return;
          }
          
          // Define maximum number of effects to process at once to prevent memory issues
          // Increase this number if performance allows
          const MAX_EFFECTS = 10;
          const effectsToProcess = enabledEffects.slice(0, MAX_EFFECTS);
          
          if (enabledEffects.length > MAX_EFFECTS) {
            console.warn(`Too many effects active (${enabledEffects.length}). Limiting to ${MAX_EFFECTS} effects.`);
          }
          
          // Process each effect, fast path for the simple case
          if (effectsToProcess.length === 1) {
            // Just one effect, simplify processing
            const instance = effectsToProcess[0];
            const settings = getInstanceSettings(instance);
            
            // Apply the effect directly
            applyEffectDirectly(instance.type, sourceCtx, sourceCanvas, settings);
            
            // Copy result to main canvas
            ctx.drawImage(sourceCanvas, 0, 0);
          } else {
            // Multiple effects - process in sequence
            // Create two temporary canvases to swap between for effect processing
            const tempCanvas1 = document.createElement('canvas');
            tempCanvas1.width = canvasWidth;
            tempCanvas1.height = canvasHeight;
            const tempCtx1 = tempCanvas1.getContext('2d', { willReadFrequently: true });
            
            const tempCanvas2 = document.createElement('canvas');
            tempCanvas2.width = canvasWidth;
            tempCanvas2.height = canvasHeight;
            const tempCtx2 = tempCanvas2.getContext('2d', { willReadFrequently: true });
            
            if (!tempCtx1 || !tempCtx2) {
              // Fallback if we can't get temp contexts
              ctx.drawImage(sourceCanvas, 0, 0);
            } else {
              // First, copy the source canvas to the first temp canvas
              tempCtx1.clearRect(0, 0, canvasWidth, canvasHeight);
              tempCtx1.drawImage(sourceCanvas, 0, 0);
              
              // Process each effect sequentially
              effectsToProcess.forEach((instance, index) => {
                const settings = getInstanceSettings(instance);
                const isLast = index === effectsToProcess.length - 1;
                
                // Determine source and destination contexts for this iteration
                const srcCanvas = index % 2 === 0 ? tempCanvas1 : tempCanvas2;
                const destCanvas = index % 2 === 0 ? tempCanvas2 : tempCanvas1;
                const destCtx = index % 2 === 0 ? tempCtx2 : tempCtx1;
                
                // Set a reasonable timeout for effect processing to prevent UI freezing
                const effectStartTime = performance.now();
                const MAX_EFFECT_TIME = 2000; // 2 seconds max per effect
                
                if (!isLast) {
                  // Clear the destination canvas
                  destCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                  
                  // Copy the current state to destination canvas
                  destCtx.drawImage(srcCanvas, 0, 0);
                  
                  // Apply effect to destination canvas
                  try {
                    applyEffectDirectly(instance.type, destCtx, destCanvas, settings);
                    
                    // Check if effect took too long
                    const effectTime = performance.now() - effectStartTime;
                    if (effectTime > MAX_EFFECT_TIME) {
                      console.warn(`Effect ${instance.type} took too long: ${effectTime.toFixed(0)}ms`);
                    }
                  } catch (err) {
                    console.error(`Error processing effect ${instance.type}:`, err);
                    // Copy source to destination to maintain the chain
                    destCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                    destCtx.drawImage(srcCanvas, 0, 0);
                  }
                } else {
                  // For the last effect, draw directly to main canvas
                  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                  ctx.drawImage(srcCanvas, 0, 0);
                  
                  // Apply final effect directly to main canvas
                  try {
                    applyEffectDirectly(instance.type, ctx, canvas, settings);
                    
                    // Check if effect took too long
                    const effectTime = performance.now() - effectStartTime;
                    if (effectTime > MAX_EFFECT_TIME) {
                      console.warn(`Effect ${instance.type} took too long: ${effectTime.toFixed(0)}ms`);
                    }
                  } catch (err) {
                    console.error(`Error processing final effect ${instance.type}:`, err);
                    // Use the last good state
                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                    ctx.drawImage(srcCanvas, 0, 0);
                  }
                }
              });
              
              // Cleanup canvas resources
              // This helps ensure we don't leak memory over time
              URL.revokeObjectURL(tempCanvas1.toDataURL());
              URL.revokeObjectURL(tempCanvas2.toDataURL());
            }
          }
          
          // Generate crop data if needed
          if (shouldGenerateCropData) {
            setCropImageData(canvas.toDataURL());
            setShouldGenerateCropData(false);
          }
          
          // Set flags
          hasFinishedLoading = true;
          isProcessingRef.current = false;
          setProcessing(false);
        };
        
        // Handle load errors
        img.onerror = () => {
          console.error('Failed to load image');
          hasFinishedLoading = true;
          isProcessingRef.current = false;
          setProcessing(false);
        };
        
        // Load the image
        img.src = originalImageDataRef || image || '';
        
        // Safety timeout to prevent UI freeze if image loading hangs
        setTimeout(() => {
          if (!hasFinishedLoading) {
            console.warn('Image loading timed out');
            isProcessingRef.current = false;
            setProcessing(false);
          }
        }, 5000);
      };
      
      // Defer processing to next frame for better UI responsiveness
      requestAnimationFrame(performRendering);
    } catch (error) {
      console.error('Error processing image:', error);
      isProcessingRef.current = false;
      setProcessing(false);
    }
  }, [canvasWidth, canvasHeight, image, originalImageDataRef, effectInstances, instanceSettings, shouldGenerateCropData]);
  
  // Helper function to apply effects directly
  const applyEffectDirectly = (
    effectType: string, 
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    settings: any
  ) => {
    try {
      switch (effectType) {
        case 'color':
          if (settings.enabled) {
            const colorSettings: ColorSettings = {
              enabled: true,
              hueShift: Number(settings.hueShift) || 0,
              saturation: Number(settings.saturation) || 100,
              brightness: Number(settings.brightness) || 100,
              contrast: Number(settings.contrast) || 100,
              posterize: Number(settings.posterize) || 0,
              invert: Boolean(settings.invert),
              glitchIntensity: Number(settings.glitchIntensity) || 0,
              glitchSeed: settings.glitchSeed || Math.random(),
              blendMode: settings.blendMode || 'normal'
            };
            applyColorAdjustments(ctx, canvas.width, canvas.height, colorSettings);
          }
          break;
        case 'gradient':
          applyGradientMap(ctx, canvas, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'threshold':
          applyThreshold(ctx, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'halftone':
          applyHalftone(ctx, canvas, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'grid':
          const gridSettings = { ...settings, enabled: true };
          const grid = createGrid(canvas.width, canvas.height, gridSettings);
          grid.forEach(cell => renderGridCell(ctx, cell, canvas, gridSettings));
          break;
        case 'dither':
          applyDithering(ctx, canvas, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'textDither':
          applyTextDither(ctx, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'glitch':
          applyGlitch(ctx, canvas, canvas.width, canvas.height, { ...settings, masterEnabled: true });
          break;
        case 'blur':
          applyBlur(ctx, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'mosaicShift':
          applyMosaicShift(ctx, canvas, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'sliceShift':
          applySliceShift(ctx, canvas, canvas.width, canvas.height, { ...settings, enabled: true });
          break;
        case 'posterize':
          applyPosterize(ctx, canvas, canvas.width, canvas.height, settings);
          break;
        case 'findEdges':
          applyFindEdges(ctx, canvas, canvas.width, canvas.height, settings);
          break;
        case 'blob':
          applyBlob(ctx, canvas, canvas.width, canvas.height, settings);
          break;
        case 'glow':
          applyGlow(ctx, canvas.width, canvas.height, settings);
          break;
      }
    } catch (error) {
      console.error(`Error applying effect ${effectType}:`, error);
      // If an effect fails, we can at least keep the current state of the canvas
      // rather than showing nothing at all
    }
  };
  
  // Clear cache when effect instances change
  useEffect(() => {
    effectResultsCache.current = {
      effects: {},
      lastWidth: effectResultsCache.current.lastWidth,
      lastHeight: effectResultsCache.current.lastHeight
    };
  }, [effectInstances.length]);
  
  // Now define the animation hook handler, after processImage is defined
  const handleAnimationFrame = useCallback((time: number, settings: EffectSettings) => {
    if (!settings || !canvasRef.current || !sourceCanvasRef.current) return;
    
    // For smoother animation playback, apply settings directly to the canvas
    // instead of updating all React state
    if (animationState?.isPlaying) {
      // Get the canvas contexts
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      const sourceCtx = sourceCanvasRef.current.getContext('2d', { willReadFrequently: true });
      
      if (ctx && sourceCtx && originalImageDataRef) {
        // Clear canvases
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const processWithImage = (img: HTMLImageElement) => {
          // Draw image on source canvas using drawCoverImage to maintain aspect ratio
          drawCoverImage(sourceCtx, canvasWidth, canvasHeight, img);
          
          // Apply effects based on the effectInstances from settings
          if (settings.effectInstances) {
            const activeEffects = settings.effectInstances.filter(instance => instance.enabled);
            
            activeEffects.forEach(instance => {
              // Get instance-specific settings
              const effectSettings = settings.instanceSettings?.[instance.id] || {};
              
              // Apply effect directly
              applyEffectDirectly(instance.type, sourceCtx, sourceCanvasRef.current!, effectSettings);
            });
          }
          
          // Copy final result to main canvas
          ctx.drawImage(sourceCanvasRef.current!, 0, 0);
        };
        
        // Use the cached image if possible, otherwise create and cache a new one
        if (imageInstanceRef.current && originalImageDataRef === imageInstanceRef.current.src) {
          // Use the cached image
          processWithImage(imageInstanceRef.current);
        } else {
          // Create a new image and cache it
          const img = new Image();
          img.onload = () => {
            imageInstanceRef.current = img;
            processWithImage(img);
          };
          img.src = originalImageDataRef;
        }
      }
    } else {
      // If not playing, update React state for UI controls
      if (settings.ditherSettings) {
        setDitherSettings(settings.ditherSettings);
      }
      if (settings.halftoneSettings) {
        setHalftoneSettings(settings.halftoneSettings);
      }
      if (settings.colorSettings) {
        setColorSettings(settings.colorSettings);
      }
      if (settings.thresholdSettings) {
        setThresholdSettings(settings.thresholdSettings);
      }
      if (settings.glitchSettings) {
        setGlitchSettings(settings.glitchSettings);
      }
      if (settings.textDitherSettings) {
        setTextDitherSettings(settings.textDitherSettings);
      }
      if (settings.gradientMapSettings) {
        setGradientMapSettings(settings.gradientMapSettings);
      }
      if (settings.gridSettings) {
        setGridSettings(settings.gridSettings);
      }
      if (settings.mosaicShiftSettings) {
        setMosaicShiftSettings(settings.mosaicShiftSettings);
      }
      if (settings.sliceShiftSettings) {
        setSliceShiftSettings(settings.sliceShiftSettings);
      }
      if (settings.posterizeSettings) {
        setPosterizeSettings(settings.posterizeSettings);
      }
      if (settings.findEdgesSettings) {
        setFindEdgesSettings(settings.findEdgesSettings);
      }
      if (settings.blobSettings) {
        setBlobSettings(settings.blobSettings);
      }
      if (settings.effectInstances) {
        setEffectInstances(settings.effectInstances);
      }
      if (settings.instanceSettings) {
        setInstanceSettings(settings.instanceSettings);
      }
      
      // Process the image through the normal React flow
      processImage();
    }
  }, [canvasWidth, canvasHeight, originalImageDataRef]);
  
  // Initialize the animation state
  const [animationState, animationControls] = useAnimation(
    animationDuration, 
    handleAnimationFrame,
    keyframes
  );
  
  // Update animation duration when it changes
  useEffect(() => {
    if (animationState && animationState.duration !== animationDuration) {
      // Stop animation if it's playing
      if (animationState.isPlaying) {
        animationControls.stop();
      }
      
      // Need to create a new animation state
      const currentTime = Math.min(animationState.currentTime, animationDuration);
      animationControls.setTime(currentTime);
    }
  }, [animationDuration, animationState, animationControls]);

  // Save settings function
  const handleSaveSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const settings: EffectSettings = {
      ditherSettings,
      halftoneSettings,
      colorSettings,
      thresholdSettings,
      glitchSettings,
      textDitherSettings,
      gradientMapSettings,
      gridSettings,
      effectInstances,
      blur,
      mosaicShiftSettings,
      sliceShiftSettings,
      posterizeSettings,
      findEdgesSettings,
      instanceSettings
    };
    saveEffectSettings(settings);
  };

  // Load settings function
  const handleLoadSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const settings = JSON.parse(text);
        handleSettingsLoaded(settings);
      } catch (error) {
        alert('Error loading settings: ' + (error as Error).message);
      }
    }
  };

  // Handle color setting changes
  const handleColorChange = (setting: keyof ColorSettings, value: any) => {
    setColorSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Handle halftone setting changes
  const handleHalftoneChange = (setting: keyof HalftoneSettings, value: any) => {
    if (setting === 'colored') {
      // When colored is toggled to false, ensure we're using black only (not CMYK)
      if (value === false) {
        // Create a new state with colored set to false and all CMYK channels except black disabled
        setHalftoneSettings(prev => ({
          ...prev,
          colored: false,
          channels: {
            cyan: false,
            magenta: false,
            yellow: false,
            black: true
          }
        }));
      } else {
        // When colored is toggled to true, enable all CMYK channels
        setHalftoneSettings(prev => ({
          ...prev,
          colored: true,
          channels: {
            cyan: true,
            magenta: true,
            yellow: true,
            black: true
          }
        }));
      }
    } else {
      // Normal handling for other settings
      setHalftoneSettings(prev => ({
        ...prev,
        [setting]: value
      }));
    }
  };
  
  // Handle halftone channel setting changes
  const handleHalftoneChannelChange = (channel: 'cyan' | 'magenta' | 'yellow' | 'black', value: boolean) => {
    // If we're toggling a color channel on, make sure "colored" is also enabled
    if ((channel === 'cyan' || channel === 'magenta' || channel === 'yellow') && value === true) {
      setHalftoneSettings(prev => ({
        ...prev,
        colored: true,
        channels: {
          ...prev.channels,
          [channel]: value
        }
      }));
    } else {
      // Normal handling for the black channel or disabling channels
      setHalftoneSettings(prev => ({
        ...prev,
        channels: {
          ...prev.channels,
          [channel]: value
        }
      }));
    }
  };

  // Handle grid setting changes
  const handleGridChange = (setting: keyof GridSettings, value: any) => {
    setGridSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Function to generate a unique ID
  const generateUniqueId = (type: string) => {
    // Find all instances of this type
    const existingInstances = effectInstances.filter(instance => instance.type === type);
    const maxNumber = existingInstances.reduce((max, instance) => {
      const instanceNumber = parseInt(instance.id.split('-')[1]);
      return instanceNumber > max ? instanceNumber : max;
    }, 0);
    
    return `${type}-${maxNumber + 1}`;
  };

  // Function to add a new effect
  const addEffect = (type: string) => {
    const id = generateUniqueId(type);
    
    // Add the new instance to state
    const newInstance: EffectInstance = {
      id,
      type,
      enabled: false // Enable new effects by default
    };
    
    // Create default instance-specific settings based on effect type
    let defaultSettings = {};
    
    switch (type) {
      case 'dither':
        defaultSettings = {
          // Original DitherSettings API properties - these are what actually get used
          enabled: true,
          type: 'floyd-steinberg',
          threshold: 128,
          colorMode: 'grayscale',
          resolution: 30,
          colorDepth: 2,
          darkColor: '#000000',
          lightColor: '#FFFFFF'
        };
        break;
      case 'color':
        defaultSettings = {
          enabled: true,
          hueShift: 0,
          saturation: 100,
          brightness: 100,
          contrast: 100,
          posterize: 0,
          invert: false,
          glitchIntensity: 0,
          glitchSeed: Math.random(),
          blendMode: 'normal' as BlendMode
        };
        break;
      case 'halftone':
        defaultSettings = { ...halftoneSettings, enabled: true };
        break;
      case 'gradient':
        defaultSettings = { ...gradientMapSettings, enabled: true };
        break;
      case 'threshold':
        defaultSettings = { ...thresholdSettings, enabled: true };
        break;
      case 'textDither':
        defaultSettings = { ...textDitherSettings, enabled: true };
        break;
      case 'grid':
        defaultSettings = { ...gridSettings, enabled: true };
        break;
      case 'glitch':
        defaultSettings = { ...glitchSettings, enabled: true };
        break;
      case 'blur':
        defaultSettings = { ...blur, enabled: true };
        break;
      case 'mosaicShift':
        defaultSettings = { 
          ...mosaicShiftSettings, 
          enabled: true,
          seed: Math.random() * 1000 // Generate a new random seed for each new effect
        };
        break;
      case 'sliceShift':
        defaultSettings = { 
          ...sliceShiftSettings, 
          enabled: true,
          seed: Math.random() * 1000 // Generate a new random seed for each new effect
        };
        break;
      case 'posterize':
        defaultSettings = { 
          ...posterizeSettings, 
          enabled: true
        };
        break;
      case 'findEdges':
        defaultSettings = { 
          ...findEdgesSettings, 
          enabled: true
        };
        break;
      case 'blob':
        defaultSettings = { 
          ...blobSettings, 
          enabled: true 
        };
        break;
      case 'glow':
        defaultSettings = {
          enabled: true,
          color: '#ffffff',
          intensity: 50,
          threshold: 128,
          softness: 5,
          blendMode: 'normal'
        };
        break;
      default:
        break;
    }
    
    // Add the new instance first
    setEffectInstances(prev => [...prev, newInstance]);
    
    // Then set its specific settings
    setInstanceSettings(prev => ({
      ...prev,
      [id]: defaultSettings
    }));
  };

  // Function to duplicate an effect
  const duplicateEffect = (id: string) => {
    const instance = effectInstances.find(instance => instance.id === id);
    
    if (instance) {
      // Generate a new ID based on the original type with an incremented counter
      const existingCount = effectInstances.filter(i => i.type === instance.type).length;
      const newId = `${instance.type}-${existingCount + 1}`;
      
      // Create a new instance with the same properties but a new ID
      const newInstance: EffectInstance = {
        ...instance,
        id: newId
      };
      
      // Copy the instance settings if they exist
      if (instanceSettings[instance.id]) {
        const currentSettings = instanceSettings[instance.id];
        
        // Create a deep copy of the settings
        const settingsCopy = JSON.parse(JSON.stringify(currentSettings));
            
        // Set the copy as instance settings for the new ID
        setInstanceSettings(prev => ({
          ...prev,
          [newId]: settingsCopy
        }));
      }
      
      // Add the new instance to the effect instances array
      setEffectInstances(prev => [...prev, newInstance]);
    }
  };

  // Function to remove an effect
  const removeEffect = (id: string) => {
    setEffectInstances(prev => prev.filter(instance => instance.id !== id));
    
    // Remove the instance settings
    setInstanceSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[id];
      return newSettings;
    });
  };
  
  // Function to update effect instances
  const updateEffectInstances = (instances: EffectInstance[]) => {
    setEffectInstances(instances);
  };
  
  const handleCropComplete = useCallback((croppedOriginal: string, croppedModified: string) => {
    // Create a temporary image to get the dimensions
    const img = new Image();
    img.onload = () => {
      // Update canvas dimensions to match the cropped image
      setCanvasWidth(img.width);
      setCanvasHeight(img.height);
      
      // Set the new original image (without effects)
      setOriginalImageDataRef(croppedOriginal);
      
      // Set the new image (this will trigger processImage)
      setImage(croppedOriginal);
      setIsCropping(false);
    };
    img.src = croppedModified; // Use modified image dimensions
  }, []);

  const resetAllEffects = () => {
    // Reset all effect settings to default
    setColorSettings({
      enabled: false,
      hueShift: 0,
      saturation: 100,
      brightness: 100,
      contrast: 100,
      posterize: 0,
      invert: false,
      glitchIntensity: 0,
      glitchSeed: Math.random(),
      blendMode: 'normal'
    });
    
    setHalftoneSettings({
      enabled: false,
      cellSize: 8,
      mix: 100,
      colored: false,
      enableCMYK: false,
      arrangement: 'grid',
      shape: 'circle',
      angleOffset: 0,
      sizeVariation: 0,
      dotScaleFactor: 0.8,
      invertBrightness: false,
      spiralTightness: 0.1,
      spiralExpansion: 1.0,
      spiralRotation: 0,
      spiralCenterX: 0,
      spiralCenterY: 0,
      concentricCenterX: 0,
      concentricCenterY: 0,
      concentricRingSpacing: 1.0,
      channels: {
        cyan: true,
        magenta: true,
        yellow: true,
        black: true
      },
      cmykAngles: {
        cyan: 15,
        magenta: 75,
        yellow: 0,
        black: 45
      }
    });
    
    setGridSettings({
      enabled: false,
      columns: 3,
      rows: 3,
      applyRotation: false,
      maxRotation: 10,
      splitEnabled: false,
      splitProbability: 0.5,
      maxSplitLevels: 2,
      minCellSize: 50
    });
    
    setDitherSettings({
      enabled: false,
      type: 'floyd-steinberg',
      threshold: 128,
      colorMode: 'grayscale',
      resolution: 30,
      colorDepth: 2,
      darkColor: '#000000',
      lightColor: '#FFFFFF'
    });
    
    setTextDitherSettings({
      enabled: false,
      text: 'MATRIX',
      fontSize: 12,
      fontFamily: 'monospace',
      colorMode: 'monochrome',
      contrast: 1,
      brightness: 0.5,
      invert: false,
      resolution: 2
    });
    
    setThresholdSettings({
      enabled: false,
      mode: 'solid',
      threshold: 128,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
      darkColorStart: '#000000',
      darkColorEnd: '#000066',
      lightColorStart: '#FFFFFF',
      lightColorEnd: '#FFFF66'
    });
    
    setGradientMapSettings({
      enabled: false,
      stops: [
        { position: 0, color: '#000000' },
        { position: 50, color: '#ff0000' },
        { position: 100, color: '#ffffff' }
      ],
      blendMode: 'normal',
      opacity: 1
    });
    
    setGlitchSettings({
      masterEnabled: false,
      enabled: false,
      glitchIntensity: 10,
      glitchDensity: 10,
      glitchDirection: 'horizontal',
      glitchSize: 20,
      pixelSortingEnabled: false,
      pixelSortingThreshold: 50,
      pixelSortingDirection: 'horizontal',
      channelShiftEnabled: false,
      channelShiftAmount: 5,
      channelShiftMode: 'rgb',
      scanLinesEnabled: false,
      scanLinesCount: 50,
      scanLinesIntensity: 0.5,
      scanLinesDirection: 'horizontal',
      noiseEnabled: false,
      noiseAmount: 0.5,
      blocksEnabled: false,
      blocksSize: 20,
      blocksOffset: 0,
      blocksDensity: 0.3
    });
    
    onBlurChange({
      enabled: false,
      type: 'gaussian',
      radius: 5
    });
    
    setMosaicShiftSettings({
      enabled: false,
      columns: 8,
      rows: 8,
      maxOffsetX: 50,
      maxOffsetY: 50,
      pattern: 'random',
      intensity: 50,
      seed: Math.random() * 1000,
      preserveEdges: true,
      randomRotation: false,
      maxRotation: 15,
      backgroundColor: '#000000',
      useBackgroundColor: false
    });
    
    setSliceShiftSettings({
      enabled: false,
      slices: 40,
      direction: 'vertical',
      maxOffset: 20,
      mode: 'random',
      intensity: 50,
      seed: Math.random() * 1000,
      feathering: false,
      featherAmount: 20,
      rearrangeMode: 'random',
      backgroundColor: '#000000',
      useBackgroundColor: false
    });
    
    setPosterizeSettings({
      enabled: false,
      levels: 2,
      colorMode: 'rgb',
      preserveLuminance: true,
      dithering: false,
      ditherAmount: 50
    });
    
    setFindEdgesSettings({
      enabled: false,
      algorithm: 'sobel',
      intensity: 50,
      threshold: 128,
      invert: false,
      colorMode: 'grayscale',
      blurRadius: 0
    });
    
    setBlobSettings({
      enabled: false,
      cellSize: 8,
      mix: 100,
      colored: false,
      arrangement: 'grid',
      shape: 'circle',
      connectionType: 'straight',
      connectionStrength: 2,
      connectionColor: '#000000',
      minDistance: 10,
      maxDistance: 50,
      angleOffset: 0,
      sizeVariation: 0,
      dotScaleFactor: 0.8,
      invertBrightness: false
    });
    
    // Disable all effect instances
    setEffectInstances(prev => 
      prev.map(instance => ({
        ...instance,
        enabled: false
      }))
    );
    
    // Process image with reset settings
    setTimeout(() => processImage(), 0);
  };
  
  /**
   * Checks if the current effect order makes vector SVG export available
   * Only shows the SVG export button if halftone or dither is the last effect
   */
  const isVectorSvgAvailable = (): boolean => {
    if (!effectInstances || effectInstances.length === 0) return false;
    
    // Get the last enabled effect
    const getLastEnabledEffect = () => {
      for (let i = effectInstances.length - 1; i >= 0; i--) {
        const instance = effectInstances[i];
        if (!instance.enabled) continue;
        
        return instance.type;
      }
      return null;
    };
    
    const lastEnabledEffect = getLastEnabledEffect();
    return lastEnabledEffect === 'halftone' || lastEnabledEffect === 'dither';
  };

  // Load random image
  const loadRandomImage = useCallback(() => {
    setIsLoading(true);
    
    // Generate a unique random ID to avoid caching
    const randomId = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://picsum.photos/1024/768?random=${randomId}`;
    currentImageUrlRef.current = imageUrl;
    
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const imageData = e.target.result as string;
            
            // Create an image to get dimensions
            const img = new Image();
            img.onload = () => {
              // Calculate dimensions based on viewport
              const viewportWidth = window.innerWidth - 80;
              const viewportHeight = window.innerHeight - 200;
              
              // Natural dimensions
              const { naturalWidth, naturalHeight } = img;
              const aspectRatio = naturalWidth / naturalHeight;
              
              // Calculate new dimensions that fit viewport while preserving aspect ratio
              let newWidth, newHeight;
              
              if (naturalWidth > viewportWidth || naturalHeight > viewportHeight) {
                // Scale down to fit viewport
                const widthRatio = viewportWidth / naturalWidth;
                const heightRatio = viewportHeight / naturalHeight;
                
                // Use the smaller ratio to ensure the image fits
                const scaleFactor = Math.min(widthRatio, heightRatio);
                
                newWidth = naturalWidth * scaleFactor;
                newHeight = naturalHeight * scaleFactor;
              } else {
                // Use original size if smaller than viewport
                newWidth = naturalWidth;
                newHeight = naturalHeight;
              }
              
              // Update dimensions - round to avoid subpixel rendering issues
              setCanvasWidth(Math.round(newWidth));
              setCanvasHeight(Math.round(newHeight));
              setAspectRatio('custom');
              
              // Set the original image data
              setOriginalImageDataRef(imageData);
              
              // Set the image which will trigger processing
              setImage(imageData);
            };
            img.src = imageData;
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error loading random image:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageData = e.target.result as string;
          
          // Create an image to get dimensions
          const img = new Image();
          img.onload = () => {
            // Calculate dimensions based on viewport
            const viewportWidth = window.innerWidth - 80;
            const viewportHeight = window.innerHeight - 200;
            
            // Natural dimensions
            const { naturalWidth, naturalHeight } = img;
            const aspectRatio = naturalWidth / naturalHeight;
            
            // Calculate new dimensions that fit viewport while preserving aspect ratio
            let newWidth, newHeight;
              
            if (naturalWidth > viewportWidth || naturalHeight > viewportHeight) {
              // Scale down to fit viewport
              const widthRatio = viewportWidth / naturalWidth;
              const heightRatio = viewportHeight / naturalHeight;
              
              // Use the smaller ratio to ensure the image fits
              const scaleFactor = Math.min(widthRatio, heightRatio);
              
              newWidth = naturalWidth * scaleFactor;
              newHeight = naturalHeight * scaleFactor;
            } else {
              // Use original size if smaller than viewport
              newWidth = naturalWidth;
              newHeight = naturalHeight;
            }
            
            // Update dimensions - round to avoid subpixel rendering issues
            setCanvasWidth(Math.round(newWidth));
            setCanvasHeight(Math.round(newHeight));
            setAspectRatio('custom');
            
            // Clear any random image reference
            currentImageUrlRef.current = null;
            
            // Set the original image data
            setOriginalImageDataRef(imageData);
            
            // Set the image which will trigger processing
            setImage(imageData);
          };
          img.src = imageData;
        }
      };
      
      reader.readAsDataURL(file);
    }
  }, []);
  
  // Configure dropzone with the onDrop handler
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  });

  // Update effects with manual processing
  const updateInstanceSettings = useCallback((id: string, settings: any) => {
    // Don't allow updates while processing
    if (isProcessingRef.current) return;
    
    setInstanceSettings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...settings
      }
    }));

    // Trigger processing after state update
    setTimeout(() => processImage(), 0);
  }, [processImage]);

  // Function to toggle effect enabled state
  const toggleEffectEnabled = useCallback((id: string, enabled: boolean) => {
    // Don't allow updates while processing
    if (isProcessingRef.current) return;
    
    setEffectInstances(prev => 
      prev.map(instance => 
        instance.id === id ? { ...instance, enabled } : instance
      )
    );

    // Trigger processing after state update
    setTimeout(() => processImage(), 0);
  }, [processImage]);

  // Function to move effect up in the order
  const moveEffectUp = useCallback((id: string) => {
    const index = effectInstances.findIndex(instance => instance.id === id);
    if (index > 0) {
      const newInstances = [...effectInstances];
      [newInstances[index - 1], newInstances[index]] = [newInstances[index], newInstances[index - 1]];
      setEffectInstances(newInstances);
      
      // Manually trigger processing
      requestAnimationFrame(() => processImage());
    }
  }, [effectInstances, processImage]);

  // Function to move effect down in the order
  const moveEffectDown = useCallback((id: string) => {
    const index = effectInstances.findIndex(instance => instance.id === id);
    if (index < effectInstances.length - 1) {
      const newInstances = [...effectInstances];
      [newInstances[index], newInstances[index + 1]] = [newInstances[index + 1], newInstances[index]];
      setEffectInstances(newInstances);
      
      // Manually trigger processing
      requestAnimationFrame(() => processImage());
    }
  }, [effectInstances, processImage]);

  // Process image when it changes or canvas size changes
  useEffect(() => {
    if (image) {
      processImage();
    }
  }, [image, canvasWidth, canvasHeight, processImage]);

  // Initialize the source canvas
  useEffect(() => {
    if (!sourceCanvasRef.current) {
      sourceCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  // Handle settings loaded
  const handleSettingsLoaded = (settings: EffectSettings) => {
    // Load the various settings, use default values if fields are undefined
    if (settings.ditherSettings) {
      setDitherSettings(settings.ditherSettings);
    }
    if (settings.halftoneSettings) {
      setHalftoneSettings(settings.halftoneSettings);
    }
    if (settings.colorSettings) {
      setColorSettings(settings.colorSettings);
    }
    if (settings.thresholdSettings) {
      setThresholdSettings(settings.thresholdSettings);
    }
    if (settings.glitchSettings) {
      setGlitchSettings(settings.glitchSettings);
    }
    if (settings.textDitherSettings) {
      setTextDitherSettings(settings.textDitherSettings);
    }
    if (settings.gradientMapSettings) {
      setGradientMapSettings(settings.gradientMapSettings);
    }
    if (settings.gridSettings) {
      setGridSettings(settings.gridSettings);
    }
    if (settings.mosaicShiftSettings) {
      setMosaicShiftSettings(settings.mosaicShiftSettings);
    }
    if (settings.sliceShiftSettings) {
      setSliceShiftSettings(settings.sliceShiftSettings);
    }
    if (settings.posterizeSettings) {
      setPosterizeSettings(settings.posterizeSettings);
    }
    if (settings.findEdgesSettings) {
      setFindEdgesSettings(settings.findEdgesSettings);
    }
    if (settings.blur) {
      onBlurChange(settings.blur);
    }
    
    // Load instance-specific settings if available
    if (settings.instanceSettings) {
      setInstanceSettings(settings.instanceSettings);
    }
    
    // Load effect instances if available, otherwise create default ones
    if (settings.effectInstances && settings.effectInstances.length > 0) {
      setEffectInstances(settings.effectInstances);
    } else {
      // Create default instances if none exist in the loaded settings
      setEffectInstances([
        { id: 'color-1', type: 'color', enabled: false },
        { id: 'blur-1', type: 'blur', enabled: false },
        { id: 'gradient-1', type: 'gradient', enabled: false },
        { id: 'threshold-1', type: 'threshold', enabled: false },
        { id: 'dither-1', type: 'dither', enabled: false },
        { id: 'halftone-1', type: 'halftone', enabled: false },
        { id: 'textDither-1', type: 'textDither', enabled: false },
        { id: 'glitch-1', type: 'glitch', enabled: false },
        { id: 'grid-1', type: 'grid', enabled: false },
        { id: 'mosaicShift-1', type: 'mosaicShift', enabled: false },
        { id: 'sliceShift-1', type: 'sliceShift', enabled: false },
        { id: 'blob-1', type: 'blob', enabled: false },
      ]);
    }
    
    // Process the image with the new settings
    processImage();
  };

  // Initialize the source canvas
  useEffect(() => {
    sourceCanvasRef.current = document.createElement('canvas');
  }, []);

  // Function to capture current settings as a snapshot
  const captureCurrentSettings = (): EffectSettings => {
    return {
      effectInstances,
      instanceSettings,
      colorSettings,
      halftoneSettings,
      gridSettings,
      ditherSettings,
      textDitherSettings,
      thresholdSettings,
      glitchSettings,
      gradientMapSettings,
      blur,
      mosaicShiftSettings,
      sliceShiftSettings,
      posterizeSettings,
      findEdgesSettings,
      blobSettings
    };
  };

  // Add keyframe at current time
  const handleAddKeyframe = (settings: EffectSettings) => {
    // Generate a unique ID for this keyframe
    const id = nanoid();
    
    // Use provided settings or capture current state
    const keyframeSettings = 
      Object.keys(settings).length > 0
        ? settings
        : captureCurrentSettings();
    
    // Create new keyframe
    const newKeyframe: Keyframe = {
      id,
      time: animationState.currentTime,
      settings: keyframeSettings,
      easing: 'linear'
    };
    
    // Add to keyframes array in sorted order by time
    setKeyframes(prevKeyframes => {
      const updatedKeyframes = [...prevKeyframes, newKeyframe];
      return updatedKeyframes.sort((a, b) => a.time - b.time);
    });
    
    // Select the new keyframe
    setSelectedKeyframeId(id);
  };

  // Update keyframe time and optionally easing
  const handleUpdateKeyframe = (id: string, time: number, easing?: EasingType) => {
    setKeyframes(prevKeyframes => {
      return prevKeyframes.map(keyframe => {
        if (keyframe.id === id) {
          return {
            ...keyframe,
            time,
            easing: easing || keyframe.easing
          };
        }
        return keyframe;
      }).sort((a, b) => a.time - b.time);
    });
  };

  // Delete keyframe by ID
  const handleDeleteKeyframe = (id: string) => {
    setKeyframes(prevKeyframes => {
      return prevKeyframes.filter(keyframe => keyframe.id !== id);
    });
    
    if (selectedKeyframeId === id) {
      setSelectedKeyframeId(null);
    }
  };

  // Select keyframe by ID
  const handleSelectKeyframe = (id: string) => {
    setSelectedKeyframeId(id === selectedKeyframeId ? null : id);
    
    // Apply the selected keyframe's settings
    if (id && id !== selectedKeyframeId) {
      const keyframe = keyframes.find(k => k.id === id);
      if (keyframe) {
        // Apply the keyframe's settings to the current state
        if (keyframe.settings.effectInstances) {
          setEffectInstances(keyframe.settings.effectInstances);
        }
        if (keyframe.settings.instanceSettings) {
          setInstanceSettings(keyframe.settings.instanceSettings);
        }
        if (keyframe.settings.colorSettings) {
          setColorSettings(keyframe.settings.colorSettings);
        }
        if (keyframe.settings.halftoneSettings) {
          setHalftoneSettings(keyframe.settings.halftoneSettings);
        }
        if (keyframe.settings.gridSettings) {
          setGridSettings(keyframe.settings.gridSettings);
        }
        if (keyframe.settings.ditherSettings) {
          setDitherSettings(keyframe.settings.ditherSettings);
        }
        if (keyframe.settings.textDitherSettings) {
          setTextDitherSettings(keyframe.settings.textDitherSettings);
        }
        if (keyframe.settings.thresholdSettings) {
          setThresholdSettings(keyframe.settings.thresholdSettings);
        }
        if (keyframe.settings.glitchSettings) {
          setGlitchSettings(keyframe.settings.glitchSettings);
        }
        if (keyframe.settings.gradientMapSettings) {
          setGradientMapSettings(keyframe.settings.gradientMapSettings);
        }
        if (keyframe.settings.blur) {
          onBlurChange(keyframe.settings.blur);
        }
        if (keyframe.settings.mosaicShiftSettings) {
          setMosaicShiftSettings(keyframe.settings.mosaicShiftSettings);
        }
        if (keyframe.settings.sliceShiftSettings) {
          setSliceShiftSettings(keyframe.settings.sliceShiftSettings);
        }
        if (keyframe.settings.posterizeSettings) {
          setPosterizeSettings(keyframe.settings.posterizeSettings);
        }
        if (keyframe.settings.findEdgesSettings) {
          setFindEdgesSettings(keyframe.settings.findEdgesSettings);
        }
        if (keyframe.settings.blobSettings) {
          setBlobSettings(keyframe.settings.blobSettings);
        }
      }
    }
  };

  // Handle export video
  const handleExportVideo = async () => {
    if (!canvasRef.current || keyframes.length === 0) return;
    
    setExportStatus('exporting');
    setExportProgress(0);
    
    try {
      // Set up export options with higher quality and MP4 format
      const exportOptions: VideoExportOptions = {
        fps: 30,
        duration: animationState.duration,
        width: canvasWidth,
        height: canvasHeight,
        quality: 0.95,
        format: 'mp4' // Try to export as MP4
      };
      
      // Prepare keyframes for export (append first as last if looping)
      let exportKeyframes = keyframes;
      if (animationState.loop && keyframes.length > 1) {
        const firstKeyframe = { ...keyframes[0], time: animationState.duration };
        exportKeyframes = [...keyframes, firstKeyframe];
      }
      
      // Create a notification for the user
      console.log('Starting video export. This may take some time...');
      
      // Set up an optimized event listener for frame updates that directly applies settings
      const handleFrameRequest = (e: Event) => {
        const customEvent = e as CustomEvent;
        const time = customEvent.detail.time;
        
        // Apply settings for the current time directly from keyframes
        if (exportKeyframes.length > 0) {
          const settings = getSettingsAtTime(exportKeyframes, time);
          
          if (settings) {
            // Apply settings directly without state updates to avoid React rerendering
            if (settings.effectInstances && settings.effectInstances.length > 0) {
              // Clone the effect instances to avoid modifying the original
              const activeEffects = settings.effectInstances.filter(instance => instance.enabled);
              
              // Reset canvas first
              if (originalImageDataRef && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                const sourceCtx = sourceCanvasRef.current?.getContext('2d');
                
                if (ctx && sourceCtx && sourceCanvasRef.current) {
                  // Manually reset the canvases
                  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                  sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                  
                  // Load the original image
                  const img = new Image();
                  img.onload = () => {
                    // Draw original image on source canvas
                    sourceCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                    
                    // Apply effects directly
                    activeEffects.forEach(effect => {
                      const effectSettings = settings.instanceSettings?.[effect.id] || {};
                      // Fix the parameter order to match the function definition
                      applyEffectDirectly(effect.type, sourceCtx, sourceCanvasRef.current!, effectSettings);
                    });
                    
                    // Copy result to main canvas
                    ctx.drawImage(sourceCanvasRef.current!, 0, 0);
                  };
                  img.src = originalImageDataRef;
                }
              }
            }
          }
        }
      };
      
      // Add event listener for frame requests
      canvasRef.current.addEventListener('requestframe', handleFrameRequest);
      
      // Wait a short time to ensure the UI state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Export video
      const videoBlob = await exportVideo(
        canvasRef.current,
        exportOptions,
        (progress) => {
          setExportProgress(progress);
          console.log(`Export progress: ${Math.round(progress * 100)}%`);
        }
      );
      
      // Log completed export
      console.log('Video export complete!');
      
      // Create a filename with timestamp
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      const filename = `image-tweaker-animation_${timestamp}.mp4`;
      
      // Download the video
      downloadVideo(videoBlob, filename);
      
      // Remove event listener
      canvasRef.current.removeEventListener('requestframe', handleFrameRequest);
      
      // Set export status to complete
      setExportStatus('complete');
      
      // Reset export status after a delay
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error exporting video:', error);
      setExportStatus('idle');
    }
  };

  // Helper function to manually trigger processing when effects change
  const updateEffectsAndProcess = useCallback(() => {
    // Use timeout to ensure state updates are complete before processing
    setTimeout(() => {
      if (image) {
        processImage();
      }
    }, 0);
  }, [image, processImage]);

  // Update instance settings with processing
  const updateInstanceSettingsWithProcess = useCallback((id: string, settings: any) => {
    setInstanceSettings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...settings
      }
    }));
    updateEffectsAndProcess();
  }, [updateEffectsAndProcess]);

  // Function to toggle effect enabled state with processing
  const toggleEffectEnabledWithProcess = useCallback((id: string, enabled: boolean) => {
    setEffectInstances(prev => 
      prev.map(instance => 
        instance.id === id ? { ...instance, enabled } : instance
      )
    );
    updateEffectsAndProcess();
  }, [updateEffectsAndProcess]);

  // Add this function to prepare crop data before showing crop UI
  const handleCropImage = useCallback(() => {
    setShouldGenerateCropData(true);
    setTimeout(() => {
      processImage();
      setIsCropping(true);
    }, 0);
  }, [processImage]);

  // Add a helper function to get settings for an instance
  const getInstanceSettings = (instance: EffectInstance) => {
    // If instance-specific settings exist, use them
    if (instanceSettings[instance.id]) {
      return instanceSettings[instance.id];
    }
    
    // Otherwise, fall back to global settings
    switch (instance.type) {
      case 'color':
        return colorSettings;
      case 'gradient':
        return gradientMapSettings;
      case 'threshold':
        return thresholdSettings;
      case 'halftone':
        return halftoneSettings;
      case 'grid':
        return gridSettings;
      case 'dither':
        return ditherSettings;
      case 'textDither':
        return textDitherSettings;
      case 'glitch':
        return glitchSettings;
      case 'blur':
        return blur;
      case 'mosaicShift':
        return mosaicShiftSettings;
      case 'sliceShift':
        return sliceShiftSettings;
      case 'blob':
        return blobSettings;
      default:
        return {};
    }
  };

  const [exportScale, setExportScale] = useState(100);
  const [exporting, setExporting] = useState(false);

  // Helper to get max texture size
  function getMaxTextureSize() {
    const gl = document.createElement('canvas').getContext('webgl');
    return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 8192;
  }

  // Compute the robust clamped export scale and resolution
  const maxTextureSize = getMaxTextureSize();
  const maxSafeScale = Math.min(5, Math.floor(maxTextureSize / Math.max(canvasWidth, canvasHeight)));
  const requestedScale = exportScale / 100;
  const finalScale = Math.min(requestedScale, maxSafeScale);
  const finalWidth = Math.round(canvasWidth * finalScale);
  const finalHeight = Math.round(canvasHeight * finalScale);
  const isClamped = finalScale < requestedScale;

  // Export PNG with scale
  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    const scale = finalScale;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `imagetweaker-${timestamp}.png`;

    let outputCanvas = canvasRef.current;

    if (scale !== 1) {
      const targetWidth = Math.round(canvasWidth * scale);
      const targetHeight = Math.round(canvasHeight * scale);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
      }
      outputCanvas = tempCanvas;
    } else {
      // 1x, just use the original canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
      }
      outputCanvas = tempCanvas;
    }

    outputCanvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, filename);
      }
      setExporting(false);
    }, 'image/png');
    
    if (isClamped) {
      alert(`Export size too large for your browser/GPU. Max allowed: ${maxTextureSize}x${maxTextureSize}px. Exported at maximum possible size: ${finalWidth}x${finalHeight}px.`);
    }
  };
  // Export SVG with scale
  const handleExportSvg = () => {
    if (!canvasRef.current) return;
    exportCanvasAsSvg(canvasRef.current, exportScale / 100);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas Container */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-20">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex w-full justify-between gap-2">
              <div className="flex flex-nowrap gap-2 items-center">
                <label 
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font cursor-pointer flex items-center gap-1 min-w-fit"
                >
                  <FiUpload size={16} />
                  <span className="hidden sm:inline">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        onDrop([e.target.files[0]]);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={loadRandomImage}
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                >
                  <FiShuffle size={16} />
                  <span className="hidden sm:inline">Random</span>
                </button>
                <button
                  onClick={() => {
                    setImage(null);
                    setOriginalImageDataRef(null);
                    currentImageUrlRef.current = null; // Reset the URL reference
                  }}
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                >
                  <FiTrash size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                
                <div className="h-4 mx-1 border-r border-[var(--border-color)]"></div>
                
                <button
                  onClick={resetAllEffects}
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                >
                  <FiRefreshCw size={16} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                
                <div className="h-4 mx-1 border-r border-[var(--border-color)]"></div>
                
                <label 
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font cursor-pointer flex items-center gap-1 min-w-fit"
                >
                  <FiDownload size={16} />
                  <span className="hidden sm:inline">Save</span>
                  <input 
                    type="file" 
                    style={{ display: 'none' }} 
                    ref={saveButtonRef}
                    onClick={handleSaveSettings}
                  />
                </label>
                <label 
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font cursor-pointer flex items-center gap-1 min-w-fit"
                >
                  <FiUpload size={16} />
                  <span className="hidden sm:inline">Load</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    style={{ display: 'none' }} 
                    onChange={handleLoadSettings} 
                  />
                </label>
                
                <div className="h-4 mx-1 border-r border-[var(--border-color)]"></div>
                
                <button
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                  onClick={handleCropImage}
                  disabled={!image}
                >
                  <FiCrop size={16} />
                  <span className="hidden sm:inline">Crop</span>
                </button>
                {/* Divider after Crop button removed */}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                  : 'border-[var(--border-color)]'
              } rounded-lg p-4 text-center cursor-pointer transition-colors bg-[var(--secondary-bg)]`}
            >
              <input {...getInputProps()} />
              {image ? (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="max-w-full h-auto mx-auto"
                  />
                  {(processing || imageLoading) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12">
                  <p className="text-[var(--text-secondary)] pp-mondwest-font">
                    {isLoading ? 'Loading random image...' : 'Drag & drop an image here, or click to select'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="lg:w-1/3 xl:w-[35%]">
        <div className="sticky top-20 bg-[var(--accent-bg)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
          <MobileControls 
            ditherSettings={ditherSettings}
            halftoneSettings={halftoneSettings}
            colorSettings={colorSettings}
            thresholdSettings={thresholdSettings}
            glitchSettings={glitchSettings}
            textDitherSettings={textDitherSettings}
            gradientMapSettings={gradientMapSettings}
            gridSettings={gridSettings}
            effectInstances={effectInstances}
            instanceSettings={instanceSettings}
            updateDitherSettings={(settings) => setDitherSettings(prev => ({ ...prev, ...settings }))}
            updateHalftoneSettings={handleHalftoneChange}
            updateColorSettings={handleColorChange}
            updateThresholdSettings={(settings) => setThresholdSettings(prev => ({ ...prev, ...settings }))}
            updateGlitchSettings={(settings) => setGlitchSettings(prev => ({ ...prev, ...settings }))}
            updateTextDitherSettings={(settings) => setTextDitherSettings(prev => ({ ...prev, ...settings }))}
            updateGradientMapSettings={(settings) => setGradientMapSettings(prev => ({ ...prev, ...settings }))}
            updateGridSettings={handleGridChange}
            updateInstanceSettings={updateInstanceSettings}
            updateEffectInstances={updateEffectInstances}
            addEffect={addEffect}
            duplicateEffect={duplicateEffect}
            removeEffect={removeEffect}
            onResetImage={() => {
              setImage(null);
              setOriginalImageDataRef(null);
              currentImageUrlRef.current = null;
            }}
            onExportPng={() => canvasRef.current && exportCanvasAsPng(canvasRef.current)}
            onExportSvg={() => canvasRef.current && exportCanvasAsSvg(canvasRef.current)}
            onCropImage={handleCropImage}
            blur={blur}
            onBlurChange={(newBlur) => onBlurChange(newBlur)}
            onSettingsLoaded={handleSettingsLoaded}
            mosaicShiftSettings={mosaicShiftSettings}
            updateMosaicShiftSettings={(settings) => setMosaicShiftSettings(prev => ({ ...prev, ...settings }))}
            sliceShiftSettings={sliceShiftSettings}
            updateSliceShiftSettings={(settings) => setSliceShiftSettings(prev => ({ ...prev, ...settings }))}
            posterizeSettings={posterizeSettings}
            updatePosterizeSettings={(settings) => setPosterizeSettings(prev => ({ ...prev, ...settings }))}
            findEdgesSettings={findEdgesSettings}
            updateFindEdgesSettings={(settings) => setFindEdgesSettings(prev => ({ ...prev, ...settings }))}
          />
          {/* Animation Section */}
          <div className="mt-6 border-t border-[var(--border-color)] pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[var(--text-primary)] text-lg pp-mondwest-font">Animation</h3>
              <div className="flex items-center">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={animationEnabled}
                    onChange={() => setAnimationEnabled(!animationEnabled)}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            {animationEnabled && (
              <>
                <AnimationTimeline
                  keyframes={keyframes}
                  state={animationState}
                  controls={animationControls}
                  onAddKeyframe={handleAddKeyframe}
                  onUpdateKeyframe={handleUpdateKeyframe}
                  onDeleteKeyframe={handleDeleteKeyframe}
                  onSelectKeyframe={handleSelectKeyframe}
                  selectedKeyframeId={selectedKeyframeId}
                  onDurationChange={setAnimationDuration}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleExportVideo}
                    disabled={keyframes.length === 0 || exportStatus === 'exporting'}
                    className={`mobile-action-button ${
                      keyframes.length === 0 || exportStatus === 'exporting'
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {exportStatus === 'idle' 
                      ? 'Export Video' 
                      : exportStatus === 'exporting' 
                        ? `Exporting... ${Math.round(exportProgress * 100)}%` 
                        : 'Export Complete!'}
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Export Section - always at the bottom, with divider above */}
          <div className="mt-6 border-t border-[var(--border-color)] pt-4">
            <div>
              <h3 className="text-[var(--text-primary)] text-lg pp-mondwest-font mb-2">Export</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">Export Scale</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">{Math.round(finalScale * 100)}%</span>
                  <span className="text-xs text-[var(--text-secondary)]">{finalWidth}x{finalHeight}px</span>
                </span>
              </div>
              <div className="mt-1">
                <Slider
                  label=""
                  value={exportScale}
                  onChange={setExportScale}
                  min={100}
                  max={500}
                  step={50}
                  unit="%"
                  showValue={false}
                  hideLabelContainer={true}
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button
                  className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-xs"
                  onClick={handleExportPng}
                  disabled={!image}
                >
                  Export PNG
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs transition ${isVectorSvgAvailable() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-800 text-gray-400 cursor-not-allowed'}`}
                  onClick={handleExportSvg}
                  disabled={!image || !isVectorSvgAvailable()}
                  title={isVectorSvgAvailable() ? 'Export as true vector SVG (halftone/dither)' : 'Vector SVG export only available when halftone or dither is the last effect'}
                >
                  Export SVG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCropping && originalImageDataRef && canvasRef.current && (
        <CropEditor
          imageUrl={originalImageDataRef}
          modifiedImageUrl={canvasRef.current.toDataURL()}
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropping(false)}
        />
      )}
    </div>
  );
} 