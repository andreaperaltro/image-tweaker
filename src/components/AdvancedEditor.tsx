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
import { ThresholdSettings, ThresholdMode, applyThreshold } from './ThresholdUtils'
import CropEditor from './CropEditor'
import { GradientMapSettings, applyGradientMap, GradientMapBlendMode, GradientStop } from './GradientMapUtils'
import { saveAs } from 'file-saver'
import MobileControls from './MobileControls'
import { BlurSettings, DistortSettings } from '../types'
import { applyBlur, applyGaussianBlur } from './BlurUtils'
import { EffectSettings, saveEffectSettings } from '../utils/EffectSettingsUtils'
import { FiUpload, FiShuffle, FiTrash, FiRefreshCw, FiSave, FiFolder, FiImage, FiFileText, FiDownload, FiCrop, FiLayers } from 'react-icons/fi'
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
import { PolarPixelSettings, applyPolarPixelEffect } from './PolarPixel'
import { PixelEffectSettings, applyPixelEffect } from './PixelEffect'
import { applyNoiseEffect } from './NoiseEffect'
import { applyLinocutEffect } from './LinocutEffect'
import { applyLevelsEffect } from './LevelsEffect'
import { applyAsciiEffect } from './AsciiEffect'
import { AsciiEffectSettings } from '../types'
import { applyTextEffect } from './TextEffect'
import { TextEffectSettings } from '../types'
import LCDEffect from './LCDEffect';
import { applyLCDEffect } from './LCDEffect';
import { SnakeEffectSettings, applySnakeEffect, SnakeIcon } from './SnakeEffect';
import { applyThreeDEffect } from './ThreeDEffect';
import { ThreeDEffectSettings } from '../types';
import { applyShapeGridEffect, ShapeGridSettings } from './ShapeGridEffect';
import { useTruchetEffect, TruchetSettings } from './TruchetEffect';
import { applyPaintEffect, usePaintCanvasInteraction } from './PaintEffect';
import { Effects } from '../types';
import { addPngMetadata } from '../utils/PngMetadata';
import { ASCII_CHARSETS } from './AsciiEffect';

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
  gradientMapSettings: GradientMapSettings;
  gridSettings: GridSettings;
  effectInstances: EffectInstance[];
  instanceSettings: {[id: string]: any};
  updateDitherSettings: (settings: Partial<DitherSettings>) => void;
  updateHalftoneSettings: (setting: keyof HalftoneSettings, value: any) => void;
  updateColorSettings: (setting: keyof ColorSettings, value: any) => void;
  updateThresholdSettings: (settings: Partial<ThresholdSettings>) => void;
  updateGlitchSettings: (settings: Partial<GlitchSettings>) => void;
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
  textEffectSettings: TextEffectSettings;
  updateTextEffectSettings: (settings: Partial<TextEffectSettings>) => void;
  onExportVideo: () => void;
  onSaveSettings: () => void;
  onLoadSettings: () => void;
  onRandomImage: () => void;
  onUploadImage: () => void;
  onClearImage: () => void;
  snakeEffectSettings: SnakeEffectSettings;
  updateSnakeEffectSettings: (settings: Partial<SnakeEffectSettings>) => void;
  truchetSettings: TruchetSettings;
  updateTruchetSettings: (settings: Partial<TruchetSettings>) => void;
}

const defaultTruchetSettings: TruchetSettings = {
  enabled: false,
  tileSize: 30,
  tileTypes: ['quarter-circles', 'diagonal'],
  colors: {
    background: '#1a1a1a',
    foreground: '#ffffff'
  },
  threshold: 128,  // Mid-point brightness threshold
  patternDensity: 80,
  lineWidth: 2
};

export default function AdvancedEditor({
  blur,
  onBlurChange,
}: AdvancedEditorProps) {
  // Canvas and image states
  const [image, setImage] = useState<string | null>(null);
  const originalImageDataRef = useRef<string | null>(null);
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
    hexagonalRowOffset: 0.5,
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

  // Threshold settings
  const [thresholdSettings, setThresholdSettings] = useState<ThresholdSettings>({
    enabled: false,
    mode: 'solid',
    threshold: 128,
    darkColor: '#000000',
    lightColor: '#FFFFFF',
    darkStops: [
      { position: 0, color: '#000000' },
      { position: 100, color: '#404040' }
    ],
    lightStops: [
      { position: 0, color: '#BFBFBF' },
      { position: 100, color: '#FFFFFF' }
    ],
    darkGradientAngle: 0,
    lightGradientAngle: 0
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

  // Truchet settings state
  const [truchetSettings, setTruchetSettings] = useState<TruchetSettings>(defaultTruchetSettings);

  // Add state for crop functionality
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [shouldGenerateCropData, setShouldGenerateCropData] = useState(false);
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

  // Add distort settings state
  const [distortSettings, setDistortSettings] = useState<DistortSettings>({
    enabled: false,
    xAmount: 0,
    yAmount: 0,
    displacementMap: null,
    preserveAspectRatio: true,
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    smoothness: 0
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
  
  // Initialize hooks
  const applyTruchetEffect = useTruchetEffect();
  
  // Preload image when originalImageDataRef changes
  useEffect(() => {
    if (!originalImageDataRef.current) return;
    
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
    img.src = originalImageDataRef.current;
  }, [originalImageDataRef]);
  
  // Define processImage
  const processImage = useCallback(async () => {
    if (!canvasRef.current || !sourceCanvasRef.current || !originalImageDataRef.current || isProcessingRef.current) {
      return;
    }
    
    try {
      isProcessingRef.current = true;
      setProcessing(true);
      
      const canvas = canvasRef.current;
      const sourceCanvas = sourceCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx || !sourceCtx) {
        console.error('Could not get canvas context');
        return;
      }
      
      // Set canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      sourceCanvas.width = canvasWidth;
      sourceCanvas.height = canvasHeight;


      
      const performRendering = async () => {
        // Clear canvases
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Load and wait for the image
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = originalImageDataRef.current || image || '';
        });

        // Draw original image to source canvas
        sourceCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        // Get enabled effects only
        const enabledEffects = effectInstances.filter(instance => instance.enabled);
        
        // If no effects are enabled, just draw the original image
        if (enabledEffects.length === 0) {
          ctx.drawImage(sourceCanvas, 0, 0);
          
          // Update crop data if needed
          if (shouldGenerateCropData) {
            setCropImageData(canvas.toDataURL());
            setShouldGenerateCropData(false);
          }
          
          isProcessingRef.current = false;
          setProcessing(false);
          return;
        }
        
        // Define maximum number of effects to process at once
        const MAX_EFFECTS = 10;
        const effectsToProcess = enabledEffects.slice(0, MAX_EFFECTS);
        
        if (enabledEffects.length > MAX_EFFECTS) {
          console.warn(`Too many effects active (${enabledEffects.length}). Limiting to ${MAX_EFFECTS} effects.`);
        }
        
        try {
          // Process each effect, fast path for the simple case
          if (effectsToProcess.length === 1) {
            // Just one effect, simplify processing
            const instance = effectsToProcess[0];
            const settings = getInstanceSettings(instance);
            
            // Apply the effect directly
            await applyEffectDirectly(instance.type, sourceCtx, sourceCanvas, sourceCanvas, settings);
            
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
              for (const instance of effectsToProcess) {
                const settings = getInstanceSettings(instance);
                const isLast = instance === effectsToProcess[effectsToProcess.length - 1];
                
                // Determine source and destination contexts for this iteration
                const srcCanvas = effectsToProcess.indexOf(instance) % 2 === 0 ? tempCanvas1 : tempCanvas2;
                const destCanvas = effectsToProcess.indexOf(instance) % 2 === 0 ? tempCanvas2 : tempCanvas1;
                const destCtx = effectsToProcess.indexOf(instance) % 2 === 0 ? tempCtx2 : tempCtx1;
                
                // Set a reasonable timeout for effect processing
                const effectStartTime = performance.now();
                const MAX_EFFECT_TIME = 2000;
                
                if (!isLast) {
                  // Clear the destination canvas
                  destCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                  
                  // Copy the current state to destination canvas
                  destCtx.drawImage(srcCanvas, 0, 0);
                  
                  // Apply effect to destination canvas
                  try {
                    await applyEffectDirectly(instance.type, destCtx, destCanvas, srcCanvas, settings);
                    
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
                    await applyEffectDirectly(instance.type, ctx, canvas, srcCanvas, settings);
                    
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
              }
              
              // Cleanup canvas resources
              URL.revokeObjectURL(tempCanvas1.toDataURL());
              URL.revokeObjectURL(tempCanvas2.toDataURL());
            }
          }
          
          // Generate crop data if needed
          if (shouldGenerateCropData) {
            setCropImageData(canvas.toDataURL());
            setShouldGenerateCropData(false);
          }
        } catch (error) {
          console.error('Error processing effects:', error);
        } finally {
          // Always reset processing flags
          isProcessingRef.current = false;
          setProcessing(false);
        }
      };
      
      // Start the rendering process
      await performRendering();
    } catch (error) {
      console.error('Error processing image:', error);
      isProcessingRef.current = false;
      setProcessing(false);
    }
  }, [canvasWidth, canvasHeight, image, originalImageDataRef, effectInstances, instanceSettings, shouldGenerateCropData]);

  // Add this function to get settings for an instance
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
      case 'linocut':
        return instanceSettings[instance.id];
      case 'snake':
        return instanceSettings[instance.id];
      case 'distort':
        return instanceSettings[instance.id]; // Always use instance-specific settings for distort
      case 'shapegrid':
        return {
          enabled: true,
          gridSize: 20,
          threshold: 128,
          colors: {
            background: '#1a1a1a',
            foreground: '#ffffff'
          },
          shapes: ['circle', 'square', 'triangle', 'cross', 'heart'],
          mergeLevels: 3,
          randomRotation: false
        } as ShapeGridSettings;
      case 'truchet':
        return instanceSettings[instance.id];
      case 'paint':
        return {
          enabled: true,
          brushSize: 10,
          color: '#000000',
          opacity: 1,
          blendMode: 'source-over',
          strokes: [],
          ...instanceSettings[instance.id]
        };
      default:
        return {};
    }
  };

  // Check if any paint effect is enabled and active
  const activePaintEffect = effectInstances.find(instance => 
    instance.type === 'paint' && instance.enabled
  );
  const isPaintEffectActive = !!activePaintEffect;

  // Get the paint settings for the active paint effect
  const paintSettings = activePaintEffect ? getInstanceSettings(activePaintEffect) : {
    enabled: false,
    brushSize: 10,
    color: '#000000',
    opacity: 1,
    blendMode: 'source-over',
    strokes: []
  };

  // Setup paint canvas interaction
  usePaintCanvasInteraction({
    canvas: canvasRef.current,
    settings: paintSettings,
    onSettingsChange: (newPaintSettings) => {
      if (activePaintEffect) {
        updateInstanceSettings(activePaintEffect.id, newPaintSettings);
      }
    },
    enabled: isPaintEffectActive
  });

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
      enabled: true // Enable new effects by default
    };
    
    // Create default instance-specific settings based on effect type
    let defaultSettings = {};
    
    switch (type) {
      case 'distort':
        defaultSettings = {
          enabled: true,
          xAmount: 0,
          yAmount: 0,
          displacementMap: null,
          preserveAspectRatio: true,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          smoothness: 0
        } as DistortSettings;
        break;
      case 'color':
        defaultSettings = {
          enabled: true,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hueShift: 0,
          invert: false,
          posterize: 0,
          glitchIntensity: 0,
          glitchSeed: Math.random(),
          blendMode: 'normal'
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
      case 'polarPixel':
        defaultSettings = {
          enabled: true,
          rings: 24,
          segments: 48,
          centerX: 0.5,
          centerY: 0.5
        };
        break;
      case 'pixel':
        defaultSettings = {
          enabled: true,
          mode: 'grid',
          cellSize: 16,
          rings: 24,
          segments: 48,
          centerX: 0.5,
          centerY: 0.5
        };
        break;
      case 'noise':
        defaultSettings = {
          enabled: true,
          type: 'perlin',
          intensity: 0.5,
          scale: 0.1,
          seed: 0,
          blendMode: 'normal',
        };
        break;
      case 'linocut':
        defaultSettings = {
          enabled: true,
          scale: 12,
          noiseScale: 0.06,
          centerX: 0.5,
          centerY: 0.5,
          invert: false,
          orientation: 'horizontal',
          threshold: 0.5
        };
        break;
      case 'levels':
        defaultSettings = {
          enabled: true,
          inputBlack: 0,
          inputWhite: 255,
          gamma: 1.0,
          outputBlack: 0,
          outputWhite: 255
        };
        break;
      case 'ascii':
        defaultSettings = {
          enabled: true,
          cellSize: 8,
          fontSize: 12,
          charset: ASCII_CHARSETS['standard'],
          characterSet: 'standard',
          backgroundColor: '#000000',
          monochrome: true,
          jitter: 0,
          preset: 'Dense',
          textColor: '#ffffff',
          rotationMax: 0,
          rotationMode: 'none'
        };
        break;
      case 'text':
        defaultSettings = {
          enabled: true,
          text: 'Hello World',
          fontSize: 24,
          fontWeight: 'normal',
          lineHeight: 1.2,
          letterSpacing: 0,
          color: '#000000',
          x: 0.5,
          y: 0.5,
          align: 'center',
          textStyle: 'fill',
          strokeWeight: 1,
          blendMode: 'source-over'
        };
        break;
      case 'lcd':
        defaultSettings = {
          enabled: true,
          cellWidth: 3,
          cellHeight: 3,
          intensity: 1
        };
        break;
      case 'snake':
        defaultSettings = {
          enabled: true,
          gridSize: 20,
          colorCount: 8,
          cornerRadius: 5,
          colorMode: 'grayscale',
          padding: 4,
          backgroundColor: '#ffffff',
          outlineStyle: 'pixel',
          shape: 'row'
        };
        break;
      case 'threeD':
        defaultSettings = {
          enabled: true,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          backgroundColor: '#000000',
          perspective: 45,
          distance: 500
        } as ThreeDEffectSettings;
        break;
      case 'shapegrid':
        defaultSettings = {
          enabled: true,
          gridSize: 20,
          threshold: 128,
          colors: {
            background: '#1a1a1a',
            foreground: '#ffffff'
          },
          shapes: ['circle', 'square', 'triangle', 'cross', 'heart'],
          mergeLevels: 3,
          randomRotation: false
        } as ShapeGridSettings;
        break;
      case 'truchet':
        defaultSettings = {
          enabled: true,
          tileSize: 30,
          tileTypes: ['quarter-circles', 'diagonal'],
          colors: {
            background: '#1a1a1a',
            foreground: '#ffffff'
          },
          threshold: 128,  // Mid-point brightness threshold
          patternDensity: 80,
          lineWidth: 2
        };
        break;
      case 'dither':
        defaultSettings = { 
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
      case 'blur':
        defaultSettings = {
          enabled: true,
          type: 'gaussian',
          radius: 5,
          angle: 0,
          centerX: 50,
          centerY: 50,
          centerRadius: 0,
          centerGradient: 0,
          focusPosition: 50,
          focusWidth: 25,
          gradient: 12.5
        };
        break;
      case 'paint':
        defaultSettings = {
          enabled: true,
          brushSize: 10,
          color: '#000000',
          opacity: 1,
          blendMode: 'source-over',
          strokes: []
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
      originalImageDataRef.current = croppedOriginal;
      
      // Set the new image (this will trigger processImage)
      setImage(croppedOriginal);
      setIsCropping(false);
      setShowCropEditor(false);
    };
    img.src = croppedModified; // Use modified image dimensions
  }, [setCanvasWidth, setCanvasHeight, setImage, setIsCropping, setShowCropEditor]);

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
      hexagonalRowOffset: 0.5,
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
    
    setThresholdSettings({
      enabled: false,
      mode: 'solid',
      threshold: 128,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
      darkStops: [
        { position: 0, color: '#000000' },
        { position: 100, color: '#404040' }
      ],
      lightStops: [
        { position: 0, color: '#BFBFBF' },
        { position: 100, color: '#FFFFFF' }
      ],
      darkGradientAngle: 0,
      lightGradientAngle: 0
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
              originalImageDataRef.current = imageData;
              
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
            originalImageDataRef.current = imageData;
            
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

    setInstanceSettings(prev => {
      const prevSettings = prev[id] || {};
      // If this is a threeD effect, always merge with full defaults
      const isThreeD = prevSettings && (prevSettings.perspective !== undefined || prevSettings.rotationX !== undefined || prevSettings.scale !== undefined);
      if (isThreeD) {
        return {
          ...prev,
          [id]: {
            ...getDefaultThreeDSettings(),
            ...prevSettings,
            ...settings
          }
        };
      } else {
        return {
          ...prev,
          [id]: {
            ...prevSettings,
            ...settings
          }
        };
      }
    });

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
      const updatedInstanceSettings = { ...settings.instanceSettings };
      Object.keys(updatedInstanceSettings).forEach(id => {
        const inst = updatedInstanceSettings[id];
        if (inst && inst.preset === 'ascii') {
          if (!inst.characterSet && inst.charset) {
            // Try to infer characterSet from charset string
            const found = Object.entries(ASCII_CHARSETS).find(([, str]) => str === inst.charset);
            inst.characterSet = found ? found[0] : 'custom';
          }
          if (!inst.charset && inst.characterSet) {
            inst.charset = ASCII_CHARSETS[inst.characterSet] || '';
          }
        }
      });
      setInstanceSettings(updatedInstanceSettings);
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
        { id: 'glitch-1', type: 'glitch', enabled: false },
        { id: 'grid-1', type: 'grid', enabled: false },
        { id: 'mosaicShift-1', type: 'mosaicShift', enabled: false },
        { id: 'sliceShift-1', type: 'sliceShift', enabled: false },
        { id: 'blob-1', type: 'blob', enabled: false },
        { id: 'shapegrid-1', type: 'shapegrid', enabled: false },
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
      thresholdSettings,
      glitchSettings,
      gradientMapSettings,
      blur,
      mosaicShiftSettings,
      sliceShiftSettings,
      posterizeSettings,
      findEdgesSettings
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
      const handleFrameRequest = async (e: Event) => {
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
              if (originalImageDataRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                const sourceCtx = sourceCanvasRef.current?.getContext('2d');
                
                if (ctx && sourceCtx && sourceCanvasRef.current) {
                  // Manually reset the canvases
                  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                  sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                  
                  // Load the original image
                  await new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = async () => {
                      // Draw original image on source canvas
                      sourceCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                      
                      // Apply effects sequentially
                      for (const effect of activeEffects) {
                        const effectSettings = settings.instanceSettings?.[effect.id] || {};
                        // Fix the parameter order to match the function definition
                        await applyEffectDirectly(effect.type, sourceCtx, sourceCanvasRef.current!, sourceCanvasRef.current!, effectSettings);
                      }
                      
                      // Copy result to main canvas
                      ctx.drawImage(sourceCanvasRef.current!, 0, 0);
                      resolve();
                    };
                    if (originalImageDataRef.current) { // Add this check
                      img.src = originalImageDataRef.current;
                    } else {
                      resolve(); // Resolve if no image data to prevent infinite loading
                    }
                  });
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

  // Helper function to apply effects directly
  const applyEffectDirectly = async (
    effectType: string,
    ctx: CanvasRenderingContext2D,
    targetCanvas: HTMLCanvasElement,
    sourceCanvas: HTMLCanvasElement,
    settings: any
  ) => {
    try {
      switch (effectType) {
        case 'distort':
          const applyDistortion = async () => {
            if (settings.displacementMap) {
              const displacementImage = new Image();
              displacementImage.src = settings.displacementMap;
              await new Promise((resolve) => {
                displacementImage.onload = resolve;
              });
              
              // Create a temporary canvas for the displacement map
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = targetCanvas.width;
              tempCanvas.height = targetCanvas.height;
              const tempCtx = tempCanvas.getContext('2d');
              
              if (tempCtx) {
                // Clear the temporary canvas
                tempCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

                let drawWidth, drawHeight, x, y;

                if (settings.preserveAspectRatio) {
                  // Calculate dimensions to maintain aspect ratio
                  const aspectRatio = displacementImage.width / displacementImage.height;
                  drawWidth = targetCanvas.width * settings.scale;
                  drawHeight = drawWidth / aspectRatio;

                  // Adjust if height is too big
                  if (drawHeight > targetCanvas.height * settings.scale) {
                    drawHeight = targetCanvas.height * settings.scale;
                    drawWidth = drawHeight * aspectRatio;
                  }
                } else {
                  // Stretch to fill, considering scale
                  drawWidth = targetCanvas.width * settings.scale;
                  drawHeight = targetCanvas.height * settings.scale;
                }

                // Calculate base centered position
                x = (targetCanvas.width - drawWidth) / 2;
                y = (targetCanvas.height - drawHeight) / 2;

                // Apply offset (convert from -100/100 range to actual pixels)
                x += (settings.offsetX / 100) * targetCanvas.width;
                y += (settings.offsetY / 100) * targetCanvas.height;
                
                // Draw the displacement map with all transformations
                tempCtx.drawImage(displacementImage, x, y, drawWidth, drawHeight);
                // Apply blur to the displacement map if smoothness > 0
                if (settings.smoothness && settings.smoothness > 0) {
                  applyGaussianBlur(tempCtx, targetCanvas.width, targetCanvas.height, settings.smoothness);
                }
                const displacementData = tempCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height).data;
                
                // Get the source image data
                const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
                const data = imageData.data;
                const newData = new Uint8ClampedArray(data.length);

                // First, copy the original image data
                for (let i = 0; i < data.length; i++) {
                  newData[i] = data[i];
                }

                // Create a temporary canvas for the displaced pixels
                const overlayCanvas = document.createElement('canvas');
                overlayCanvas.width = targetCanvas.width;
                overlayCanvas.height = targetCanvas.height;
                const overlayCtx = overlayCanvas.getContext('2d');

                if (overlayCtx) {
                  const overlayData = new Uint8ClampedArray(data.length);

                  // Process each pixel for the overlay
                  for (let i = 0; i < data.length; i += 4) {
                    const x = (i / 4) % targetCanvas.width;
                    const y = Math.floor((i / 4) / targetCanvas.width);

                    // Get displacement values from red and green channels (normalized to -1 to 1)
                    const dx = ((displacementData[i] / 255) * 2 - 1) * settings.xAmount;
                    const dy = ((displacementData[i + 1] / 255) * 2 - 1) * settings.yAmount;

                    // Calculate displacement intensity (0 to 1) based on grayscale value
                    const intensity = (displacementData[i] + displacementData[i + 1] + displacementData[i + 2]) / (255 * 3);

                    // Calculate source position with displacement
                    const sourceX = Math.round(x + dx);
                    const sourceY = Math.round(y + dy);

                    // No color aberration: all channels use the same source pixel
                    const srcIdx = (sourceY * targetCanvas.width + sourceX) * 4;

                    if (intensity > 0.05) {
                      overlayData[i] = data[srcIdx] || data[i];
                      overlayData[i + 1] = data[srcIdx + 1] || data[i + 1];
                      overlayData[i + 2] = data[srcIdx + 2] || data[i + 2];
                      overlayData[i + 3] = Math.min(255, intensity * 255 * 2);
                    } else {
                      overlayData[i] = 0;
                      overlayData[i + 1] = 0;
                      overlayData[i + 2] = 0;
                      overlayData[i + 3] = 0;
                    }
                  }

                  // Put the overlay on its canvas
                  overlayCtx.putImageData(new ImageData(overlayData, targetCanvas.width, targetCanvas.height), 0, 0);

                  // Draw original image first
                  ctx.putImageData(imageData, 0, 0);
                  
                  // Then draw the overlay on top with 'source-over' blending
                  ctx.globalCompositeOperation = 'source-over';
                  ctx.drawImage(overlayCanvas, 0, 0);
                }
              }
            }
          };
          
          await applyDistortion();
          break;
        
        case 'color':
          if (settings.enabled) {
            const colorSettings: ColorSettings = {
              enabled: true,
              hueShift: settings.hueShift !== undefined ? Number(settings.hueShift) : 0,
              saturation: settings.saturation !== undefined ? Number(settings.saturation) : 100,
              brightness: settings.brightness !== undefined ? Number(settings.brightness) : 100,
              contrast: settings.contrast !== undefined ? Number(settings.contrast) : 100,
              posterize: settings.posterize !== undefined ? Number(settings.posterize) : 0,
              invert: Boolean(settings.invert),
              glitchIntensity: settings.glitchIntensity !== undefined ? Number(settings.glitchIntensity) : 0,
              glitchSeed: settings.glitchSeed !== undefined ? Number(settings.glitchSeed) : Math.random(),
              blendMode: settings.blendMode || 'normal'
            };
            applyColorAdjustments(ctx, targetCanvas.width, targetCanvas.height, colorSettings);
          }
          break;
        case 'gradient':
          applyGradientMap(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true });
          break;
        case 'threshold':
          applyThreshold(ctx, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true } as ThresholdSettings);
          break;
        case 'halftone':
          applyHalftone(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true });
          break;
        case 'grid':
          const gridSettings = { ...settings, enabled: true };
          const grid = createGrid(targetCanvas.width, targetCanvas.height, gridSettings);
          grid.forEach(cell => renderGridCell(ctx, cell, targetCanvas, gridSettings));
          break;
        case 'dither':
          if (settings.enabled) {
            const ditherSettings = {
              enabled: true,
              type: settings.type || 'floyd-steinberg',
              threshold: Number(settings.threshold) || 128,
              colorMode: settings.colorMode || 'grayscale',
              resolution: Number(settings.resolution) || 30,
              colorDepth: Number(settings.colorDepth) || 2,
              darkColor: settings.darkColor || '#000000',
              lightColor: settings.lightColor || '#FFFFFF'
            };
            // Save current canvas state
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = targetCanvas.width;
            sourceCanvas.height = targetCanvas.height;
            const sourceCtx = sourceCanvas.getContext('2d');
            if (sourceCtx) {
              sourceCtx.drawImage(targetCanvas, 0, 0);
              // Apply dithering
              applyDithering(ctx, sourceCanvas, targetCanvas.width, targetCanvas.height, ditherSettings);
            }
          }
          break;
        case 'glitch':
          applyGlitch(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, { ...settings, masterEnabled: true });
          break;
        case 'blur':
          applyBlur(ctx, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true });
          break;
        case 'mosaicShift':
          applyMosaicShift(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true });
          break;
        case 'sliceShift':
          applySliceShift(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true });
          break;
        case 'posterize':
          applyPosterize(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'findEdges':
          applyFindEdges(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'blob':
          applyBlob(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'glow':
          applyGlow(ctx, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'polarPixel':
          applyPolarPixelEffect(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'pixel':
          applyPixelEffect(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'noise':
          applyNoiseEffect(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'linocut':
          applyLinocutEffect(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'levels':
          applyLevelsEffect(ctx, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'ascii':
          if (typeof applyAsciiEffect === 'function') {
            applyAsciiEffect(sourceCanvas, targetCanvas, settings);
          }
          break;
        case 'text':
          if (settings.enabled) {
            // Draw the source image
            ctx.drawImage(sourceCanvas, 0, 0);
            // Apply text effect
            applyTextEffect(ctx, targetCanvas, settings);
          } else {
            // If text effect is disabled, just copy the source image
            ctx.drawImage(sourceCanvas, 0, 0);
          }
          break;
        case 'lcd':
          applyLCDEffect(targetCanvas, settings);
          break;
        case 'snake':
          applySnakeEffect(ctx, sourceCanvas, targetCanvas.width, targetCanvas.height, settings);
          break;
        case 'threeD':
          applyThreeDEffect(ctx, sourceCanvas, targetCanvas.width, targetCanvas.height, settings as ThreeDEffectSettings);
          break;
        case 'shapegrid':
          applyShapeGridEffect(ctx, targetCanvas, targetCanvas.width, targetCanvas.height, { ...settings, enabled: true });
          break;
        case 'truchet':
          applyTruchetEffect(targetCanvas, settings as TruchetSettings);
          break;
        case 'paint':
          applyPaintEffect(ctx, targetCanvas, sourceCanvas, settings);
          break;
        default:
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
      
      if (ctx && sourceCtx && originalImageDataRef.current) {
        // Clear canvases
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const processWithImage = async (img: HTMLImageElement) => {
          // Draw image on source canvas using drawCoverImage to maintain aspect ratio
          drawCoverImage(sourceCtx, canvasWidth, canvasHeight, img);
          
          // Apply effects based on the effectInstances from settings
          if (settings.effectInstances) {
            const activeEffects = settings.effectInstances.filter(instance => instance.enabled);
            
            // Apply effects sequentially
            for (const instance of activeEffects) {
              // Get instance-specific settings
              const effectSettings = settings.instanceSettings?.[instance.id] || {};
              
              try {
                // Apply effect directly
                await applyEffectDirectly(instance.type, sourceCtx, sourceCanvasRef.current!, sourceCanvasRef.current!, effectSettings);
              } catch (error) {
                console.error(`Error applying effect ${instance.type}:`, error);
              }
            }
          }
          
          // Copy final result to main canvas
          ctx.drawImage(sourceCanvasRef.current!, 0, 0);
        };
        
        // Use the cached image if possible, otherwise create and cache a new one
        if (imageInstanceRef.current && originalImageDataRef.current === imageInstanceRef.current.src) {
          // Use the cached image
          processWithImage(imageInstanceRef.current);
        } else {
          // Create a new image and cache it
          const img = new Image();
          img.onload = () => {
            imageInstanceRef.current = img;
            processWithImage(img);
          };
          img.src = originalImageDataRef.current;
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
          { id: 'glitch-1', type: 'glitch', enabled: false },
          { id: 'grid-1', type: 'grid', enabled: false },
          { id: 'mosaicShift-1', type: 'mosaicShift', enabled: false },
          { id: 'sliceShift-1', type: 'sliceShift', enabled: false },
          { id: 'blob-1', type: 'blob', enabled: false },
          { id: 'shapegrid-1', type: 'shapegrid', enabled: false },
        ]);
      }
      
      // Process the image with the new settings
      processImage();
    }
  }, [canvasWidth, canvasHeight, originalImageDataRef, instanceSettings, effectInstances]);
  
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
        console.error('Error processing image:', error);
        alert('Error loading settings: ' + (error as Error).message);
      }
    }
  };

  // Helper function to get default 3D settings
  function getDefaultThreeDSettings(): ThreeDEffectSettings {
    return {
      enabled: true,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1,
      backgroundColor: '#000000',
      perspective: 45,
      distance: 500
    };
  }

  // Add text effect settings state
  const [textEffectSettings, setTextEffectSettings] = useState<TextEffectSettings>({
    enabled: true,
    text: 'Hello World',
    fontSize: 24,
    fontWeight: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    color: '#000000',
    x: 0.5,
    y: 0.5,
    align: 'center',
    textStyle: 'fill',
    strokeWeight: 1,
    blendMode: 'source-over'
  });

  // Add Snake effect settings state
  const [snakeEffectSettings, setSnakeEffectSettings] = useState<SnakeEffectSettings>({
    enabled: false,
    gridSize: 20,
    colorCount: 8,
    cornerRadius: 5,
    colorMode: 'grayscale',
    padding: 4,
    backgroundColor: '#ffffff',
    outlineStyle: 'pixel',
    shape: 'row'
  });

  // Export-related state
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

  // Helper: List of size-dependent fields for each effect type
  const SIZE_DEPENDENT_FIELDS: Record<string, string[]> = {
    text: ['fontSize', 'strokeWeight'], // Only scale absolute pixel values; letterSpacing is a multiplier
    pixel: ['cellSize', 'offGridSize', 'minBlockSize', 'maxBlockSize', 'rings', 'segments', 'voronoiSeeds', 'ringCount'],
    ascii: ['cellSize', 'fontSize', 'jitter'],
    blob: ['cellSize', 'minDistance', 'maxDistance', 'angleOffset', 'sizeVariation', 'dotScaleFactor', 'connectionStrength'],
    shapegrid: ['gridSize'],
    halftone: ['cellSize', 'dotSize', 'lineWidth'],
    grid: ['cellSize', 'lineWidth'],
    linocut: ['lineSpacing', 'strokeWidth', 'minLine', 'scale'],
    lcd: ['cellWidth', 'cellHeight', 'padding', 'pixelSize'],
    threeD: ['scale', 'perspective', 'distance'],
    glitch: ['glitchSize', 'blocksSize', 'blocksOffset', 'scanLinesCount', 'channelShiftAmount'],
    blur: ['radius', 'centerRadius', 'centerGradient', 'focusWidth', 'gradient'],
    mosaicShift: ['cellSize', 'shiftAmount', 'minCellSize'],
    sliceShift: ['sliceHeight', 'shiftAmount', 'minSliceHeight'],
    findEdges: ['threshold', 'edgeWidth'],
    glow: ['softness', 'threshold'],
    noise: ['scale', 'intensity'],
    levels: [], // No size-dependent fields
    posterize: [], // No size-dependent fields
    color: [], // No size-dependent fields
    threshold: [], // No size-dependent fields
    gradient: [], // No size-dependent fields
    distort: [], // No size-dependent fields
    dither: [], // No size-dependent fields
    snake: ['gridSize', 'padding', 'cornerRadius'],
    truchet: ['tileSize', 'lineWidth'],
    polarPixel: ['rings', 'segments']
  };

  function scaleEffectSettingsForExport(effectType: string, settings: any, scale: number): any {
    if (!SIZE_DEPENDENT_FIELDS[effectType]) return settings;
    const scaled = { ...settings };
    for (const key of SIZE_DEPENDENT_FIELDS[effectType]) {
      if (typeof scaled[key] === 'number') {
        scaled[key] = scaled[key] * scale;
      }
    }
    return scaled;
  }

  // New helper function to apply effects to a canvas at original image resolution for export
  const applyEffectsToCanvasForExport = useCallback(async (
    imageDataUrl: string,
    effectInstances: EffectInstance[],
    getInstanceSettings: (instance: EffectInstance) => any,
    applyEffectDirectly: (
      effectType: string,
      ctx: CanvasRenderingContext2D,
      targetCanvas: HTMLCanvasElement,
      sourceCanvas: HTMLCanvasElement,
      settings: any
    ) => Promise<void>
  ): Promise<HTMLCanvasElement> => {
    const originalImage = new Image();
    await new Promise<void>((resolve, reject) => {
      originalImage.onload = () => resolve();
      originalImage.onerror = reject;
      originalImage.src = imageDataUrl;
    });

    // --- Begin: Use original image size for export ---
    const exportWidth = originalImage.naturalWidth;
    const exportHeight = originalImage.naturalHeight;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportWidth;
    tempCanvas.height = exportHeight;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context for export');

    const offscreenSourceCanvas = document.createElement('canvas');
    offscreenSourceCanvas.width = exportWidth;
    offscreenSourceCanvas.height = exportHeight;
    const offscreenSourceCtx = offscreenSourceCanvas.getContext('2d', { willReadFrequently: true });
    if (!offscreenSourceCtx) throw new Error('Could not get offscreen canvas context for export');

    // Use drawCoverImage to fill the export canvas
    drawCoverImage(
      offscreenSourceCtx,
      exportWidth,
      exportHeight,
      originalImage
    );

    const enabledEffects = effectInstances.filter(instance => instance.enabled);
    if (enabledEffects.length === 0) {
      ctx.drawImage(originalImage, 0, 0, exportWidth, exportHeight);
      return tempCanvas;
    }

    // Compute scale factor between display and export
    const displayWidth = canvasRef.current ? canvasRef.current.width : exportWidth;
    const scale = exportWidth / displayWidth;

    const MAX_EFFECTS = 10;
    const effectsToProcess = enabledEffects.slice(0, MAX_EFFECTS);

    if (effectsToProcess.length === 1) {
      const instance = effectsToProcess[0];
      let settings = getInstanceSettings(instance);
      settings = scaleEffectSettingsForExport(instance.type, settings, scale);
      await applyEffectDirectly(instance.type, offscreenSourceCtx, offscreenSourceCanvas, offscreenSourceCanvas, settings);
      ctx.drawImage(offscreenSourceCanvas, 0, 0, exportWidth, exportHeight);
    } else {
      const tempCanvas1 = document.createElement('canvas');
      tempCanvas1.width = exportWidth;
      tempCanvas1.height = exportHeight;
      const tempCtx1 = tempCanvas1.getContext('2d', { willReadFrequently: true });

      const tempCanvas2 = document.createElement('canvas');
      tempCanvas2.width = exportWidth;
      tempCanvas2.height = exportHeight;
      const tempCtx2 = tempCanvas2.getContext('2d', { willReadFrequently: true });

      if (!tempCtx1 || !tempCtx2) {
        ctx.drawImage(offscreenSourceCanvas, 0, 0, exportWidth, exportHeight);
      } else {
        tempCtx1.drawImage(offscreenSourceCanvas, 0, 0, exportWidth, exportHeight);

        for (const instance of effectsToProcess) {
          let settings = getInstanceSettings(instance);
          settings = scaleEffectSettingsForExport(instance.type, settings, scale);
          const isLast = instance === effectsToProcess[effectsToProcess.length - 1];

          const srcCanvas = effectsToProcess.indexOf(instance) % 2 === 0 ? tempCanvas1 : tempCanvas2;
          const destCanvas = effectsToProcess.indexOf(instance) % 2 === 0 ? tempCanvas2 : tempCanvas1;
          const destCtx = effectsToProcess.indexOf(instance) % 2 === 0 ? tempCtx2 : tempCtx1;

          if (!isLast) {
            destCtx.clearRect(0, 0, exportWidth, exportHeight);
            destCtx.drawImage(srcCanvas, 0, 0, exportWidth, exportHeight);
            try {
              await applyEffectDirectly(instance.type, destCtx, destCanvas, srcCanvas, settings);
            } catch (err) {
              console.error(`Error processing effect ${instance.type} for export:`, err);
              destCtx.clearRect(0, 0, exportWidth, exportHeight);
              destCtx.drawImage(srcCanvas, 0, 0, exportWidth, exportHeight);
            }
          } else {
            ctx.clearRect(0, 0, exportWidth, exportHeight);
            ctx.drawImage(srcCanvas, 0, 0, exportWidth, exportHeight);
            try {
              await applyEffectDirectly(instance.type, ctx, tempCanvas, srcCanvas, settings);
            } catch (err) {
              console.error(`Error processing final effect ${instance.type} for export:`, err);
              ctx.clearRect(0, 0, exportWidth, exportHeight);
              ctx.drawImage(srcCanvas, 0, 0, exportWidth, exportHeight);
            }
          }
        }
      }
    }
    return tempCanvas;
    // --- End: Use original image size for export ---
  }, [effectInstances, getInstanceSettings, applyEffectDirectly]);

  const handleExportPng = async () => {
    if (!canvasRef.current || !originalImageDataRef.current) {
      alert('Please upload an image first.');
      return;
    }
    setExporting(true);
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `imagetweaker-${timestamp}.png`;

    try {
      // Load the original image to get its dimensions
      const originalImage = new Image();
      originalImage.onload = async () => {
        console.log('Export: Original image loaded', originalImage.naturalWidth, 'x', originalImage.naturalHeight);
        
        // Create export canvas at DISPLAY resolution (not original image resolution)
        // This ensures the export exactly matches what's displayed on screen
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight;
        const exportCtx = exportCanvas.getContext('2d', { willReadFrequently: true });
        
        if (!exportCtx) {
          alert('Failed to create export canvas');
          setExporting(false);
          return;
        }

        // Create source canvas at DISPLAY resolution
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = canvasWidth;
        sourceCanvas.height = canvasHeight;
        const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
        
        if (!sourceCtx) {
          alert('Failed to create source canvas');
          setExporting(false);
          return;
        }

        // Step 1: Draw the original image stretched to fill the source canvas
        // This EXACTLY replicates what happens on screen: sourceCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        console.log('Export: Drawing image to source canvas');
        sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        sourceCtx.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);
        
        // Debug: Check if image was drawn
        const imageData = sourceCtx.getImageData(0, 0, Math.min(100, canvasWidth), Math.min(100, canvasHeight));
        const hasPixels = imageData.data.some(pixel => pixel > 0);
        console.log('Export: Image drawn to source canvas:', hasPixels);

        // Step 2: Apply all effects exactly like on screen (no scaling needed!)
        const enabledEffects = effectInstances.filter(instance => instance.enabled);
        console.log('Export: Enabled effects:', enabledEffects.map(e => e.type));
        
        if (enabledEffects.length === 0) {
          // No effects - just copy source to export canvas
          console.log('Export: No effects, copying source to export');
          exportCtx.drawImage(sourceCanvas, 0, 0);
        } else {
          // No scaling needed since we're using the same canvas size as display
          console.log('Export: Processing multiple effects sequentially');
          
          // Process effects sequentially using the same logic as on-screen
          let currentCanvas = sourceCanvas;
          let currentCtx = sourceCtx;
          
          for (let i = 0; i < enabledEffects.length; i++) {
            const instance = enabledEffects[i];
            const settings = getInstanceSettings(instance);
            
            console.log(`Export: Processing effect ${i + 1}/${enabledEffects.length}: ${instance.type}`);
            
            if (i === enabledEffects.length - 1) {
              // Last effect - draw directly to export canvas
              exportCtx.drawImage(currentCanvas, 0, 0);
              await applyEffectDirectly(instance.type, exportCtx, exportCanvas, currentCanvas, settings);
            } else {
              // Intermediate effect - use temporary canvas
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = canvasWidth;
              tempCanvas.height = canvasHeight;
              const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
              
              if (!tempCtx) continue;
              
              tempCtx.drawImage(currentCanvas, 0, 0);
              await applyEffectDirectly(instance.type, tempCtx, tempCanvas, currentCanvas, settings);
              
              currentCanvas = tempCanvas;
              currentCtx = tempCtx;
            }
          }
        }
        
        // Step 3: Scale the final result to the original image resolution
        console.log('Export: Scaling final result to original resolution');
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = originalImage.naturalWidth;
        finalCanvas.height = originalImage.naturalHeight;
        const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
        
        if (!finalCtx) {
          alert('Failed to create final canvas');
          setExporting(false);
          return;
        }
        
        // Use high-quality scaling to scale up to original resolution
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(exportCanvas, 0, 0, originalImage.naturalWidth, originalImage.naturalHeight);
        
        // Export the final high-resolution result
        finalCanvas.toBlob(async (blob) => {
          if (blob) {
            const finalBlob = await addPngMetadata(blob, {
              'Software': 'ImageTweaker',
              'Author': 'ImageTweaker',
              'Website': 'https://imagetweaker.com'
            });
            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          }
          setExporting(false);
        }, 'image/png');
      };
      
      originalImage.onerror = () => {
        console.error('Export: Failed to load original image');
        alert('Failed to load original image for export');
        setExporting(false);
      };
      
      console.log('Export: Loading original image from:', originalImageDataRef.current.substring(0, 50) + '...');
      originalImage.src = originalImageDataRef.current;
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
      setExporting(false);
    }
  };

  // Helper function to scale effect settings for export
  const scaleEffectSettings = (settings: any, scaleX: number, scaleY: number, effectType: string): any => {
    const scaledSettings = { ...settings };
    const sizeFields = SIZE_DEPENDENT_FIELDS[effectType] || [];
    
    console.log(`Export: Scaling ${effectType} settings with scaleX=${scaleX}, scaleY=${scaleY}`);
    console.log('Export: Original settings:', settings);
    
    for (const field of sizeFields) {
      if (scaledSettings[field] !== undefined) {
        const originalValue = scaledSettings[field];
        if (field.includes('X') || field.includes('Width') || field.includes('horizontal')) {
          scaledSettings[field] = scaledSettings[field] * scaleX;
        } else if (field.includes('Y') || field.includes('Height') || field.includes('vertical')) {
          scaledSettings[field] = scaledSettings[field] * scaleY;
        } else {
          // For general size fields, use the average scale factor
          scaledSettings[field] = scaledSettings[field] * ((scaleX + scaleY) / 2);
        }
        console.log(`Export: Scaled ${field} from ${originalValue} to ${scaledSettings[field]}`);
      }
    }
    
    console.log('Export: Final scaled settings:', scaledSettings);
    return scaledSettings;
  };

  // Export SVG with scale
  const handleExportSvg = () => {
    if (!canvasRef.current) return;
    exportCanvasAsSvg(canvasRef.current, exportScale / 100);
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
    if (!image || !originalImageDataRef.current) return;
    setShouldGenerateCropData(true);
    setShowCropEditor(true);
    setTimeout(() => {
      processImage();
      setIsCropping(true);
    }, 0);
  }, [image, processImage, setShouldGenerateCropData, setShowCropEditor, setIsCropping]);

  const resetEffect = (effectType: keyof Effects) => {
    setEffects((prev: Effects) => {
      const newEffects = { ...prev };
      if (effectType === 'distort') {
        newEffects[effectType] = {
          enabled: false,
          xAmount: 0,
          yAmount: 0,
          displacementMap: null,
          preserveAspectRatio: true,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          smoothness: 0
        };
      } else {
        newEffects[effectType] = {
          enabled: false
        };
      }
      return newEffects;
    });
  };

  const [effects, setEffects] = useState<Effects>({
    distort: {
      enabled: false,
      xAmount: 0,
      yAmount: 0,
      displacementMap: null,
      preserveAspectRatio: true,
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      smoothness: 0
    },
    // ... other effects
  });

  // Add state for new layer modal and blank canvas
  const [showNewLayerModal, setShowNewLayerModal] = useState(false);

  // Preset dimensions and aspect ratios
  const layerPresets = [
    { label: '1024 x 768 (4:3)', width: 1024, height: 768, ratio: '4:3' },
    { label: '1920 x 1080 (16:9)', width: 1920, height: 1080, ratio: '16:9' },
    { label: '1080 x 1080 (1:1)', width: 1080, height: 1080, ratio: '1:1' },
    { label: '800 x 1200 (2:3)', width: 800, height: 1200, ratio: '2:3' },
  ];

  // New layer modal state
  const [newLayerWidth, setNewLayerWidth] = useState(1024);
  const [newLayerHeight, setNewLayerHeight] = useState(768);
  const [newLayerRatio, setNewLayerRatio] = useState('4:3');
  const [newLayerLockRatio, setNewLayerLockRatio] = useState(true);
  const [newLayerColor, setNewLayerColor] = useState('#ffffff');

  // Handle ratio lock
  useEffect(() => {
    if (newLayerLockRatio && newLayerRatio !== 'custom') {
      const [w, h] = newLayerRatio.split(':').map(Number);
      setNewLayerHeight(Math.round(newLayerWidth * h / w));
    }
  }, [newLayerWidth, newLayerLockRatio, newLayerRatio]);

  // Handle preset click
  const handlePreset = (preset: typeof layerPresets[0]) => {
    setNewLayerWidth(preset.width);
    setNewLayerHeight(preset.height);
    setNewLayerRatio(preset.ratio);
  };

  // Handle create blank layer
  const handleCreateBlankLayer = () => {
    // 1. Generate a high-res PNG at the chosen resolution
    const originalWidth = newLayerWidth;
    const originalHeight = newLayerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d');
    let dataUrl = '';
    if (ctx) {
      ctx.fillStyle = newLayerColor;
      ctx.fillRect(0, 0, originalWidth, originalHeight);
      dataUrl = canvas.toDataURL('image/png');
    }
    // 2. Store the high-res PNG as the original image
    originalImageDataRef.current = dataUrl;

    // 3. Calculate display size to fit viewport (like uploaded images)
    const viewportWidth = window.innerWidth - 80;
    const viewportHeight = window.innerHeight - 200;
    let displayWidth = originalWidth;
    let displayHeight = originalHeight;
    if (originalWidth > viewportWidth || originalHeight > viewportHeight) {
      const widthRatio = viewportWidth / originalWidth;
      const heightRatio = viewportHeight / originalHeight;
      const scaleFactor = Math.min(widthRatio, heightRatio);
      displayWidth = Math.round(originalWidth * scaleFactor);
      displayHeight = Math.round(originalHeight * scaleFactor);
    }
    setCanvasWidth(displayWidth);
    setCanvasHeight(displayHeight);
    setAspectRatio('custom');
    setImage(dataUrl); // The display image is the same dataUrl, but canvas is scaled
    setShowNewLayerModal(false);
  };

  // Add this after the other useEffects for image/canvas changes
  useEffect(() => {
    processImage();
  }, [instanceSettings, effectInstances]);

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
                  onClick={() => setShowNewLayerModal(true)}
                  className="px-2 py-1 bg-[var(--topbar-bg)] text-[var(--text-primary)] text-xs rounded hover:bg-[var(--secondary-bg)] transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                >
                  <FiLayers size={16} />
                  <span className="hidden sm:inline">New Layer</span>
                </button>
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
                    originalImageDataRef.current = null; // Reset the URL reference
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
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border-color)] hover:border-emerald-500/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium text-[var(--text-secondary)] pp-mondwest-font">
                    {isLoading ? 'Loading random image...' : 'Drag & drop an image here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
                </div>
              </div>
            )}
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
            gradientMapSettings={gradientMapSettings}
            gridSettings={gridSettings}
            effectInstances={effectInstances}
            instanceSettings={instanceSettings}
            updateDitherSettings={(settings) => setDitherSettings(prev => ({ ...prev, ...settings }))}
            updateHalftoneSettings={(settings: Partial<HalftoneSettings>) => setHalftoneSettings(prev => ({ ...prev, ...settings }))}
            updateColorSettings={(settings: Partial<ColorSettings>) => setColorSettings(prev => ({ ...prev, ...settings }))}
            updateThresholdSettings={(settings) => setThresholdSettings(prev => ({ ...prev, ...settings }))}
            updateGlitchSettings={(settings) => setGlitchSettings(prev => ({ ...prev, ...settings }))}
            updateGradientMapSettings={(settings) => setGradientMapSettings(prev => ({ ...prev, ...settings }))}
            updateGridSettings={(key: string, value: any) => setGridSettings(prev => ({ ...prev, [key]: value }))}
            updateInstanceSettings={updateInstanceSettings}
            updateEffectInstances={updateEffectInstances}
            addEffect={addEffect}
            duplicateEffect={duplicateEffect}
            removeEffect={removeEffect}
            onResetImage={() => {
              setImage(null);
              originalImageDataRef.current = null;
            }}
            onExportPng={() => canvasRef.current && exportCanvasAsPng(canvasRef.current)}
            onExportSvg={() => canvasRef.current && exportCanvasAsSvg(canvasRef.current)}
            onExportVideo={handleExportVideo}
            onSaveSettings={() => {}}
            onLoadSettings={() => {}}
            onUploadImage={() => {}}
            onCropImage={handleCropImage}
            onRandomImage={loadRandomImage}
            onClearImage={() => {
              setImage(null);
              originalImageDataRef.current = null;
            }}
            processImageCallback={processImage}
            textEffectSettings={textEffectSettings}
            updateTextEffectSettings={(settings: Partial<TextEffectSettings>) => setTextEffectSettings(prev => ({ ...prev, ...settings }))}
            snakeEffectSettings={snakeEffectSettings}
            updateSnakeEffectSettings={(settings: Partial<SnakeEffectSettings>) => setSnakeEffectSettings(prev => ({ ...prev, ...settings }))}
            truchetSettings={truchetSettings}
            updateTruchetSettings={(settings: Partial<TruchetSettings>) => setTruchetSettings(prev => ({ ...prev, ...settings }))}
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

      {/* Show crop editor when active */}
      {(showCropEditor || isCropping) && image && originalImageDataRef.current && (
        <CropEditor
          imageUrl={originalImageDataRef.current}
          modifiedImageUrl={isCropping && canvasRef.current ? canvasRef.current.toDataURL() : image}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropEditor(false);
            setIsCropping(false);
          }}
        />
      )}

      {showNewLayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[var(--accent-bg)] p-6 rounded-lg shadow-xl w-full max-w-md border border-[var(--border-color)]">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiLayers /> New Layer</h2>
            <div className="mb-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {layerPresets.map(preset => (
                  <button
                    key={preset.label}
                    className={`px-2 py-1 rounded text-xs font-mono border ${newLayerWidth === preset.width && newLayerHeight === preset.height ? 'bg-[var(--accent-color)] text-[var(--accent-text)]' : 'bg-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)]/80'}`}
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min={1}
                  max={4096}
                  value={newLayerWidth}
                  onChange={e => {
                    const value = Number(e.target.value);
                    setNewLayerWidth(value);
                    if (newLayerLockRatio && newLayerRatio !== 'custom') {
                      const [w, h] = newLayerRatio.split(':').map(Number);
                      setNewLayerHeight(Math.round(value * h / w));
                    }
                  }}
                  className="w-20 px-2 py-1 rounded border text-xs font-mono text-[var(--text-primary)] bg-[var(--input-bg)]"
                  placeholder="Width"
                />
                <span>x</span>
                <input
                  type="number"
                  min={1}
                  max={4096}
                  value={newLayerHeight}
                  onChange={e => {
                    const value = Number(e.target.value);
                    setNewLayerHeight(value);
                    if (newLayerLockRatio && newLayerRatio !== 'custom') {
                      const [w, h] = newLayerRatio.split(':').map(Number);
                      setNewLayerWidth(Math.round(value * w / h));
                    }
                  }}
                  className="w-20 px-2 py-1 rounded border text-xs font-mono text-[var(--text-primary)] bg-[var(--input-bg)]"
                  placeholder="Height"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newLayerLockRatio}
                    onChange={e => setNewLayerLockRatio(e.target.checked)}
                  />
                  Lock Ratio
                </label>
                <select
                  value={newLayerRatio}
                  onChange={e => setNewLayerRatio(e.target.value)}
                  className="px-1 py-1 rounded border text-xs font-mono text-[var(--text-primary)] bg-[var(--input-bg)]"
                >
                  <option value="custom">Custom</option>
                  <option value="1:1">1:1</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9</option>
                  <option value="2:3">2:3</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="text-xs mr-2">Background Color:</label>
                <input
                  type="color"
                  value={newLayerColor}
                  onChange={e => setNewLayerColor(e.target.value)}
                  className="w-8 h-8 p-0 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
                onClick={() => setShowNewLayerModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                onClick={handleCreateBlankLayer}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 