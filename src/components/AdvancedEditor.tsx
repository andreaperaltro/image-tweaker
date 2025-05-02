'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ColorSettings, applyColorAdjustments } from './ColorUtils'
import { GridSettings, GridCell, createGrid, renderGridCell } from './Grid'
import { HalftoneSettings, HalftoneArrangement, HalftoneShape, applyHalftone } from './Halftone'
import { exportAsPng, exportAsSvg } from './SvgExport'
import { exportCanvasAsPng, exportCanvasAsSvg } from './ExportUtils'
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
import { EffectSettings } from '../utils/EffectSettingsUtils'

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
  effectsOrder: string[];
  updateDitherSettings: (settings: Partial<DitherSettings>) => void;
  updateHalftoneSettings: (setting: keyof HalftoneSettings, value: any) => void;
  updateColorSettings: (setting: keyof ColorSettings, value: any) => void;
  updateThresholdSettings: (settings: Partial<ThresholdSettings>) => void;
  updateGlitchSettings: (settings: Partial<GlitchSettings>) => void;
  updateTextDitherSettings: (settings: Partial<TextDitherSettings>) => void;
  updateGradientMapSettings: (settings: Partial<GradientMapSettings>) => void;
  updateGridSettings: (setting: keyof GridSettings, value: any) => void;
  updateEffectsOrder: (order: string[]) => void;
  onResetImage: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onCropImage: () => void;
  blur: BlurSettings;
  onBlurChange: (settings: BlurSettings) => void;
  onSettingsLoaded: (settings: EffectSettings) => void;
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
    type: 'ordered' as 'ordered',
    threshold: 128,
    colorMode: 'grayscale' as 'grayscale',
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

  // Effects order
  const [effectsOrder, setEffectsOrder] = useState([
    'color',
    'blur',
    'gradient',
    'threshold',
    'dither',
    'halftone',
    'textDither',
    'glitch',
    'grid'
  ]);

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

  // Initialize the source canvas
  useEffect(() => {
    sourceCanvasRef.current = document.createElement('canvas');
  }, []);

  // Handle file drop
  const onDrop = (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageData = e.target.result as string;
          console.log('Image loaded, setting image state');
          setImage(imageData);
          setOriginalImageDataRef(imageData);
          
          // Adjust canvas to match image aspect ratio while fitting viewport
          const img = new Image();
          img.onload = () => {
            // Get viewport dimensions
            const viewportWidth = window.innerWidth - 80; // Account for margins/padding
            const viewportHeight = window.innerHeight - 200; // Account for header/footer/margins
            
            // Calculate dimensions to maintain aspect ratio while fitting viewport
            let newWidth = img.width;
            let newHeight = img.height;
            
            // Scale down if larger than viewport
            if (newWidth > viewportWidth) {
              const ratio = viewportWidth / newWidth;
              newWidth = viewportWidth;
              newHeight = newHeight * ratio;
            }
            
            if (newHeight > viewportHeight) {
              const ratio = viewportHeight / newHeight;
              newHeight = viewportHeight;
              newWidth = newWidth * ratio;
            }
            
            // Update canvas dimensions
            setCanvasWidth(Math.round(newWidth));
            setCanvasHeight(Math.round(newHeight));
            setAspectRatio('custom');
          };
          img.src = imageData;
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  });

  // Apply aspect ratio when changed
  useEffect(() => {
    if (!lockRatio || aspectRatio === 'custom') return;
    
    let ratio = 1;
    switch (aspectRatio) {
      case '1:1':
        ratio = 1;
        break;
      case '4:3':
        ratio = 4/3;
        break;
      case '16:9':
        ratio = 16/9;
        break;
      case '3:2':
        ratio = 3/2;
        break;
      case '5:4':
        ratio = 5/4;
        break;
      case '2:1':
        ratio = 2;
        break;
      case '3:4':
        ratio = 3/4;
        break;
      case '9:16':
        ratio = 9/16;
        break;
      case '2:3':
        ratio = 2/3;
        break;
      case '4:5':
        ratio = 4/5;
        break;
      case '1:2':
        ratio = 1/2;
        break;
      default:
        ratio = canvasWidth / canvasHeight;
    }
    
    if (orientation === 'landscape') {
      setCanvasHeight(Math.round(canvasWidth / ratio));
    } else {
      setCanvasWidth(Math.round(canvasHeight * ratio));
    }
  }, [aspectRatio, orientation, lockRatio]);

  // Handle width change with locked ratio
  const handleWidthChange = (newWidth: number) => {
    setCanvasWidth(newWidth);
    if (lockRatio && aspectRatio !== 'custom') {
      let ratio = 1;
      switch (aspectRatio) {
        case '1:1':
          ratio = 1;
          break;
        case '4:3':
          ratio = 4/3;
          break;
        case '16:9':
          ratio = 16/9;
          break;
        case '3:2':
          ratio = 3/2;
          break;
        case '5:4':
          ratio = 5/4;
          break;
        case '2:1':
          ratio = 2;
          break;
        case '3:4':
          ratio = 3/4;
          break;
        case '9:16':
          ratio = 9/16;
          break;
        case '2:3':
          ratio = 2/3;
          break;
        case '4:5':
          ratio = 4/5;
          break;
        case '1:2':
          ratio = 1/2;
          break;
      }
      
      if (orientation === 'landscape') {
        setCanvasHeight(Math.round(newWidth / ratio));
      } else {
        setCanvasHeight(Math.round(newWidth * (1/ratio)));
      }
    }
  };

  // Handle height change with locked ratio
  const handleHeightChange = (newHeight: number) => {
    setCanvasHeight(newHeight);
    if (lockRatio && aspectRatio !== 'custom') {
      let ratio = 1;
      switch (aspectRatio) {
        case '1:1':
          ratio = 1;
          break;
        case '4:3':
          ratio = 4/3;
          break;
        case '16:9':
          ratio = 16/9;
          break;
        case '3:2':
          ratio = 3/2;
          break;
        case '5:4':
          ratio = 5/4;
          break;
        case '2:1':
          ratio = 2;
          break;
        case '3:4':
          ratio = 3/4;
          break;
        case '9:16':
          ratio = 9/16;
          break;
        case '2:3':
          ratio = 2/3;
          break;
        case '4:5':
          ratio = 4/5;
          break;
        case '1:2':
          ratio = 1/2;
          break;
      }
      
      if (orientation === 'landscape') {
        setCanvasWidth(Math.round(newHeight * ratio));
      } else {
        setCanvasWidth(Math.round(newHeight / (1/ratio)));
      }
    }
  };

  // Toggle orientation
  const toggleOrientation = () => {
    const newOrientation = orientation === 'landscape' ? 'portrait' : 'landscape';
    setOrientation(newOrientation);
    
    // Invert the aspect ratio when toggling orientation (e.g., 16:9 -> 9:16)
    if (aspectRatio !== 'custom') {
      // Get current aspect ratio parts (e.g., "16:9" -> [16, 9])
      const ratioParts = aspectRatio.split(':').map(Number);
      if (ratioParts.length === 2) {
        // Invert the ratio (e.g., [16, 9] -> [9, 16])
        const invertedRatio = `${ratioParts[1]}:${ratioParts[0]}`;
        setAspectRatio(invertedRatio as AspectRatioPreset);
        
        // Update dimensions based on the inverted ratio
        if (lockRatio) {
          if (newOrientation === 'landscape') {
            // Switch to landscape: make width larger than height
            const ratio = ratioParts[1] / ratioParts[0]; // Inverted ratio
            setCanvasWidth(Math.round(canvasHeight * ratio));
          } else {
            // Switch to portrait: make height larger than width
            const ratio = ratioParts[0] / ratioParts[1]; // Inverted ratio
            setCanvasHeight(Math.round(canvasWidth * ratio));
          }
        }
      } else {
        // For simple ratios like 1:1 or custom, just swap dimensions
        if (lockRatio) {
          const temp = canvasWidth;
          setCanvasWidth(canvasHeight);
          setCanvasHeight(temp);
        }
      }
    } else {
      // For custom ratio, just swap dimensions
      if (lockRatio) {
        const temp = canvasWidth;
        setCanvasWidth(canvasHeight);
        setCanvasHeight(temp);
      }
    }
  };

  // Load random image
  const loadRandomImage = useCallback(() => {
    setIsLoading(true);
    
    fetch('https://picsum.photos/800')
      .then(response => response.blob())
      .then(blob => {
        return new Promise<{ width: number; height: number }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageData = e.target?.result as string;
            if (!imageData) {
              throw new Error('Failed to load image data');
            }
            
            setImage(imageData);
            setOriginalImageDataRef(imageData);
            
            const img = new Image();
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.src = imageData;
          };
          reader.readAsDataURL(blob);
        });
      })
      .then(({ width, height }) => {
        setCanvasWidth(width);
        setCanvasHeight(height);
        setAspectRatio('custom');
      })
      .catch(error => {
        console.error('Error loading random image:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [setCanvasWidth, setCanvasHeight, setAspectRatio, setImage, setOriginalImageDataRef, setIsLoading]);

  // Reset to original image
  const resetImage = () => {
    // Reset all settings to their defaults
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
    
    // Reset gradient map settings
    setGradientMapSettings({
      enabled: false,
      stops: [
        { position: 0, color: '#000000' },
        { position: 50, color: '#808080' },
        { position: 100, color: '#ffffff' }
      ],
      blendMode: 'normal',
      opacity: 1
    });
    
    // Reset threshold settings
    setThresholdSettings({
      enabled: false,
      mode: 'solid',
      threshold: 128,
      darkColor: '#000000',
      lightColor: '#ffffff',
      darkColorStart: '#000000',
      darkColorEnd: '#404040',
      lightColorStart: '#BFBFBF',
      lightColorEnd: '#ffffff'
    });
    
    // Reset halftone settings
    setHalftoneSettings({
      enabled: false,
      cellSize: 8,
      mix: 100,
      colored: false,
      enableCMYK: false,
      arrangement: 'grid',
      shape: 'circle',
      angleOffset: 45,
      sizeVariation: 0,
      dotScaleFactor: 1,
      invertBrightness: false,
      spiralTightness: 0.1,
      spiralExpansion: 1,
      spiralRotation: 0,
      spiralCenterX: 0,
      spiralCenterY: 0,
      concentricCenterX: 0,
      concentricCenterY: 0,
      concentricRingSpacing: 1,
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
    
    // Reset dither settings
    setDitherSettings({
      enabled: false,
      type: 'ordered',
      threshold: 128,
      colorMode: 'grayscale',
      resolution: 8,
      colorDepth: 2,
      darkColor: '#000000',
      lightColor: '#ffffff'
    });
    
    // Reset text dither settings
    setTextDitherSettings({
      enabled: false,
      text: 'Hello',
      fontSize: 12,
      fontFamily: 'monospace',
      colorMode: 'monochrome',
      contrast: 1,
      brightness: 0.5,
      invert: false,
      resolution: 2
    });
    
    // Reset glitch settings
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

    // Process the image with reset settings
    processImage();
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

  const processImage = useCallback(() => {
    if (!image || !canvasRef.current || !sourceCanvasRef.current) return;
    
    setProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const sourceCanvas = sourceCanvasRef.current;
    const sourceCtx = sourceCanvas.getContext('2d');
    
    if (!ctx || !sourceCtx) {
      setProcessing(false);
      return;
    }
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    sourceCanvas.width = canvasWidth;
    sourceCanvas.height = canvasHeight;
    
    // Load and draw the image
    const img = new Image();
    img.onload = () => {
      // Clear canvases
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw image on source canvas
      sourceCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      
      // Apply effects in the order specified by effectsOrder
      effectsOrder.forEach(effectType => {
        switch (effectType) {
          case 'color':
            if (colorSettings.enabled) {
              applyColorAdjustments(sourceCtx, canvasWidth, canvasHeight, colorSettings);
            }
            break;
            
          case 'gradient':
            if (gradientMapSettings.enabled) {
              applyGradientMap(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, gradientMapSettings);
            }
            break;
            
          case 'threshold':
            if (thresholdSettings.enabled) {
              applyThreshold(sourceCtx, canvasWidth, canvasHeight, thresholdSettings);
            }
            break;
            
          case 'halftone':
            if (halftoneSettings.enabled) {
              applyHalftone(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, halftoneSettings);
            }
            break;
            
          case 'grid':
            if (gridSettings.enabled) {
              const grid = createGrid(canvasWidth, canvasHeight, gridSettings);
              grid.forEach(cell => renderGridCell(sourceCtx, cell, sourceCanvas, gridSettings));
            }
            break;
            
          case 'dither':
            if (ditherSettings.enabled) {
              applyDithering(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, ditherSettings);
            }
            break;
            
          case 'textDither':
            if (textDitherSettings.enabled) {
              applyTextDither(sourceCtx, canvasWidth, canvasHeight, textDitherSettings);
            }
            break;
            
          case 'glitch':
            if (glitchSettings.masterEnabled) {
              applyGlitch(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, glitchSettings);
            }
            break;

          case 'blur':
            if (blur.enabled) {
              applyBlur(sourceCtx, canvasWidth, canvasHeight, blur);
            }
            break;
        }
      });
      
      // Copy final result to main canvas
      ctx.drawImage(sourceCanvas, 0, 0);
      
      // Store the processed image data for cropping
      setCropImageData(canvas.toDataURL());
      
      setProcessing(false);
    };
    
    img.src = image;
  }, [
    image,
    canvasWidth,
    canvasHeight,
    colorSettings,
    thresholdSettings,
    halftoneSettings,
    gridSettings,
    ditherSettings,
    textDitherSettings,
    glitchSettings,
    gradientMapSettings,
    effectsOrder,
    blur
  ]);

  // Process image when it changes
  useEffect(() => {
    if (image) {
      processImage();
    }
  }, [image, processImage]);

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

  const resetGlitchSettings = () => {
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
  };

  const handleSettingsLoaded = (settings: EffectSettings) => {
    setDitherSettings(settings.ditherSettings);
    setHalftoneSettings(settings.halftoneSettings);
    setColorSettings(settings.colorSettings);
    setThresholdSettings(settings.thresholdSettings);
    setGlitchSettings(settings.glitchSettings);
    setTextDitherSettings(settings.textDitherSettings);
    setGradientMapSettings(settings.gradientMapSettings);
    setGridSettings(settings.gridSettings);
    setEffectsOrder(settings.effectsOrder);
    onBlurChange(settings.blur);
    
    // Process the image with the new settings
    processImage();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Canvas Container */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-20">
          <div className="bg-gray-100 p-2 rounded-lg mb-2 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => {
                  setImage(null);
                  setOriginalImageDataRef(null);
                }}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors pp-mondwest-font"
              >
                New Image
              </button>
              <button
                onClick={loadRandomImage}
                disabled={isLoading}
                className={`px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors pp-mondwest-font ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Loading...' : 'Load Random'}
              </button>
              <button
                onClick={resetImage}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors pp-mondwest-font"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => canvasRef.current && exportCanvasAsPng(canvasRef.current)}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors pp-mondwest-font"
              >
                Export PNG
              </button>
              <button
                onClick={() => canvasRef.current && exportCanvasAsSvg(canvasRef.current)}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors pp-mondwest-font"
              >
                Export SVG
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } rounded-lg p-4 text-center cursor-pointer transition-colors`}
            >
              <input {...getInputProps()} />
              {image ? (
                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className="max-w-full h-auto mx-auto"
                />
              ) : (
                <div className="py-12">
                  <p className="text-gray-600 pp-mondwest-font">
                    {isLoading ? 'Loading random image...' : 'Drag & drop an image here, or click to select'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="lg:w-80 xl:w-96">
        <div className="sticky top-20 bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
          <MobileControls 
            ditherSettings={ditherSettings}
            halftoneSettings={halftoneSettings}
            colorSettings={colorSettings}
            thresholdSettings={thresholdSettings}
            glitchSettings={glitchSettings}
            textDitherSettings={textDitherSettings}
            gradientMapSettings={gradientMapSettings}
            gridSettings={gridSettings}
            effectsOrder={effectsOrder}
            updateDitherSettings={(settings) => setDitherSettings(prev => ({ ...prev, ...settings }))}
            updateHalftoneSettings={handleHalftoneChange}
            updateColorSettings={handleColorChange}
            updateThresholdSettings={(settings) => setThresholdSettings(prev => ({ ...prev, ...settings }))}
            updateGlitchSettings={(settings) => setGlitchSettings(prev => ({ ...prev, ...settings }))}
            updateTextDitherSettings={(settings) => setTextDitherSettings(prev => ({ ...prev, ...settings }))}
            updateGradientMapSettings={(settings) => setGradientMapSettings(prev => ({ ...prev, ...settings }))}
            updateGridSettings={handleGridChange}
            updateEffectsOrder={setEffectsOrder}
            onResetImage={resetImage}
            onExportPng={() => canvasRef.current && exportCanvasAsPng(canvasRef.current)}
            onExportSvg={() => canvasRef.current && exportCanvasAsSvg(canvasRef.current)}
            onCropImage={() => setIsCropping(true)}
            blur={blur}
            onBlurChange={(newBlur) => onBlurChange(newBlur)}
            onSettingsLoaded={handleSettingsLoaded}
          />
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