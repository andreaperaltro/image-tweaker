'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ColorSettings, applyColorAdjustments } from './ColorUtils'
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
import { EffectSettings } from '../utils/EffectSettingsUtils'
import { FiUpload, FiShuffle, FiTrash, FiRefreshCw, FiSave, FiFolder, FiImage, FiFileText, FiDownload } from 'react-icons/fi'
import { EffectInstance } from '../types'

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
      blur
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    
    saveAs(blob, 'image-tweaker-settings.json');
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
    const newId = generateUniqueId(type);
    const newInstance: EffectInstance = {
      id: newId,
      type,
      enabled: false
    };
    
    // Add default settings for the new instance
    let defaultSettings;
    switch (type) {
      case 'color':
        defaultSettings = { ...colorSettings };
        break;
      case 'gradient':
        defaultSettings = { 
          ...gradientMapSettings,
          stops: JSON.parse(JSON.stringify(gradientMapSettings.stops)) 
        };
        break;
      case 'threshold':
        defaultSettings = { ...thresholdSettings };
        break;
      case 'halftone':
        defaultSettings = { 
          ...halftoneSettings,
          channels: { ...halftoneSettings.channels },
          cmykAngles: { ...halftoneSettings.cmykAngles } 
        };
        break;
      case 'grid':
        defaultSettings = { ...gridSettings };
        break;
      case 'dither':
        defaultSettings = { ...ditherSettings };
        break;
      case 'textDither':
        defaultSettings = { ...textDitherSettings };
        break;
      case 'glitch':
        defaultSettings = { ...glitchSettings };
        break;
      case 'blur':
        defaultSettings = { ...blur };
        break;
      default:
        defaultSettings = {};
    }
    
    // Add the instance and its settings
    setEffectInstances(prev => [...prev, newInstance]);
    setInstanceSettings(prev => ({ 
      ...prev, 
      [newId]: defaultSettings 
    }));
  };

  // Function to duplicate an effect
  const duplicateEffect = (id: string) => {
    const effectToDuplicate = effectInstances.find(instance => instance.id === id);
    if (!effectToDuplicate) return;
    
    const newId = generateUniqueId(effectToDuplicate.type);
    const newInstance: EffectInstance = {
      id: newId,
      type: effectToDuplicate.type,
      enabled: effectToDuplicate.enabled // Copy the enabled state from the original
    };
    
    // Find the index of the effect to duplicate
    const index = effectInstances.findIndex(instance => instance.id === id);
    
    // Insert the duplicated effect right after the original
    const newInstances = [...effectInstances];
    newInstances.splice(index + 1, 0, newInstance);
    
    // Copy the settings from the original instance
    const originalSettings = instanceSettings[id] || {};
    
    // Add the instance and its settings
    setEffectInstances(newInstances);
    setInstanceSettings(prev => ({ 
      ...prev, 
      [newId]: JSON.parse(JSON.stringify(originalSettings)) 
    }));
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
      default:
        return {};
    }
  };

  // Update instance settings
  const updateInstanceSettings = (id: string, settings: any) => {
    setInstanceSettings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...settings
      }
    }));
  };

  // Function to update effect instances
  const updateEffectInstances = (instances: EffectInstance[]) => {
    setEffectInstances(instances);
  };

  // Function to toggle effect enabled state
  const toggleEffectEnabled = (id: string, enabled: boolean) => {
    setEffectInstances(prev => 
      prev.map(instance => 
        instance.id === id ? { ...instance, enabled } : instance
      )
    );
    // We no longer update the corresponding settings' enabled properties
  };

  // Function to move effect up in the order
  const moveEffectUp = (id: string) => {
    const index = effectInstances.findIndex(instance => instance.id === id);
    if (index > 0) {
      const newInstances = [...effectInstances];
      [newInstances[index - 1], newInstances[index]] = [newInstances[index], newInstances[index - 1]];
      setEffectInstances(newInstances);
    }
  };

  // Function to move effect down in the order
  const moveEffectDown = (id: string) => {
    const index = effectInstances.findIndex(instance => instance.id === id);
    if (index < effectInstances.length - 1) {
      const newInstances = [...effectInstances];
      [newInstances[index], newInstances[index + 1]] = [newInstances[index + 1], newInstances[index]];
      setEffectInstances(newInstances);
    }
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
      
      // Apply effects based on the effectInstances
      effectInstances.forEach(instance => {
        if (!instance.enabled) return;
        
        // Get instance-specific settings
        const settings = getInstanceSettings(instance);
        
        switch (instance.type) {
          case 'color':
            // Create a copy of the settings with enabled=true
            const colorSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyColorAdjustments(sourceCtx, canvasWidth, canvasHeight, colorSettingsForInstance);
            break;
            
          case 'gradient':
            // Create a copy of the settings with enabled=true
            const gradientSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyGradientMap(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, gradientSettingsForInstance);
            break;
            
          case 'threshold':
            // Create a copy of the settings with enabled=true
            const thresholdSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyThreshold(sourceCtx, canvasWidth, canvasHeight, thresholdSettingsForInstance);
            break;
            
          case 'halftone':
            // Create a copy of the settings with enabled=true
            const halftoneSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyHalftone(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, halftoneSettingsForInstance);
            break;
            
          case 'grid':
            // Create a copy of the settings with enabled=true
            const gridSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            const grid = createGrid(canvasWidth, canvasHeight, gridSettingsForInstance);
            grid.forEach(cell => renderGridCell(sourceCtx, cell, sourceCanvas, gridSettingsForInstance));
            break;
            
          case 'dither':
            // Create a copy of the settings with enabled=true
            const ditherSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyDithering(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, ditherSettingsForInstance);
            break;
            
          case 'textDither':
            // Create a copy of the settings with enabled=true
            const textDitherSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyTextDither(sourceCtx, canvasWidth, canvasHeight, textDitherSettingsForInstance);
            break;
            
          case 'glitch':
            // Create a copy of the settings with only masterEnabled=true
            const glitchSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              masterEnabled: true 
            };
            applyGlitch(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, glitchSettingsForInstance);
            break;

          case 'blur':
            // Create a copy of the settings with enabled=true
            const blurSettingsForInstance = { 
              ...JSON.parse(JSON.stringify(settings)), 
              enabled: true 
            };
            applyBlur(sourceCtx, canvasWidth, canvasHeight, blurSettingsForInstance);
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
    effectInstances,
    instanceSettings
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
    // Load the various settings 
    setDitherSettings(settings.ditherSettings);
    setHalftoneSettings(settings.halftoneSettings);
    setColorSettings(settings.colorSettings);
    setThresholdSettings(settings.thresholdSettings);
    setGlitchSettings(settings.glitchSettings);
    setTextDitherSettings(settings.textDitherSettings);
    setGradientMapSettings(settings.gradientMapSettings);
    setGridSettings(settings.gridSettings);
    
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
        { id: 'grid-1', type: 'grid', enabled: false }
      ]);
    }
    
    onBlurChange(settings.blur);
    
    // Process the image with the new settings
    processImage();
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

  // Initialize the source canvas
  useEffect(() => {
    sourceCanvasRef.current = document.createElement('canvas');
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas Container */}
      <div className="flex-1 min-w-0">
        <div className="sticky top-20">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex w-full justify-between gap-2">
              <div className="flex flex-nowrap gap-2 items-center">
                <label 
                  className="px-2 py-1 bg-[var(--header-bg)] text-white text-xs rounded hover:bg-gray-800 transition-colors pp-mondwest-font cursor-pointer flex items-center gap-1 min-w-fit"
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
                  className="px-2 py-1 bg-[var(--header-bg)] text-white text-xs rounded hover:bg-gray-800 transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                >
                  <FiShuffle size={16} />
                  <span className="hidden sm:inline">Random</span>
                </button>
                <button
                  onClick={() => {
                    setImage(null);
                    setOriginalImageDataRef(null);
                  }}
                  className="px-2 py-1 bg-[var(--header-bg)] text-white text-xs rounded hover:bg-gray-800 transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                >
                  <FiTrash size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                
                <div className="h-4 mx-1 border-r border-[var(--border-color)]"></div>
                
                <button
                  onClick={resetImage}
                  disabled={!originalImageDataRef}
                  className={`px-2 py-1 ${
                    originalImageDataRef
                      ? 'bg-[var(--header-bg)] text-white hover:bg-gray-800'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  } text-xs rounded transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit`}
                >
                  <FiRefreshCw size={16} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
                
                <div className="h-4 mx-1 border-r border-[var(--border-color)]"></div>
                
                <label 
                  className="px-2 py-1 bg-[var(--header-bg)] text-white text-xs rounded hover:bg-gray-800 transition-colors pp-mondwest-font cursor-pointer flex items-center gap-1 min-w-fit"
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
                  className="px-2 py-1 bg-[var(--header-bg)] text-white text-xs rounded hover:bg-gray-800 transition-colors pp-mondwest-font cursor-pointer flex items-center gap-1 min-w-fit"
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
                  className="px-2 py-1 bg-[var(--header-bg)] text-white text-xs rounded hover:bg-gray-800 transition-colors pp-mondwest-font flex items-center gap-1 min-w-fit"
                  onClick={() => canvasRef.current && exportCanvasAsPng(canvasRef.current)}
                  disabled={!image}
                  title="Export as PNG"
                >
                  <FiImage size={16} />
                  <span className="hidden sm:inline">PNG</span>
                </button>
                <button
                  className={`px-2 py-1 rounded-md flex items-center space-x-1 text-xs transition-colors pp-mondwest-font ${
                    isVectorSvgAvailable() 
                      ? 'bg-[var(--header-bg)] text-white hover:bg-gray-800'
                      : 'bg-gray-800 border-gray-900 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={() => canvasRef.current && isVectorSvgAvailable() && exportCanvasAsSvg(canvasRef.current)}
                  disabled={!image || !isVectorSvgAvailable()}
                  title={isVectorSvgAvailable() 
                    ? "Export as true vector SVG (halftone/dither)" 
                    : "Vector SVG export only available when halftone or dither is the last effect"}
                >
                  <FiFileText size={16} />
                  <span className="hidden sm:inline">SVG</span>
                </button>
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
                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className="max-w-full h-auto mx-auto"
                />
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