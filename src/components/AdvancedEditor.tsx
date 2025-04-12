'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ColorSettings, applyColorAdjustments } from './ColorUtils'
import { GridSettings, GridCell, createGrid, renderGridCell } from './Grid'
import { HalftoneSettings, HalftoneArrangement, HalftoneShape, applyHalftone } from './Halftone'
import { exportAsPng, exportAsSvg } from './SvgExport'
import { exportCanvasAsPng, exportCanvasAsSvg } from './ExportUtils'
import { GlitchSettings, applyGlitch } from './GlitchUtils'
import { Pane } from 'tweakpane'
import type { 
  ButtonApi, 
  FolderApi, 
  TabApi,
  BladeApi,
  InputBindingApi,
  BladeController,
  View
} from '@tweakpane/core'
import { applyDithering, DitherSettings } from '../components/DitherUtils'
import { TextDitherSettings, applyTextDither } from './TextDitherUtils'
import { ThresholdSettings, ThresholdMode, applyThreshold } from './ThresholdUtils'
import CropEditor from './CropEditor'
// import { StochasticSettings, applyStochastic } from './StochasticUtils' // Module not found
import { GradientMapSettings, applyGradientMap, GradientMapBlendMode, GradientStop } from './GradientMapUtils'
import { saveAs } from 'file-saver'

// Import Tweakpane types for development
type TweakpanePane = Pane;
type TweakpaneBladeApi = BladeApi<BladeController<View>>;

// Define aspect ratio presets
type AspectRatioPreset = '1:1' | '4:3' | '16:9' | '3:2' | '5:4' | '2:1' | '3:4' | '9:16' | '2:3' | '4:5' | '1:2' | 'custom';
type Orientation = 'landscape' | 'portrait';

export default function AdvancedEditor() {
  // Canvas and image states
  const [image, setImage] = useState<string | null>(null);
  const [originalImageDataRef, setOriginalImageDataRef] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);
  
  // Tweakpane references - use 'any' type to avoid TypeScript errors
  const paneRef = useRef<Pane | null>(null);
  const paneContainerRef = useRef<HTMLDivElement>(null);
  
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
    colorDepth: 2
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

  // Glitch settings
  const [glitchSettings, setGlitchSettings] = useState<GlitchSettings>({
    masterEnabled: false,
    enabled: false,
    glitchIntensity: 50,
    glitchDensity: 50,
    glitchDirection: 'horizontal' as 'horizontal' | 'vertical' | 'both',
    
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

  // Initialize Tweakpane - ONLY when component mounts or image changes
  useEffect(() => {
    console.log('Tweakpane initialization triggered', { 
      hasImage: !!image, 
      hasContainer: !!paneContainerRef.current, 
      hasExistingPane: !!paneRef.current 
    });
    
    if (image && paneContainerRef.current && !paneRef.current) {
      try {
        console.log('Initializing Tweakpane...');
        
        if (!paneContainerRef.current) return;

        // Create a new Tweakpane instance
        const pane = new Pane({
          container: paneContainerRef.current,
          title: 'Image Controls',
          expanded: true
        });

        // Add custom styles for mobile
        const style = document.createElement('style');
        style.textContent = `
          .tp-dfwv {
            --tp-base-background-color: rgba(255, 255, 255, 0.9) !important;
            --tp-base-foreground-color: #333 !important;
            --tp-container-background-color: rgba(255, 255, 255, 0.9) !important;
            --tp-container-background-color-hover: rgba(255, 255, 255, 1) !important;
            --tp-container-background-color-focus: rgba(255, 255, 255, 1) !important;
            --tp-container-foreground-color: #333 !important;
            --tp-button-background-color: #000 !important;
            --tp-button-background-color-hover: #333 !important;
            --tp-button-foreground-color: #fff !important;
            --tp-folder-background-color: rgba(255, 255, 255, 0.9) !important;
            --tp-folder-background-color-hover: rgba(255, 255, 255, 1) !important;
            --tp-folder-background-color-focus: rgba(255, 255, 255, 1) !important;
            --tp-folder-foreground-color: #333 !important;
            --tp-input-background-color: #fff !important;
            --tp-input-background-color-hover: #fff !important;
            --tp-input-background-color-focus: #fff !important;
            --tp-input-foreground-color: #333 !important;
            --tp-label-foreground-color: #333 !important;
            --tp-monitor-background-color: #fff !important;
            --tp-monitor-foreground-color: #333 !important;
          }

          @media (max-width: 768px) {
            .tp-dfwv {
              --tp-base-padding: 8px !important;
              --tp-base-font-size: 14px !important;
              --tp-base-border-radius: 4px !important;
            }
          }
        `;
        document.head.appendChild(style);

        console.log('Pane created:', pane);
        
        // Store references to bindings so we can update them
        const bindings: Record<string, any> = {};
        
        // 1. COLOR ADJUSTMENTS FOLDER
        const colorFolder = pane.addFolder({
          title: 'Color Adjustments',
          expanded: false,
        });
        
        // Enable color adjustments
        bindings.colorEnabled = colorFolder.addBinding(colorSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          handleColorChange('enabled', ev.value);
        });
        
        // Hue shift
        bindings.hueShift = colorFolder.addBinding(colorSettings, 'hueShift', {
          label: 'Hue Shift',
          min: -180,
          max: 180,
          step: 1,
        }).on('change', (ev) => {
          handleColorChange('hueShift', ev.value);
        });
        
        // Saturation
        bindings.saturation = colorFolder.addBinding(colorSettings, 'saturation', {
          label: 'Saturation',
          min: 0,
          max: 200,
          step: 1,
        }).on('change', (ev) => {
          handleColorChange('saturation', ev.value);
        });
        
        // Brightness
        bindings.brightness = colorFolder.addBinding(colorSettings, 'brightness', {
          label: 'Brightness',
          min: 0,
          max: 200,
          step: 1,
        }).on('change', (ev) => {
          handleColorChange('brightness', ev.value);
        });
        
        // Contrast
        bindings.contrast = colorFolder.addBinding(colorSettings, 'contrast', {
          label: 'Contrast',
          min: 0,
          max: 200,
          step: 1,
        }).on('change', (ev) => {
          handleColorChange('contrast', ev.value);
        });
        
        // Posterize
        bindings.posterize = colorFolder.addBinding(colorSettings, 'posterize', {
          label: 'Posterize',
          min: 0,
          max: 32,
          step: 1,
        }).on('change', (ev) => {
          handleColorChange('posterize', ev.value);
        });
        
        // Invert
        bindings.invert = colorFolder.addBinding(colorSettings, 'invert', {
          label: 'Invert'
        }).on('change', (ev) => {
          handleColorChange('invert', ev.value);
        });
        
        // Glitch intensity
        bindings.glitchIntensity = colorFolder.addBinding(colorSettings, 'glitchIntensity', {
          label: 'Glitch',
          min: 0,
          max: 100,
          step: 1,
        }).on('change', (ev) => {
          handleColorChange('glitchIntensity', ev.value);
          if (ev.value > 0 && colorSettings.glitchIntensity === 0) {
            // Generate new seed when enabling glitch
            handleColorChange('glitchSeed', Math.random());
          }
        });
        
        // Randomize glitch button
        colorFolder.addButton({
          title: 'Randomize Glitch'
        }).on('click', () => {
          handleColorChange('glitchSeed', Math.random());
        });
        
        // 2. GRADIENT MAP FOLDER
        const gradientMapFolder = pane.addFolder({
          title: 'Gradient Map',
          expanded: false,
        });

        // Enable gradient map
        bindings.gradientMapEnabled = gradientMapFolder.addBinding(gradientMapSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGradientMapSettings(prev => ({ ...prev, enabled: ev.value }));
          processImage();
        });

        // Blend mode
        bindings.gradientMapBlendMode = gradientMapFolder.addBinding(gradientMapSettings, 'blendMode', {
          label: 'Blend Mode',
          options: {
            'Normal': 'normal',
            'Multiply': 'multiply',
            'Screen': 'screen',
            'Overlay': 'overlay',
            'Hard Light': 'hard-light',
            'Soft Light': 'soft-light',
            'Color': 'color',
            'Luminosity': 'luminosity'
          }
        }).on('change', (ev) => {
          setGradientMapSettings(prev => ({ ...prev, blendMode: ev.value }));
          processImage();
        });

        // Opacity
        bindings.gradientMapOpacity = gradientMapFolder.addBinding(gradientMapSettings, 'opacity', {
          label: 'Opacity',
          min: 0,
          max: 1,
          step: 0.01
        }).on('change', (ev) => {
          setGradientMapSettings(prev => ({ ...prev, opacity: ev.value }));
          processImage();
        });

        // Gradient stops folder
        const gradientStopsFolder = gradientMapFolder.addFolder({
          title: 'Gradient Stops',
          expanded: true
        });

        // Function to update gradient stops UI
        const updateGradientStopsUI = () => {
          console.log('Rebuilding gradient stops UI...');
          
          // Completely remove all children of the gradientStopsFolder
          while (gradientStopsFolder.children.length > 0) {
            try {
              gradientStopsFolder.remove(gradientStopsFolder.children[0]);
            } catch (error) {
              console.error('Error removing control:', error);
              break; // Break to avoid infinite loop if removal fails
            }
          }
          
          // Get fresh stops data directly from the state
          let currentStops = [...gradientMapSettings.stops];
          console.log('Current gradient stops:', currentStops);
          
          // Ensure we have exactly 3 stops at fixed positions (0, 50, 100)
          const defaultPositions = [0, 50, 100];
          const defaultColors = ['#000000', '#808080', '#ffffff'];
          
          if (currentStops.length < 3) {
            // Add missing stops
            const newStops = [...currentStops];
            const existingPositions = currentStops.map(stop => stop.position);
            
            for (let i = 0; i < defaultPositions.length; i++) {
              if (!existingPositions.includes(defaultPositions[i])) {
                newStops.push({
                  position: defaultPositions[i],
                  color: defaultColors[i]
                });
              }
            }
            
            // Update state with new stops
            setGradientMapSettings(prev => ({
              ...prev,
              stops: newStops.sort((a, b) => a.position - b.position)
            }));
            
            currentStops = newStops;
          } else if (currentStops.length > 3) {
            // Keep only the first 3 stops
            const newStops = currentStops.slice(0, 3);
            
            // Make sure we have stops at positions 0, 50, and 100
            const positions = newStops.map(stop => stop.position);
            
            if (!positions.includes(0)) {
              newStops[0].position = 0;
            }
            if (!positions.includes(100)) {
              newStops[2].position = 100;
            }
            if (!positions.includes(50)) {
              newStops[1].position = 50;
            }
            
            // Update state with new stops
            setGradientMapSettings(prev => ({
              ...prev,
              stops: newStops.sort((a, b) => a.position - b.position)
            }));
            
            currentStops = newStops;
          }
          
          // Sort stops by position
          const sortedStops = [...currentStops].sort((a, b) => a.position - b.position);
          
          // Add controls for each stop
          sortedStops.forEach((stop, index) => {
            const stopFolder = gradientStopsFolder.addFolder({
              title: `Stop ${index + 1} (${stop.position}%)`
            });
            
            // Color picker
            const params = { color: stop.color };
            stopFolder.addBinding(params, 'color', {
              view: 'color',
              label: 'Color'
            }).on('change', (ev) => {
              // Create a new array to ensure state change is detected
              const newStops = [...sortedStops];
              newStops[index].color = ev.value;
              
              // Update the state with the new stops
              setGradientMapSettings(prev => ({
                ...prev,
                stops: newStops
              }));
              
              processImage();
            });
            
            // Don't allow position changes for first and last stops
            if (index !== 0 && index !== sortedStops.length - 1) {
              // Position slider (only for middle stops)
              const posParams = { position: stop.position };
              stopFolder.addBinding(posParams, 'position', {
                label: 'Position',
                min: 5,
                max: 95,
                step: 1
              }).on('change', (ev) => {
                // Create a new array to ensure state change is detected
                const newStops = [...sortedStops];
                newStops[index].position = ev.value;
                
                // Update the state with the new stops
                setGradientMapSettings(prev => ({
                  ...prev,
                  stops: newStops
                }));
                
                processImage();
              });
            }
          });
        };

        // Initialize gradient stops UI
        updateGradientStopsUI();
        
        // 3. THRESHOLD FOLDER
        const thresholdFolder = pane.addFolder({
          title: 'Threshold',
          expanded: false,
        });

        const thresholdParams = {
          enabled: thresholdSettings.enabled,
          mode: thresholdSettings.mode,
          threshold: thresholdSettings.threshold,
          darkColor: thresholdSettings.darkColor,
          lightColor: thresholdSettings.lightColor,
          darkColorStart: thresholdSettings.darkColorStart,
          darkColorEnd: thresholdSettings.darkColorEnd,
          lightColorStart: thresholdSettings.lightColorStart,
          lightColorEnd: thresholdSettings.lightColorEnd
        };

        // Enable threshold
        bindings.thresholdEnabled = thresholdFolder.addBinding(thresholdParams, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, enabled: ev.value }));
          processImage();
        });

        // Threshold value (moved up)
        bindings.threshold = thresholdFolder.addBinding(thresholdParams, 'threshold', {
          label: 'Threshold',
          min: 0,
          max: 255,
          step: 1
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, threshold: ev.value }));
          processImage();
        });

        // Threshold mode
        bindings.thresholdMode = thresholdFolder.addBinding(thresholdParams, 'mode', {
          label: 'Mode',
          options: {
            'Solid': 'solid',
            'Gradient': 'gradient'
          }
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, mode: ev.value }));
          updateThresholdControls(ev.value);
          processImage();
        });

        // Create folders but don't add them yet
        const solidColorsFolder = thresholdFolder.addFolder({
          title: 'Colors',
          expanded: true
        });

        const gradientColorsFolder = thresholdFolder.addFolder({
          title: 'Gradient Colors',
          expanded: true
        });

        // Dark color (solid)
        bindings.darkColor = solidColorsFolder.addBinding(thresholdParams, 'darkColor', {
          view: 'color',
          label: 'Dark Color'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, darkColor: ev.value }));
          processImage();
        });

        // Light color (solid)
        bindings.lightColor = solidColorsFolder.addBinding(thresholdParams, 'lightColor', {
          view: 'color',
          label: 'Light Color'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, lightColor: ev.value }));
          processImage();
        });

        // Dark color start (gradient)
        bindings.darkColorStart = gradientColorsFolder.addBinding(thresholdParams, 'darkColorStart', {
          view: 'color',
          label: 'Dark Start'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, darkColorStart: ev.value }));
          processImage();
        });

        // Dark color end (gradient)
        bindings.darkColorEnd = gradientColorsFolder.addBinding(thresholdParams, 'darkColorEnd', {
          view: 'color',
          label: 'Dark End'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, darkColorEnd: ev.value }));
          processImage();
        });

        // Light color start (gradient)
        bindings.lightColorStart = gradientColorsFolder.addBinding(thresholdParams, 'lightColorStart', {
          view: 'color',
          label: 'Light Start'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, lightColorStart: ev.value }));
          processImage();
        });

        // Light color end (gradient)
        bindings.lightColorEnd = gradientColorsFolder.addBinding(thresholdParams, 'lightColorEnd', {
          view: 'color',
          label: 'Light End'
        }).on('change', (ev) => {
          setThresholdSettings(prev => ({ ...prev, lightColorEnd: ev.value }));
          processImage();
        });

        // Function to update visibility of color controls
        const updateThresholdControls = (mode: ThresholdMode) => {
          if (mode === 'solid') {
            thresholdFolder.remove(gradientColorsFolder);
            thresholdFolder.add(solidColorsFolder);
          } else {
            thresholdFolder.remove(solidColorsFolder);
            thresholdFolder.add(gradientColorsFolder);
          }
        };

        // Initial setup of controls based on current mode
        updateThresholdControls(thresholdSettings.mode);
        
        // 4. DITHERING FOLDER
        const ditherFolder = pane.addFolder({
          title: 'Dithering',
          expanded: false,
        });
        
        // Enable dithering
        bindings.ditherEnabled = ditherFolder.addBinding(ditherSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setDitherSettings(prev => ({ ...prev, enabled: ev.value }));
        });
        
        // Dithering type
        bindings.ditherType = ditherFolder.addBinding(ditherSettings, 'type', {
          label: 'Type',
          options: {
            'Ordered': 'ordered',
            'Floyd-Steinberg': 'floyd-steinberg',
            'Jarvis': 'jarvis',
            'Judice & Ninke': 'judice-ninke',
            'Stucki': 'stucki',
            'Burkes': 'burkes'
          }
        }).on('change', (ev) => {
          setDitherSettings(prev => ({ ...prev, type: ev.value }));
        });
        
        // Resolution
        bindings.ditherResolution = ditherFolder.addBinding(ditherSettings, 'resolution', {
          label: 'Resolution',
          min: 1,
          max: 100,
          step: 1,
        }).on('change', (ev) => {
          setDitherSettings(prev => ({ ...prev, resolution: ev.value }));
        });
        
        // Color depth
        bindings.ditherColorDepth = ditherFolder.addBinding(ditherSettings, 'colorDepth', {
          label: 'Color Depth',
          min: 2,
          max: 256,
          step: 1,
        }).on('change', (ev) => {
          setDitherSettings(prev => ({ ...prev, colorDepth: ev.value }));
        });
        
        // Threshold
        bindings.ditherThreshold = ditherFolder.addBinding(ditherSettings, 'threshold', {
          label: 'Threshold',
          min: 0,
          max: 255,
          step: 1,
        }).on('change', (ev) => {
          setDitherSettings(prev => ({ ...prev, threshold: ev.value }));
        });
        
        // Color mode
        bindings.ditherColorMode = ditherFolder.addBinding(ditherSettings, 'colorMode', {
          label: 'Color Mode',
          options: {
            'Color': 'color',
            'Grayscale': 'grayscale'
          }
        }).on('change', (ev) => {
          setDitherSettings(prev => ({ ...prev, colorMode: ev.value }));
        });
        
        // 5. HALFTONE EFFECTS FOLDER
        const halftoneFolder = pane.addFolder({
          title: 'Halftone Effect',
          expanded: false,
        });
        
        // Enable halftone
        bindings.halftoneEnabled = halftoneFolder.addBinding(halftoneSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          handleHalftoneChange('enabled', ev.value);
        });
        
        // Cell size
        bindings.cellSize = halftoneFolder.addBinding(halftoneSettings, 'cellSize', {
          label: 'Cell Size',
          min: 2,
          max: 30,
          step: 1,
        }).on('change', (ev) => {
          handleHalftoneChange('cellSize', ev.value);
        });
        
        // Dot scale factor
        bindings.dotScaleFactor = halftoneFolder.addBinding(halftoneSettings, 'dotScaleFactor', {
          label: 'Dot Scale',
          min: 0.1,
          max: 1.5,
          step: 0.05,
        }).on('change', (ev) => {
          handleHalftoneChange('dotScaleFactor', ev.value);
        });
        
        // Mix amount
        bindings.mix = halftoneFolder.addBinding(halftoneSettings, 'mix', {
          label: 'Mix Amount',
          min: 0,
          max: 100,
          step: 1,
        }).on('change', (ev) => {
          handleHalftoneChange('mix', ev.value);
        });
        
        // Colored halftone
        bindings.colored = halftoneFolder.addBinding(halftoneSettings, 'colored', {
          label: 'Colored'
        }).on('change', (ev) => {
          handleHalftoneChange('colored', ev.value);
        });
        
        // Shape options - moved ABOVE pattern
        bindings.shape = halftoneFolder.addBinding(halftoneSettings, 'shape', {
          label: 'Shape',
          options: {
            'Circle': 'circle',
            'Square': 'square',
            'Diamond': 'diamond',
            'Line': 'line',
            'Cross': 'cross',
            'Ellipse': 'ellipse',
            'Triangle': 'triangle',
            'Hexagon': 'hexagon',
          }
        }).on('change', (ev) => {
          handleHalftoneChange('shape', ev.value);
        });
        
        // Pattern options (renamed from "Arrangement")
        bindings.arrangement = halftoneFolder.addBinding(halftoneSettings, 'arrangement', {
          label: 'Pattern',
          options: {
            'Grid': 'grid',
            'Hexagonal': 'hexagonal',
            'Spiral': 'spiral',
            'Concentric': 'concentric',
            'Random': 'random'
          }
        }).on('change', (ev) => {
          handleHalftoneChange('arrangement', ev.value);
          updateSpiralControls();
          updateConcentricControls();
        });
        
        // Size variation
        bindings.sizeVariation = halftoneFolder.addBinding(halftoneSettings, 'sizeVariation', {
          label: 'Size Variation',
          min: 0,
          max: 1,
          step: 0.05,
        }).on('change', (ev) => {
          handleHalftoneChange('sizeVariation', ev.value);
        });
        
        // Invert brightness
        bindings.invertBrightness = halftoneFolder.addBinding(halftoneSettings, 'invertBrightness', {
          label: 'Invert'
        }).on('change', (ev) => {
          handleHalftoneChange('invertBrightness', ev.value);
        });

        // CMYK Mode subfolder
        const cmykFolder = halftoneFolder.addFolder({
          title: 'CMYK Mode',
          expanded: false
        });
        
        // Enable CMYK mode checkbox
        bindings.enableCMYK = cmykFolder.addBinding(halftoneSettings, 'enableCMYK', {
          label: 'Enable CMYK'
        }).on('change', (ev) => {
          handleHalftoneChange('enableCMYK', ev.value);
        });
        
        // Cyan channel
        bindings.cyan = cmykFolder.addBinding(halftoneSettings.channels, 'cyan', {
          label: 'Cyan'
        }).on('change', (ev) => {
          handleHalftoneChannelChange('cyan', ev.value);
        });
        
        // Magenta channel
        bindings.magenta = cmykFolder.addBinding(halftoneSettings.channels, 'magenta', {
          label: 'Magenta'
        }).on('change', (ev) => {
          handleHalftoneChannelChange('magenta', ev.value);
        });
        
        // Yellow channel
        bindings.yellow = cmykFolder.addBinding(halftoneSettings.channels, 'yellow', {
          label: 'Yellow'
        }).on('change', (ev) => {
          handleHalftoneChannelChange('yellow', ev.value);
        });
        
        // Black channel
        bindings.black = cmykFolder.addBinding(halftoneSettings.channels, 'black', {
          label: 'Black'
        }).on('change', (ev) => {
          handleHalftoneChannelChange('black', ev.value);
        });

        // Text dither settings
        const textDitherFolder = pane.addFolder({
          title: 'Text Dither Effect',
          expanded: false
        });

        // Enable text dithering
        textDitherFolder.addBinding(textDitherSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, enabled: ev.value }));
          processImage();
        });

        // Text input
        textDitherFolder.addBinding(textDitherSettings, 'text', {
          label: 'Text Pattern'
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, text: ev.value }));
          processImage();
        });

        // Font size
        textDitherFolder.addBinding(textDitherSettings, 'fontSize', {
          label: 'Font Size',
          min: 6,
          max: 24,
          step: 1
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, fontSize: ev.value }));
          processImage();
        });

        // Resolution
        textDitherFolder.addBinding(textDitherSettings, 'resolution', {
          label: 'Resolution',
          min: 0.5,
          max: 4,
          step: 0.1
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, resolution: ev.value }));
          processImage();
        });

        // Color mode
        textDitherFolder.addBinding(textDitherSettings, 'colorMode', {
          label: 'Color Mode',
          options: {
            'Monochrome': 'monochrome',
            'Colored': 'colored'
          }
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, colorMode: ev.value }));
          processImage();
        });

        // Contrast
        textDitherFolder.addBinding(textDitherSettings, 'contrast', {
          label: 'Contrast',
          min: 0.5,
          max: 2,
          step: 0.1
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, contrast: ev.value }));
          processImage();
        });

        // Brightness
        textDitherFolder.addBinding(textDitherSettings, 'brightness', {
          label: 'Brightness',
          min: 0,
          max: 1,
          step: 0.1
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, brightness: ev.value }));
          processImage();
        });

        // Invert
        textDitherFolder.addBinding(textDitherSettings, 'invert', {
          label: 'Invert'
        }).on('change', (ev) => {
          setTextDitherSettings(prev => ({ ...prev, invert: ev.value }));
          processImage();
        });

        // Glitch effects settings
        const glitchFolder = pane.addFolder({
          title: 'Glitch Effects',
          expanded: false
        });
        
        // Master toggle for all glitch effects
        bindings.masterGlitchEnabled = glitchFolder.addBinding(glitchSettings, 'masterEnabled', {
          label: 'Enable All Effects'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, masterEnabled: ev.value }));
          processImage();
        });
        
        // Create a subfolder for general glitch
        const generalGlitchFolder = glitchFolder.addFolder({
          title: 'General Glitch',
          expanded: false
        });

        // Enable general glitch effects
        bindings.glitchEnabled = generalGlitchFolder.addBinding(glitchSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, enabled: ev.value }));
          processImage();
        });

        // Glitch intensity
        bindings.glitchIntensity = generalGlitchFolder.addBinding(glitchSettings, 'glitchIntensity', {
          label: 'Intensity',
          min: 0,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, glitchIntensity: ev.value }));
          processImage();
        });

        // Glitch density
        bindings.glitchDensity = generalGlitchFolder.addBinding(glitchSettings, 'glitchDensity', {
          label: 'Density',
          min: 1,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, glitchDensity: ev.value }));
          processImage();
        });

        // Glitch direction
        bindings.glitchDirection = generalGlitchFolder.addBinding(glitchSettings, 'glitchDirection', {
          label: 'Direction',
          options: {
            'Horizontal': 'horizontal',
            'Vertical': 'vertical',
            'Both': 'both'
          }
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, glitchDirection: ev.value }));
          processImage();
        });

        // Pixel sorting subfolder
        const pixelSortingFolder = glitchFolder.addFolder({
          title: 'Pixel Sorting',
          expanded: false
        });
        
        // Enable pixel sorting
        bindings.pixelSortingEnabled = pixelSortingFolder.addBinding(glitchSettings, 'pixelSortingEnabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, pixelSortingEnabled: ev.value }));
          processImage();
        });
        
        // Pixel sorting threshold
        bindings.pixelSortingThreshold = pixelSortingFolder.addBinding(glitchSettings, 'pixelSortingThreshold', {
          label: 'Threshold',
          min: 0,
          max: 1,
          step: 0.01
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, pixelSortingThreshold: ev.value }));
          processImage();
        });
        
        // Pixel sorting direction
        bindings.pixelSortingDirection = pixelSortingFolder.addBinding(glitchSettings, 'pixelSortingDirection', {
          label: 'Direction',
          options: {
            'Horizontal': 'horizontal',
            'Vertical': 'vertical',
            'Both': 'both'
          }
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, pixelSortingDirection: ev.value }));
          processImage();
        });
        
        // Channel shift subfolder
        const channelShiftFolder = glitchFolder.addFolder({
          title: 'Channel Shift',
          expanded: false
        });
        
        // Enable channel shift
        bindings.channelShiftEnabled = channelShiftFolder.addBinding(glitchSettings, 'channelShiftEnabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, channelShiftEnabled: ev.value }));
          processImage();
        });
        
        // Channel shift amount
        bindings.channelShiftAmount = channelShiftFolder.addBinding(glitchSettings, 'channelShiftAmount', {
          label: 'Amount',
          min: 0,
          max: 10,
          step: 0.1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, channelShiftAmount: ev.value }));
          processImage();
        });
        
        // Channel shift mode
        bindings.channelShiftMode = channelShiftFolder.addBinding(glitchSettings, 'channelShiftMode', {
          label: 'Mode',
          options: {
            'All Channels (RGB)': 'rgb',
            'Red & Blue': 'rb',
            'Red & Green': 'rg',
            'Green & Blue': 'gb'
          }
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, channelShiftMode: ev.value }));
          processImage();
        });
        
        // Scan lines subfolder
        const scanLinesFolder = glitchFolder.addFolder({
          title: 'Scan Lines',
          expanded: false
        });
        
        // Enable scan lines
        bindings.scanLinesEnabled = scanLinesFolder.addBinding(glitchSettings, 'scanLinesEnabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, scanLinesEnabled: ev.value }));
          processImage();
        });
        
        // Scan lines count
        bindings.scanLinesCount = scanLinesFolder.addBinding(glitchSettings, 'scanLinesCount', {
          label: 'Count',
          min: 1,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, scanLinesCount: ev.value }));
          processImage();
        });
        
        // Scan lines intensity
        bindings.scanLinesIntensity = scanLinesFolder.addBinding(glitchSettings, 'scanLinesIntensity', {
          label: 'Intensity',
          min: 0,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, scanLinesIntensity: ev.value }));
          processImage();
        });
        
        // Scan lines direction
        bindings.scanLinesDirection = scanLinesFolder.addBinding(glitchSettings, 'scanLinesDirection', {
          label: 'Direction',
          options: {
            'Horizontal': 'horizontal',
            'Vertical': 'vertical',
            'Both': 'both'
          }
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, scanLinesDirection: ev.value }));
          processImage();
        });
        
        // Noise subfolder
        const noiseFolder = glitchFolder.addFolder({
          title: 'Noise',
          expanded: false
        });
        
        // Enable noise
        bindings.noiseEnabled = noiseFolder.addBinding(glitchSettings, 'noiseEnabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, noiseEnabled: ev.value }));
          processImage();
        });
        
        // Noise amount
        bindings.noiseAmount = noiseFolder.addBinding(glitchSettings, 'noiseAmount', {
          label: 'Amount',
          min: 0,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, noiseAmount: ev.value }));
          processImage();
        });
        
        // Blocks subfolder
        const blocksFolder = glitchFolder.addFolder({
          title: 'Blocks',
          expanded: false
        });
        
        // Enable blocks
        bindings.blocksEnabled = blocksFolder.addBinding(glitchSettings, 'blocksEnabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, blocksEnabled: ev.value }));
          processImage();
        });
        
        // Block size
        bindings.blocksSize = blocksFolder.addBinding(glitchSettings, 'blocksSize', {
          label: 'Size',
          min: 5,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, blocksSize: ev.value }));
          processImage();
        });
        
        // Block offset
        bindings.blocksOffset = blocksFolder.addBinding(glitchSettings, 'blocksOffset', {
          label: 'Offset',
          min: 1,
          max: 50,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, blocksOffset: ev.value }));
          processImage();
        });

        // Block density
        bindings.blocksDensity = blocksFolder.addBinding(glitchSettings, 'blocksDensity', {
          label: 'Density',
          min: 1,
          max: 100,
          step: 1
        }).on('change', (ev) => {
          setGlitchSettings(prev => ({ ...prev, blocksDensity: ev.value }));
          processImage();
        });

        // 6. GRID EFFECTS FOLDER
        const gridFolder = pane.addFolder({
          title: 'Grid Effects',
          expanded: false,
        });
        
        // Enable grid
        bindings.gridEnabled = gridFolder.addBinding(gridSettings, 'enabled', {
          label: 'Enable'
        }).on('change', (ev) => {
          handleGridChange('enabled', ev.value);
        });
        
        // Columns
        bindings.columns = gridFolder.addBinding(gridSettings, 'columns', {
          label: 'Columns',
          min: 1,
          max: 10,
          step: 1,
        }).on('change', (ev) => {
          handleGridChange('columns', ev.value);
        });
        
        // Rows
        bindings.rows = gridFolder.addBinding(gridSettings, 'rows', {
          label: 'Rows',
          min: 1,
          max: 10,
          step: 1,
        }).on('change', (ev) => {
          handleGridChange('rows', ev.value);
        });
        
        // Apply rotation
        bindings.applyRotation = gridFolder.addBinding(gridSettings, 'applyRotation', {
          label: 'Apply Rotation'
        }).on('change', (ev) => {
          handleGridChange('applyRotation', ev.value);
        });
        
        // Max rotation
        bindings.maxRotation = gridFolder.addBinding(gridSettings, 'maxRotation', {
          label: 'Max Rotation',
          min: 1,
          max: 45,
          step: 1,
        }).on('change', (ev) => {
          handleGridChange('maxRotation', ev.value);
        });
        
        // Split enabled
        bindings.splitEnabled = gridFolder.addBinding(gridSettings, 'splitEnabled', {
          label: 'Enable Splitting'
        }).on('change', (ev) => {
          handleGridChange('splitEnabled', ev.value);
        });
        
        // Split probability (convert to percentage for UI)
        const splitObj = { splitProb: gridSettings.splitProbability * 100 };
        bindings.splitProb = gridFolder.addBinding(splitObj, 'splitProb', {
          label: 'Split Probability',
          min: 0,
          max: 100,
          step: 1,
        }).on('change', (ev) => {
          handleGridChange('splitProbability', ev.value / 100);
        });
        
        // Max split levels
        bindings.maxSplitLevels = gridFolder.addBinding(gridSettings, 'maxSplitLevels', {
          label: 'Max Split Levels',
          min: 1,
          max: 4,
          step: 1,
        }).on('change', (ev) => {
          handleGridChange('maxSplitLevels', ev.value);
        });
        
        // Min cell size
        bindings.minCellSize = gridFolder.addBinding(gridSettings, 'minCellSize', {
          label: 'Min Cell Size',
          min: 20,
          max: 200,
          step: 1,
        }).on('change', (ev) => {
          handleGridChange('minCellSize', ev.value);
        });
        
        // Regenerate grid button
        gridFolder.addButton({
          title: 'Regenerate Grid'
        }).on('click', () => {
          setGridSettings({...gridSettings});
        });
        
        // Store the pane and bindings
        paneRef.current = pane;
        (paneRef.current as any).bindings = bindings;
        
        // Define the updateSpiralControls function
        const updateSpiralControls = () => {
          const isSpiralVisible = halftoneSettings.arrangement === 'spiral';
          const allSpiralBindings = ['spiralTightness', 'spiralExpansion', 'spiralRotation', 'spiralCenterX', 'spiralCenterY'];
          
          // Remove all spiral controls if they exist but shouldn't be visible
          if (!isSpiralVisible) {
            allSpiralBindings.forEach(key => {
              if (bindings[key]) {
                halftoneFolder.remove(bindings[key]);
                bindings[key] = null;
              }
            });
            return;
          }
          
          // Add spiral controls if they should be visible but don't exist yet
          if (!bindings.spiralTightness) {
            // First, remove all controls after arrangement to reinsert them later
            const controlsToRemove: TweakpaneBladeApi[] = [];
            let foundArrangement = false;
            
            halftoneFolder.children.forEach(control => {
              if (foundArrangement && control !== bindings.arrangement) {
                controlsToRemove.push(control as TweakpaneBladeApi);
              }
              if (control === bindings.arrangement) {
                foundArrangement = true;
              }
            });
            
            // Store references to removed controls
            const removedControls: TweakpaneBladeApi[] = [];
            controlsToRemove.forEach(control => {
              removedControls.push(control);
              halftoneFolder.remove(control);
            });
            
            // Add spiral controls
            bindings.spiralTightness = halftoneFolder.addBinding(halftoneSettings, 'spiralTightness', {
              label: 'Spiral Tightness',
              min: 0.01,
              max: 0.2,
              step: 0.01
            }).on('change', (ev) => {
              handleHalftoneChange('spiralTightness', ev.value);
            });
            
            bindings.spiralExpansion = halftoneFolder.addBinding(halftoneSettings, 'spiralExpansion', {
              label: 'Spiral Growth',
              min: 0.5,
              max: 3.0,
              step: 0.1
            }).on('change', (ev) => {
              handleHalftoneChange('spiralExpansion', ev.value);
            });
            
            bindings.spiralRotation = halftoneFolder.addBinding(halftoneSettings, 'spiralRotation', {
              label: 'Spiral Rotation',
              min: -180,
              max: 180,
              step: 5
            }).on('change', (ev) => {
              handleHalftoneChange('spiralRotation', ev.value);
            });
            
            bindings.spiralCenterX = halftoneFolder.addBinding(halftoneSettings, 'spiralCenterX', {
              label: 'Center X Offset',
              min: -500,
              max: 500,
              step: 5
            }).on('change', (ev) => {
              handleHalftoneChange('spiralCenterX', ev.value);
            });
            
            bindings.spiralCenterY = halftoneFolder.addBinding(halftoneSettings, 'spiralCenterY', {
              label: 'Center Y Offset',
              min: -500,
              max: 500,
              step: 5
            }).on('change', (ev) => {
              handleHalftoneChange('spiralCenterY', ev.value);
            });
            
            // Re-add the removed controls
            removedControls.forEach(control => {
              halftoneFolder.add(control);
            });
          }
        };

        // Define the updateConcentricControls function
        const updateConcentricControls = () => {
          const isConcentricVisible = halftoneSettings.arrangement === 'concentric';
          const allConcentricBindings = ['concentricRingSpacing', 'concentricCenterX', 'concentricCenterY'];
          
          // Remove all concentric controls if they exist but shouldn't be visible
          if (!isConcentricVisible) {
            allConcentricBindings.forEach(key => {
              if (bindings[key]) {
                halftoneFolder.remove(bindings[key]);
                bindings[key] = null;
              }
            });
            return;
          }
          
          // Add concentric controls if they should be visible but don't exist yet
          if (!bindings.concentricRingSpacing) {
            // First, remove all controls after arrangement to reinsert them later
            const controlsToRemove: TweakpaneBladeApi[] = [];
            let foundArrangement = false;
            
            halftoneFolder.children.forEach(control => {
              if (foundArrangement && control !== bindings.arrangement) {
                controlsToRemove.push(control as TweakpaneBladeApi);
              }
              if (control === bindings.arrangement) {
                foundArrangement = true;
              }
            });
            
            // Store references to removed controls
            const removedControls: TweakpaneBladeApi[] = [];
            controlsToRemove.forEach(control => {
              removedControls.push(control);
              halftoneFolder.remove(control);
            });
            
            // Add concentric controls
            bindings.concentricRingSpacing = halftoneFolder.addBinding(halftoneSettings, 'concentricRingSpacing', {
              label: 'Ring Spacing',
              min: 0.5,
              max: 3.0,
              step: 0.1
            }).on('change', (ev) => {
              handleHalftoneChange('concentricRingSpacing', ev.value);
            });
            
            bindings.concentricCenterX = halftoneFolder.addBinding(halftoneSettings, 'concentricCenterX', {
              label: 'Center X Offset',
              min: -500,
              max: 500,
              step: 5
            }).on('change', (ev) => {
              handleHalftoneChange('concentricCenterX', ev.value);
            });
            
            bindings.concentricCenterY = halftoneFolder.addBinding(halftoneSettings, 'concentricCenterY', {
              label: 'Center Y Offset',
              min: -500,
              max: 500,
              step: 5
            }).on('change', (ev) => {
              handleHalftoneChange('concentricCenterY', ev.value);
            });
            
            // Re-add the removed controls
            removedControls.forEach(control => {
              halftoneFolder.add(control);
            });
          }
        };
        
        // Call initially to set up the UI correctly
        updateSpiralControls();
        updateConcentricControls();
        
        // Update when arrangement changes
        bindings.arrangement.on('change', () => {
          updateSpiralControls();
          updateConcentricControls();
        });

        // Add crop button to the main folder
        const mainFolder = pane.addFolder({
          title: 'Image Controls',
        });

        mainFolder.addButton({
          title: 'Crop Image',
        }).on('click', () => {
          if (image) {
            setIsCropping(true);
          }
        });

        return () => {
          if (paneRef.current) {
            paneRef.current.dispose();
            paneRef.current = null;
          }
        };
      } catch (error) {
        console.error('Error initializing Tweakpane:', error);
      }
    }
  }, [image]); // Only depend on image, not other state variables

  // Update Tweakpane bindings when states change
  useEffect(() => {
    if (!paneRef.current) return;
    
    const bindings = (paneRef.current as any).bindings;
    if (!bindings) return;
    
    try {
      // Update dithering settings if they exist
      if (bindings.ditherEnabled?.controller_?.binding?.target) {
        bindings.ditherEnabled.controller_.binding.target.enabled = ditherSettings.enabled;
        bindings.ditherEnabled.refresh();
      }
      
      if (bindings.ditherType?.controller_?.binding?.target) {
        bindings.ditherType.controller_.binding.target.type = ditherSettings.type;
        bindings.ditherType.refresh();
      }
      
      if (bindings.ditherResolution?.controller_?.binding?.target) {
        bindings.ditherResolution.controller_.binding.target.resolution = ditherSettings.resolution;
        bindings.ditherResolution.refresh();
      }
      
      if (bindings.ditherColorDepth?.controller_?.binding?.target) {
        bindings.ditherColorDepth.controller_.binding.target.colorDepth = ditherSettings.colorDepth;
        bindings.ditherColorDepth.refresh();
      }
      
      if (bindings.ditherThreshold?.controller_?.binding?.target) {
        bindings.ditherThreshold.controller_.binding.target.threshold = ditherSettings.threshold;
        bindings.ditherThreshold.refresh();
      }
      
      if (bindings.ditherColorMode?.controller_?.binding?.target) {
        bindings.ditherColorMode.controller_.binding.target.colorMode = ditherSettings.colorMode;
        bindings.ditherColorMode.refresh();
      }
      
    } catch (error) {
      console.error('Error updating Tweakpane bindings:', error);
    }
  }, [ditherSettings]);

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

  // Load a random image
  const loadRandomImage = () => {
    // Use a standard size for initial fetching
    const randomId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/1200/800?random=${randomId}`;
    
    // Fetch the image
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const imageData = e.target.result as string;
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
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error loading random image:', error);
      });
  };

  // Reset to original image
  const resetImage = () => {
    console.log('Reset button clicked');
    if (!originalImageDataRef) return;
    
    // Reset image and all settings
    setImage(originalImageDataRef);
    
    // Reset all settings to defaults
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
      blendMode: 'normal' as 'normal'
    });
    
    setHalftoneSettings({
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

    setThresholdSettings({
      enabled: false,
      mode: 'solid' as ThresholdMode,
      threshold: 128,
      darkColor: '#000000',
      lightColor: '#FFFFFF',
      darkColorStart: '#000000',
      darkColorEnd: '#000066',
      lightColorStart: '#FFFFFF',
      lightColorEnd: '#FFFF66'
    });

    setDitherSettings({
      enabled: false,
      type: 'ordered' as 'ordered',
      threshold: 128,
      colorMode: 'grayscale' as 'grayscale',
      resolution: 30,
      colorDepth: 2
    });

    setTextDitherSettings({
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
    
    // Reset glitch settings
    setGlitchSettings({
      masterEnabled: false,
      enabled: false,
      glitchIntensity: 50,
      glitchDensity: 50,
      glitchDirection: 'horizontal' as 'horizontal' | 'vertical' | 'both',
      
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

    // Force recreate Tweakpane instance
    if (paneRef.current) {
      paneRef.current.dispose();
      paneRef.current = null;
      
      // Force a rerender by simulating an image change, which will recreate the pane
      setImage(null);
      setTimeout(() => {
        setImage(originalImageDataRef);
      }, 50);
    } else {
      // If there's no pane yet, just process the image with reset settings
      processImage();
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
      
      // Apply color adjustments
      if (colorSettings.enabled) {
        applyColorAdjustments(sourceCtx, canvasWidth, canvasHeight, colorSettings);
      }
      
      // Apply gradient map
      if (gradientMapSettings.enabled) {
        applyGradientMap(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, gradientMapSettings);
      }
      
      // Apply threshold effect
      if (thresholdSettings.enabled) {
        applyThreshold(sourceCtx, canvasWidth, canvasHeight, thresholdSettings);
      }
      
      // Apply halftone effect
      if (halftoneSettings.enabled) {
        applyHalftone(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, halftoneSettings);
      }
      
      // Apply grid effect
      if (gridSettings.enabled) {
        const grid = createGrid(canvasWidth, canvasHeight, gridSettings);
        grid.forEach(cell => renderGridCell(sourceCtx, cell, sourceCanvas, gridSettings));
      }
      
      // Apply dithering
      if (ditherSettings.enabled) {
        applyDithering(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, ditherSettings);
      }
      
      // Apply text dithering
      if (textDitherSettings.enabled) {
        applyTextDither(sourceCtx, canvasWidth, canvasHeight, textDitherSettings);
      }
      
      // Apply glitch effects
      if (glitchSettings.masterEnabled) {
        applyGlitch(sourceCtx, sourceCanvas, canvasWidth, canvasHeight, glitchSettings);
      }
      
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
    gradientMapSettings
  ]);

  // Process image when it changes
  useEffect(() => {
    if (image) {
      processImage();
    }
  }, [image, processImage]);

  const handleCropComplete = (croppedOriginal: string, croppedModified: string) => {
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
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                New Image
              </button>
              <button
                onClick={loadRandomImage}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Load Random
              </button>
              <button
                onClick={resetImage}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => canvasRef.current && exportCanvasAsPng(canvasRef.current)}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Export PNG
              </button>
              <button
                onClick={() => canvasRef.current && exportCanvasAsSvg(canvasRef.current)}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
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
                  <p className="text-gray-600">Drag & drop an image here, or click to select</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="lg:w-80 xl:w-96">
        <div className="sticky top-20 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div ref={paneContainerRef} className="tweakpane-container"></div>
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