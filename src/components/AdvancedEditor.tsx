'use client'

import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { ColorSettings, applyColorAdjustments } from './ColorUtils'
import { GridSettings, GridCell, createGrid, renderGridCell } from './Grid'
import { HalftoneSettings, HalftoneArrangement, HalftoneShape, applyHalftone } from './Halftone'
import { exportAsPng, exportAsSvg, createHalftoneVectorSvg, exportAsVectorSvg } from './SvgExport'
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
        
        // Create Tweakpane instance
        const pane = new Pane({
          container: paneContainerRef.current,
          title: 'Image Editor Controls',
        });
        
        console.log('Pane created:', pane);
        
        // Store references to bindings so we can update them
        const bindings: Record<string, any> = {};
        
        // 1. CANVAS SETTINGS FOLDER
        const canvasFolder = pane.addFolder({
          title: 'Canvas Settings',
          expanded: true,
        });
        
        // Create objects to bind to the UI
        const canvasParams = { 
          width: canvasWidth, 
          height: canvasHeight,
          lockRatio: lockRatio,
          autoSize: autoCanvasSize
        };
        
        const aspectParams = { aspectRatio };
        
        // Canvas Width
        bindings.width = canvasFolder.addBinding(canvasParams, 'width', {
          label: 'Width',
          min: 100,
          max: 3000,
          step: 1,
        }).on('change', (ev) => {
          handleWidthChange(ev.value);
        });
        
        // Canvas Height
        bindings.height = canvasFolder.addBinding(canvasParams, 'height', {
          label: 'Height',
          min: 100,
          max: 3000,
          step: 1,
        }).on('change', (ev) => {
          handleHeightChange(ev.value);
        });
        
        // Aspect Ratio
        bindings.aspectRatio = canvasFolder.addBinding(aspectParams, 'aspectRatio', {
          label: 'Aspect Ratio',
          options: {
            'Square (1:1)': '1:1',
            '4:3': '4:3',
            '16:9': '16:9',
            '3:2': '3:2',
            '5:4': '5:4',
            '2:1': '2:1',
            '3:4': '3:4',
            '9:16': '9:16',
            '2:3': '2:3',
            '4:5': '4:5',
            '1:2': '1:2',
            'Custom': 'custom',
          }
        }).on('change', (ev) => {
          setAspectRatio(ev.value as AspectRatioPreset);
        });
        
        // Lock ratio
        bindings.lockRatio = canvasFolder.addBinding(canvasParams, 'lockRatio', {
          label: 'Lock Ratio'
        }).on('change', (ev) => {
          setLockRatio(ev.value);
        });
        
        // Auto canvas size
        bindings.autoSize = canvasFolder.addBinding(canvasParams, 'autoSize', {
          label: 'Auto Size'
        }).on('change', (ev) => {
          setAutoCanvasSize(ev.value);
          if (ev.value && image) {
            // Reset to image dimensions when auto size is enabled
            const img = new Image();
            img.onload = () => {
              setCanvasWidth(img.width);
              setCanvasHeight(img.height);
              setAspectRatio('custom');
            };
            img.src = image;
          }
        });
        
        // 2. COLOR ADJUSTMENTS FOLDER
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
        
        // 3. HALFTONE EFFECTS FOLDER
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
        
        // Modify the updateSpiralControls function to add spiral controls one after another
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
        
        // 4. GRID EFFECTS FOLDER
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
        
        // 5. EXPORT FOLDER
        const exportFolder = pane.addFolder({
          title: 'Export',
          expanded: false
        });

        // Add export buttons to Export folder in Tweakpane
        const exportButtons = [
          { title: 'Export PNG', handler: () => {
            if (!canvasRef.current) return;
            
            const now = new Date();
            const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0];
            const imageInfo = {
              title: `ImageTweaker Export ${dateStr}`,
              description: 'Created with ImageTweaker',
              effects: `${colorSettings.enabled ? 'Color' : ''}${halftoneSettings.enabled ? ' Halftone' : ''}${gridSettings.enabled ? ' Grid' : ''}`.trim()
            };
            
            exportAsPng(canvasRef.current, `imagetweaker_${dateStr}.png`, imageInfo);
          }},
          { title: 'Export as SVG', handler: () => {
            if (!canvasRef.current) return;
            
            const now = new Date();
            const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0];
            const imageInfo = {
              title: `ImageTweaker Export ${dateStr}`,
              description: 'Created with ImageTweaker',
              effects: `${colorSettings.enabled ? 'Color' : ''}${halftoneSettings.enabled ? ' Halftone' : ''}${gridSettings.enabled ? ' Grid' : ''}`.trim()
            };
            
            exportAsSvg(canvasRef.current, `imagetweaker_${dateStr}.svg`, imageInfo);
          }},
          { title: 'Export as Vector SVG', handler: () => {
            if (!canvasRef.current) return;
            
            const now = new Date();
            const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0];
            const imageInfo = {
              title: `ImageTweaker Vector Export ${dateStr}`,
              description: 'Created with ImageTweaker',
              effects: `${colorSettings.enabled ? 'Color' : ''}${halftoneSettings.enabled ? ' Halftone' : ''}${gridSettings.enabled ? ' Grid' : ''}`.trim()
            };
            
            exportAsVectorSvg(canvasRef.current, `imagetweaker_vector_${dateStr}.svg`, imageInfo);
          }}
        ];
        
        // Add all export buttons to the folder
        exportButtons.forEach(button => {
          exportFolder.addButton({
            title: button.title
          }).on('click', button.handler);
        });
        
        // Conditionally add Vector Halftone export button if halftone is enabled
        if (halftoneSettings.enabled) {
          exportFolder.addButton({
            title: 'Export Vector Halftone'
          }).on('click', () => {
            if (!sourceCanvasRef.current) return;
            
            // Create timestamp and basic info
            const now = new Date();
            const dateStr = now.toISOString().replace(/:/g, '-').split('.')[0];
            const imageInfo = {
              title: `ImageTweaker Vector Halftone ${dateStr}`,
              description: 'Created with ImageTweaker',
              halftoneSettings: JSON.stringify({
                cellSize: halftoneSettings.cellSize,
                arrangement: halftoneSettings.arrangement,
                shape: halftoneSettings.shape,
                cmyk: halftoneSettings.enableCMYK
              })
            };
            
            // Get the source image data
            const sourceCtx = sourceCanvasRef.current.getContext('2d');
            if (!sourceCtx) return;
            
            const imageData = sourceCtx.getImageData(
              0, 0, 
              sourceCanvasRef.current.width, 
              sourceCanvasRef.current.height
            );
            
            // Create vector SVG
            const vectorSvg = createHalftoneVectorSvg(
              imageData,
              sourceCanvasRef.current.width,
              sourceCanvasRef.current.height,
              halftoneSettings,
              imageInfo
            );
            
            // Create a blob with the SVG content
            const blob = new Blob([vectorSvg], { type: 'image/svg+xml;charset=utf-8' });
            
            // Download the file
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `imagetweaker_vector_halftone_${dateStr}.svg`;
            link.click();
          });
        }
        
        // 6. ACTIONS FOLDER
        const actionsFolder = pane.addFolder({
          title: 'Actions',
          expanded: true,
        });

        // Reset changes button
        actionsFolder.addButton({
          title: 'Reset Changes'
        }).on('click', () => {
          resetImage();
        });
        
        // New image button
        actionsFolder.addButton({
          title: 'New Image'
        }).on('click', () => {
          setImage(null);
          setOriginalImageDataRef(null);
        });
        
        // Store the pane and bindings
        paneRef.current = pane;
        (paneRef.current as any).bindings = bindings;
        
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

  // This useEffect updates the Tweakpane UI when relevant state changes
  useEffect(() => {
    if (!paneRef.current) return;
    
    const bindings = (paneRef.current as any).bindings;
    if (!bindings) return;
    
    try {
      // Update canvas dimensions
      if (bindings.width) {
        bindings.width.controller_.binding.target.width = canvasWidth;
        bindings.width.refresh();
      }
      
      if (bindings.height) {
        bindings.height.controller_.binding.target.height = canvasHeight;
        bindings.height.refresh();
      }
      
      // Other controls don't need manual updates since they have change handlers
      // that set the state directly. The canvas rendering will happen based on
      // the updated state values.
      
    } catch (error) {
      console.error('Error updating Tweakpane bindings:', error);
    }
  }, [canvasWidth, canvasHeight, aspectRatio, lockRatio, autoCanvasSize]);

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
    if (!originalImageDataRef) return;
    setImage(originalImageDataRef);
    
    // Reset settings
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

  // Draw image on canvas
  useEffect(() => {
    if (!image || !canvasRef.current || !sourceCanvasRef.current) return;

    setProcessing(true);
    const canvas = canvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const sourceCtx = sourceCanvas.getContext('2d');
    
    if (!ctx || !sourceCtx) return;
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    sourceCanvas.width = canvasWidth;
    sourceCanvas.height = canvasHeight;
    
    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions for "cover" behavior
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, x, y;
      
      // Implement "cover" behavior - always fill canvas completely
      if (canvasRatio > imgRatio) {
        // Canvas is wider than image ratio - crop top/bottom
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgRatio;
        x = 0;
        y = (canvas.height - drawHeight) / 2;
      } else {
        // Canvas is taller than image ratio - crop sides
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgRatio;
        x = (canvas.width - drawWidth) / 2;
        y = 0;
      }
      
      // Draw the image on source canvas with "cover" behavior
      sourceCtx.drawImage(img, x, y, drawWidth, drawHeight);
      
      // Apply color adjustments if enabled to source canvas
      if (colorSettings.enabled) {
        applyColorAdjustments(sourceCtx, sourceCanvas.width, sourceCanvas.height, colorSettings);
      }
      
      // Create a temporary canvas for halftone processing
      let tempCanvas = sourceCanvas;
      
      // Apply halftone effect if enabled
      if (halftoneSettings.enabled) {
        // Create a temporary canvas for halftone processing
        const tempCanvasEl = document.createElement('canvas');
        tempCanvasEl.width = canvas.width;
        tempCanvasEl.height = canvas.height;
        const tempCtx = tempCanvasEl.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(sourceCanvas, 0, 0);
          
          // Clear the source canvas for halftone rendering
          sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          
          // Apply halftone effect
          applyHalftone(sourceCtx, tempCanvasEl, canvas.width, canvas.height, halftoneSettings);
        }
      }
      
      // Apply grid effects if enabled
      if (gridSettings.enabled) {
        // Create a grid
        const cells = createGrid(canvas.width, canvas.height, gridSettings);
        
        // Render grid cells
        if (cells.length > 0) {
          for (const cell of cells) {
            renderGridCell(ctx, cell, sourceCanvas, sourceCtx);
          }
        } else {
          // If no grid cells, just copy from source canvas
          ctx.drawImage(sourceCanvas, 0, 0);
        }
      } else {
        // If no grid effects, just copy from source canvas
        ctx.drawImage(sourceCanvas, 0, 0);
      }
      
      setProcessing(false);
    };
    img.src = image;
  }, [image, canvasWidth, canvasHeight, colorSettings, halftoneSettings, gridSettings]);

  return (
    <div className="min-h-screen relative">
      {!image ? (
        <div 
          {...getRootProps()} 
          className={`border-4 border-dashed border-black p-10 text-center cursor-pointer ${
            isDragActive ? 'bg-gray-100' : ''
          }`}
          style={{ minHeight: '200px' }}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center h-32">
            <p className="text-base uppercase font-bold">Drag or upload an image</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                loadRandomImage();
              }}
              className="mt-4 px-3 py-1 bg-black text-white border border-black hover:bg-white hover:text-black transition"
            >
              Random Image
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Canvas Area */}
          <div className="relative">
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                <div className="h-6 w-6 border-2 border-black border-t-transparent animate-spin"></div>
              </div>
            )}
            <canvas 
              ref={canvasRef} 
              className="max-w-full border border-black"
            />
          </div>
          
          {/* Tweakpane Container - Floating on right */}
          <div 
            ref={paneContainerRef} 
            className="absolute top-0 right-0 mt-4"
            style={{ 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              maxHeight: 'calc(100vh - 40px)', 
              overflowY: 'auto',
              zIndex: 1000
            }}
          />
        </div>
      )}
    </div>
  );
} 