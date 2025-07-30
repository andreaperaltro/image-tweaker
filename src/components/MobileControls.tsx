'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import './MobileControls.css'
import { DitherSettings, DitherColorMode, DitherType } from './DitherUtils'
import { getSystemFonts, isSystemFontsAvailable, loadCustomFont, WEB_SAFE_FONTS, SystemFont } from '../utils/FontUtils'
import { HalftoneSettings, HalftoneShape, HalftoneArrangement } from './Halftone'
import { ColorSettings } from './ColorUtils'
import { ThresholdSettings, ThresholdStop } from './ThresholdUtils'
import { GlitchSettings } from './GlitchUtils'
import { GradientMapSettings, GradientMapBlendMode, GradientStop } from './GradientMapUtils'
import { GridSettings } from './Grid'
import Slider from './Slider'
import { BlurSettings, EffectInstance, TextEffectSettings, EffectType } from '../types'
import { saveEffectSettings, loadEffectSettings, EffectSettings } from '../utils/EffectSettingsUtils'
import { isVectorExportAvailable } from './ExportUtils'
import { FiFileText, FiPlus, FiCopy, FiTrash2, FiArrowUp, FiArrowDown, FiGrid, FiDroplet, FiSliders, FiZap, FiEye, FiLayers, FiType, FiHash, FiImage, FiStar, FiAlignCenter, FiBarChart2, FiCpu, FiFilter, FiChevronRight, FiTv, FiEdit, FiPenTool } from 'react-icons/fi'
import { FaRegDotCircle, FaRegSquare, FaRegCircle, FaRegClone, FaRegObjectGroup, FaRegSmile, FaRegSun, FaRegMoon, FaRegSnowflake, FaRegChartBar, FaRegKeyboard, FaThLarge } from 'react-icons/fa'
import { MdGradient, MdBlurOn, MdOutlineTextFields, MdOutlineNoiseControlOff, MdOutlineGridOn, MdOutlineColorLens, MdOutlineInvertColors, MdOutlineTextIncrease, MdOutlineTextRotateVertical, MdOutlineTextRotationNone, MdOutlineTextRotationAngleup, MdOutlineTextRotationAngledown, MdDragIndicator, MdExpandLess, MdExpandMore } from 'react-icons/md'
import { MdFitbit, MdCompare, MdTexture, MdFingerprint, MdGrain, MdTonality, MdPattern, MdSnowing, MdTerminal, MdStream, MdOutlineWaves, Md3dRotation, MdInterests, MdEmojiSymbols } from 'react-icons/md'
import { MdOutlineGrid4X4 } from 'react-icons/md'
import { MosaicShiftSettings, ShiftPattern } from './MosaicShift'
import { SliceShiftSettings } from './SliceShift'
import { PosterizeSettings } from './Posterize'
import { FindEdgesSettings, EdgeDetectionAlgorithm } from './FindEdges'
import { PolarPixelSettings } from './PolarPixel'
import { PixelEffectSettings, PixelMode, PixelVariant } from './PixelEffect'
import Toggle from './Toggle'
import Switch from './Switch'
import LCDEffect from './LCDEffect'
import { SnakeEffectSettings, SnakeIcon } from './SnakeEffect'
import { ThreeDEffectControls } from './ThreeDEffectControls'
import { ShapeGridSettings } from './ShapeGridEffect'
import { TruchetControls } from './TruchetControls'
import { TruchetSettings } from './TruchetEffect'
import { GiGearStickPattern } from 'react-icons/gi'
import { MdWaves, MdApps, MdViewComfy, MdContentCut, MdPalette, MdRadar } from 'react-icons/md'
import { ASCII_CHARSETS } from './AsciiEffect'

// Font Family Selector Component
interface FontFamilySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCustomFontLoad?: (font: { family: string, url: string }) => void;
  settings?: { fontWeight?: string };
  onFontWeightChange?: (weight: string) => void;
}

const FontFamilySelector: React.FC<FontFamilySelectorProps> = ({ 
  value, 
  onChange,
  onCustomFontLoad,
  settings,
  onFontWeightChange
}) => {
  const [systemFonts, setSystemFonts] = useState<SystemFont[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasSystemFonts, setHasSystemFonts] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFont, setSelectedFont] = useState<SystemFont | null>(null)

  useEffect(() => {
    const loadFonts = async () => {
      setIsLoading(true)
      try {
        // First check if we have access to system fonts
        const available = await isSystemFontsAvailable()
        setHasSystemFonts(available)
        
        if (available) {
          // Get the system fonts
          const fonts = await getSystemFonts()
          setSystemFonts(fonts)
          
          // If current value is a system font, update selected font
          if (value) {
            const font = fonts.find(f => f.family === value)
            if (font) {
              setSelectedFont(font)
            }
          }
        }
      } catch (error) {
        console.error('Error loading fonts:', error)
        setHasSystemFonts(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadFonts()
  }, [value])

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    const font = systemFonts.find(f => f.family === newValue)
    setSelectedFont(font || null)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const font = await loadCustomFont(file)
      onCustomFontLoad?.(font)
      onChange(font.family)
      setSelectedFont(null)
    } catch (error) {
      console.error('Error loading custom font:', error)
      alert('Failed to load custom font. Please try another file.')
    }
  }

  // Get available weights for the current font
  const getAvailableWeights = () => {
    if (selectedFont?.weights.length) {
      return selectedFont.weights;
    }
    // Default weights for web safe fonts
    return [100, 200, 300, 400, 500, 600, 700, 800, 900].filter(weight => {
      const testElement = document.createElement('span');
      testElement.style.fontFamily = value;
      testElement.style.fontWeight = weight.toString();
      document.body.appendChild(testElement);
      const isSupported = getComputedStyle(testElement).fontWeight === weight.toString();
      document.body.removeChild(testElement);
      return isSupported;
    });
  }

  return (
    <>
      <div className="mobile-control-group">
        <label className="mobile-control-label">
          Font Family
          {isLoading && <span className="ml-2 text-sm opacity-70">(Loading...)</span>}
        </label>
        <select
          className="mobile-select"
          value={value}
          onChange={handleFontChange}
        >
          <optgroup label="Web Fonts">
            {WEB_SAFE_FONTS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </optgroup>
          
          {hasSystemFonts && systemFonts.length > 0 && (
            <optgroup label="System Fonts">
              {systemFonts.map(font => (
                <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
                  {font.family}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Custom Font Upload Button */}
      <div className="mobile-control-group">
        <button
          className="mobile-select text-left"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          Upload Custom Font
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Font Weight Control */}
      <div className="mobile-control-group">
        <label className="mobile-control-label">Font Weight</label>
        <select
          className="mobile-select"
          value={settings?.fontWeight || '400'}
          onChange={(e) => onFontWeightChange?.(e.target.value)}
        >
          {getAvailableWeights().map(weight => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

// Add interface for gradient stop
interface GradientStopType {
  position: number;
  color: string;
}

interface MobileControlsProps {
  ditherSettings: DitherSettings
  halftoneSettings: HalftoneSettings
  colorSettings: ColorSettings
  thresholdSettings: ThresholdSettings
  glitchSettings: GlitchSettings
  gradientMapSettings: GradientMapSettings
  gridSettings: GridSettings
  effectInstances: EffectInstance[]
  instanceSettings: {[id: string]: any}
  updateDitherSettings: (settings: Partial<DitherSettings>) => void
  updateHalftoneSettings: (settings: Partial<HalftoneSettings>, key?: string) => void
  updateColorSettings: (settings: Partial<ColorSettings>) => void
  updateThresholdSettings: (settings: Partial<ThresholdSettings>) => void
  updateGlitchSettings: (settings: Partial<GlitchSettings>) => void
  updateGradientMapSettings: (settings: Partial<GradientMapSettings>) => void
  updateGridSettings: (key: string, value: any) => void
  updateInstanceSettings: (id: string, settings: any) => void
  updateEffectInstances: (instances: EffectInstance[]) => void
  addEffect: (type: EffectType) => void
  duplicateEffect: (id: string) => void
  removeEffect: (id: string) => void
  onResetImage: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportVideo: () => void
  onSaveSettings: () => void
  onLoadSettings: () => void
  onCropImage: () => void
  onRandomImage: () => void
  onUploadImage: () => void
  onClearImage: () => void
  textEffectSettings: TextEffectSettings;
  updateTextEffectSettings: (settings: Partial<TextEffectSettings>) => void;
  snakeEffectSettings: SnakeEffectSettings;
  updateSnakeEffectSettings: (settings: Partial<SnakeEffectSettings>) => void;
  truchetSettings: TruchetSettings;
  updateTruchetSettings: (settings: Partial<TruchetSettings>) => void;
  processImageCallback?: () => void;
}

// Debounce function to limit update frequency
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Helper function to create CSS gradient from stops
const getGradientPreviewStyle = (stops: GradientStop[] | ThresholdStop[]): string => {
  if (!stops || stops.length < 2) return 'linear-gradient(to right, #000000, #ffffff)';
  
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const gradientStops = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
  return `linear-gradient(to right, ${gradientStops})`;
};

const MobileControls: React.FC<MobileControlsProps> = ({
  ditherSettings,
  halftoneSettings,
  colorSettings,
  thresholdSettings,
  glitchSettings,
  gradientMapSettings,
  gridSettings,
  effectInstances,
  instanceSettings,
  updateDitherSettings,
  updateHalftoneSettings,
  updateColorSettings,
  updateThresholdSettings,
  updateGlitchSettings,
  updateGradientMapSettings,
  updateGridSettings,
  updateInstanceSettings,
  updateEffectInstances,
  addEffect,
  duplicateEffect,
  removeEffect,
  onResetImage,
  onExportPng,
  onExportSvg,
  onExportVideo,
  onSaveSettings,
  onLoadSettings,
  onCropImage,
  onRandomImage,
  onUploadImage,
  onClearImage,
  textEffectSettings,
  updateTextEffectSettings,
  snakeEffectSettings,
  updateSnakeEffectSettings,
  truchetSettings,
  updateTruchetSettings,
  processImageCallback
}) => {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [shapesOpenStates, setShapesOpenStates] = useState<{[key: string]: boolean}>({});

  // Create debounced versions of update functions for color pickers
  const debouncedUpdateGradientMapSettings = useDebounce(updateGradientMapSettings, 100);
  const debouncedUpdateThresholdSettings = useDebounce(updateThresholdSettings, 100);
  const debouncedUpdateDitherSettings = useDebounce(updateDitherSettings, 100);
  
  // Helper function to handle color changes with debounce
  const handleColorChange = (
    updateFn: (instance: EffectInstance, settings: any) => void | ((settings: any) => void), 
    colorKey: string, 
    newColor: string
  ) => {
    // Update UI immediately for better feedback
    const inputElement = document.activeElement as HTMLInputElement;
    if (inputElement && inputElement.type === 'color') {
      inputElement.value = newColor;
    }
    
    // Debounce the actual state update
    setTimeout(() => {
      if (typeof updateFn === 'function') {
        if (updateFn.length === 1) {
          // For global settings
          (updateFn as (settings: any) => void)({ [colorKey]: newColor });
        } else if (updateFn.length === 2) {
          // For instance-specific settings (this won't get called directly)
          console.warn("Instance required for instance-specific color updates");
        }
      }
    }, 100);
  };

  // New helper for instance-specific color change
  const handleInstanceColorChange = (
    instance: EffectInstance,
    updateFn: (instance: EffectInstance, settings: any) => void,
    colorKey: string,
    newColor: string
  ) => {
    // Update UI immediately for better feedback
    const inputElement = document.activeElement as HTMLInputElement;
    if (inputElement && inputElement.type === 'color') {
      inputElement.value = newColor;
    }
    
    // Debounce the actual state update
    setTimeout(() => {
      updateFn(instance, { [colorKey]: newColor });
    }, 100);
  };

  // Special handler for gradient stops which need array manipulation
  const handleGradientStopChange = (index: number, newColor: string) => {
    // Update immediately for responsive UI
    const inputElement = document.activeElement as HTMLInputElement;
    if (inputElement && inputElement.type === 'color') {
      inputElement.value = newColor;
    }
    
    // Use setTimeout for debounce
    setTimeout(() => {
      const newStops = [...gradientMapSettings.stops];
      
      if (index === 1 && newStops.length <= 1) {
        // If updating middle stop but it doesn't exist
        newStops.push({ position: 50, color: newColor });
      } else {
        // Update existing stop
        if (index < newStops.length) {
          newStops[index] = { ...newStops[index], color: newColor };
        } else if (index === 2 && newStops.length === 2) {
          // If updating last stop (index 2) but we only have 2 stops
          newStops.push({ position: 100, color: newColor });
        }
      }
      
      updateGradientMapSettings({ stops: newStops });
    }, 100);
  };

  const toggleSection = (sectionId: string) => {
    if (openSection === sectionId) {
      setOpenSection(''); // Close if already open
    } else {
      setOpenSection(sectionId); // Open the clicked section
    }
  };

  // Function to move effect up in the order
  const moveEffectUp = (id: string) => {
    const index = effectInstances.findIndex(instance => instance.id === id);
    if (index > 0) {
      const newInstances = [...effectInstances];
      // Swap with previous element
      [newInstances[index - 1], newInstances[index]] = [newInstances[index], newInstances[index - 1]];
      
      // Apply the update
      updateEffectInstances(newInstances);
      
      // Visual feedback - briefly highlight/open the moved section
      setOpenSection(id);
    }
  }

  const moveEffectDown = (id: string) => {
    const index = effectInstances.findIndex(instance => instance.id === id);
    if (index < effectInstances.length - 1) {
      const newInstances = [...effectInstances];
      // Swap with next element
      [newInstances[index], newInstances[index + 1]] = [newInstances[index + 1], newInstances[index]];
      
      // Apply the update
      updateEffectInstances(newInstances);
      
      // Visual feedback - briefly highlight/open the moved section
      setOpenSection(id);
    }
  }

  // Function to render the reorder and action controls
  const renderEffectControls = (instance: EffectInstance) => {
    return (
      <div className="effect-action-buttons mr-2">
        <button 
          className="effect-action-btn" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent section toggle
            moveEffectUp(instance.id);
          }}
          title="Move effect up"
        >
          <FiArrowUp size={16} />
        </button>
        <button 
          className="effect-action-btn" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent section toggle
            moveEffectDown(instance.id);
          }}
          title="Move effect down"
        >
          <FiArrowDown size={16} />
        </button>
        <button 
          className="effect-action-btn" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent section toggle
            duplicateEffect(instance.id);
          }}
          title="Duplicate effect"
        >
          <FiCopy size={16} />
        </button>
        <button 
          className="effect-action-btn" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent section toggle
            removeEffect(instance.id);
          }}
          title="Remove effect"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    );
  };

  // Helper function to toggle effect enabled state
  const toggleEffectEnabled = (id: string, enabled: boolean) => {
    // First update the specific instance's enabled state
    const newInstances = effectInstances.map(instance => 
      instance.id === id ? { ...instance, enabled } : instance
    );
    updateEffectInstances(newInstances);
    
    // We no longer need to update the corresponding settings object
    // This allows multiple instances of the same effect type to have different enabled states
  };

  // Helper function to render section headers with controls
  const renderSectionHeader = (
    instance: EffectInstance,
    title: string
  ) => {
    const orderIndex = effectInstances.findIndex(i => i.id === instance.id);
    return (
      <div className={`mobile-effect-header ${openSection === instance.id ? 'section-open' : ''}`}>
        <div className="mobile-header-row effect-title-toggle-container">
          <div className="effect-title-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="effect-order-number">
              {orderIndex + 1}
            </span>
            {effectIcons[instance.type] && (
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>{effectIcons[instance.type]}</span>
            )}
            <h3 
              className="mobile-effect-title"
              onClick={() => toggleSection(instance.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {title}
            </h3>
          </div>
          <label className="mobile-effect-toggle">
            <input 
              type="checkbox" 
              checked={instance.enabled}
              onChange={(e) => toggleEffectEnabled(instance.id, e.target.checked)}
            />
            <span className="mobile-effect-toggle-slider"></span>
          </label>
        </div>
        <div className="mobile-header-row">
          <div className="effect-controls-container">
            {renderEffectControls(instance)}
          </div>
        </div>
      </div>
    );
  };

  const handleSaveSettings = () => {
    const settings: EffectSettings = {
      ditherSettings,
      halftoneSettings,
      colorSettings,
      thresholdSettings,
      glitchSettings,
      gradientMapSettings,
      gridSettings,
      effectInstances,
      instanceSettings
    };
    saveEffectSettings(settings);
  };

  const handleLoadSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const settings = await loadEffectSettings(file);
      } catch (error) {
        console.error('Error loading settings:', error);
        alert('Error loading settings: ' + (error as Error).message);
      }
    }
  };

  // Add a function to check if vector SVG export is available based on last effect
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

  // Helper function to get instance-specific settings
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
      default:
        return {};
    }
  };

  // Modified updateColorSettings function that uses instance-specific settings
  const handleColorSettingsChange = (instance: EffectInstance, setting: keyof ColorSettings, value: any) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, { [setting]: value });
  };

  // Modified updateHalftoneSettings function that uses instance-specific settings
  const handleHalftoneSettingsChange = (instance: EffectInstance, setting: keyof HalftoneSettings, value: any) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, { [setting]: value });
  };

  // Modified updateDitherSettings function that uses instance-specific settings
  const handleDitherSettingsChange = (instance: EffectInstance, settings: Partial<DitherSettings>) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, settings);
  };

  // Modified updateThresholdSettings function that uses instance-specific settings
  const handleThresholdSettingsChange = (instance: EffectInstance, settings: Partial<ThresholdSettings>) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, settings);
  };

  // Modified updateGlitchSettings function that uses instance-specific settings
  const handleGlitchSettingsChange = (instance: EffectInstance, settings: Partial<GlitchSettings>) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, settings);
  };

  // Modified updateGridSettings function that uses instance-specific settings
  const handleGridSettingsChange = (instance: EffectInstance, setting: keyof GridSettings, value: any) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, { [setting]: value });
  };

  // Modified handleBlurChange function that uses instance-specific settings
  const handleBlurChange = (instance: EffectInstance, settings: BlurSettings) => {
    // Update instance-specific settings
    updateInstanceSettings(instance.id, settings);
  };

  const toggleShapesSection = (instanceId: string) => {
    setShapesOpenStates(prev => ({
      ...prev,
      [instanceId]: !prev[instanceId]
    }));
  };

  // Update the renderEffectContent function to use instance-specific settings
  const renderEffectContent = (instance: EffectInstance) => {
    // Don't render anything if the section is closed
    if (openSection !== instance.id) return null;
    
    // Get the instance-specific settings
    const settings = getInstanceSettings(instance);
  
    // Render appropriate controls based on effect type
    switch (instance.type) {
      case 'distort':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Upload Displacement Map</label>
              <div className="mobile-file-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        updateInstanceSettings(instance.id, {
                          ...settings,
                          displacementMap: reader.result as string,
                          displacementMapUpdatedAt: Date.now(), // Force re-render
                          preserveAspectRatio: true,
                          scale: 1.0,
                          offsetX: 0,
                          offsetY: 0,
                          smoothness: 0
                        });
                        // Call processImageCallback if provided to force re-render
                        if (typeof processImageCallback === 'function') {
                          processImageCallback();
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>

            <Slider
              label="X Distortion"
              value={settings.xAmount || 0}
              onChange={(value) => {
                updateInstanceSettings(instance.id, {
                  ...settings,
                  xAmount: value
                });
              }}
              min={-500}
              max={500}
              step={1}
              showValue={true}
              defaultValue={0} // Default value for X Distortion
            />

            <Slider
              label="Y Distortion"
              value={settings.yAmount || 0}
              onChange={(value) => {
                updateInstanceSettings(instance.id, {
                  ...settings,
                  yAmount: value
                });
              }}
              min={-500}
              max={500}
              step={1}
              showValue={true}
              defaultValue={0} // Default value for Y Distortion
            />

            {settings.displacementMap && (
              <>
                <div className="border-t border-[var(--border-color)] my-2"></div>
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Preserve Aspect Ratio</label>
                  <label className="mobile-effect-toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.preserveAspectRatio}
                      onChange={(e) => updateInstanceSettings(instance.id, {
                        ...settings,
                        preserveAspectRatio: e.target.checked
                      })}
                    />
                    <span className="mobile-effect-toggle-slider"></span>
                  </label>
                </div>

                <Slider
                  label="Scale"
                  value={settings.scale}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    scale: value
                  })}
                  min={0.1}
                  max={20.0}
                  step={0.5}
                  showValue={true}
                  defaultValue={1.0} // Default value for Scale
                />

                <Slider
                  label="Smoothness"
                  value={settings.smoothness}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    smoothness: value
                  })}
                  min={0}
                  max={20}
                  step={0.1}
                  showValue={true}
                  defaultValue={0} // Default value for Smoothness
                />

                <Slider
                  label="X Position"
                  value={settings.offsetX}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    offsetX: value
                  })}
                  min={-100}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={0} // Default value for X Position
                />

                <Slider
                  label="Y Position"
                  value={settings.offsetY}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    offsetY: value
                  })}
                  min={-100}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={0} // Default value for Y Position
                />
              </>
            )}
          </div>
        );
      
      case 'color':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Color adjustments controls */}
            <Slider
              label="Brightness"
              value={settings.brightness}
              onChange={(value) => updateInstanceSettings(instance.id, { brightness: value })}
              min={0}
              max={300}
              step={1}
              unit="%"
              defaultValue={100} // Default value for Brightness
            />
            <Slider
              label="Contrast"
              value={settings.contrast}
              onChange={(value) => updateInstanceSettings(instance.id, { contrast: value })}
              min={0}
              max={300}
              step={1}
              unit="%"
              defaultValue={100} // Default value for Contrast
            />
            <Slider
              label="Saturation"
              value={settings.saturation}
              onChange={(value) => updateInstanceSettings(instance.id, { saturation: value })}
              min={0}
              max={300}
              step={1}
              unit="%"
              defaultValue={100} // Default value for Saturation
            />
            <Slider
              label="Hue Shift"
              value={settings.hueShift}
              onChange={(value) => updateInstanceSettings(instance.id, { hueShift: value })}
              min={-180}
              max={180}
              step={1}
              unit="°"
              defaultValue={0} // Default value for Hue Shift
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert Colors</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.invert}
                  onChange={(e) => updateInstanceSettings(instance.id, { invert: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
          </div>
        );

      case 'blur':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Blur controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blur Type</label>
              <select
                className="mobile-select"
                value={settings.type}
                onChange={(e) => updateInstanceSettings(instance.id, { type: e.target.value })}
              >
                <option value="gaussian">Gaussian</option>
                <option value="box">Box</option>
                <option value="radial">Radial</option>
                <option value="motion">Motion</option>
                <option value="tiltshift">Tilt Shift</option>
                <option value="spin">Spin</option>
              </select>
            </div>
            {settings.type !== 'tiltshift' && (
              <Slider
                label="Radius"
                value={settings.radius}
                onChange={(value) => updateInstanceSettings(instance.id, { radius: value })}
                min={0}
                max={settings.type === 'motion' ? 360 : 50}
                step={settings.type === 'motion' ? 1 : 0.1}
                showValue={true}
                defaultValue={0}
              />
            )}
            {(settings.type === 'radial' || settings.type === 'spin') && (
              <>
                <Slider
                  label="Center X"
                  value={settings.centerX || 50}
                  onChange={(value) => updateInstanceSettings(instance.id, { centerX: value })}
                  min={0}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={50}
                />
                <Slider
                  label="Center Y"
                  value={settings.centerY || 50}
                  onChange={(value) => updateInstanceSettings(instance.id, { centerY: value })}
                  min={0}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={50}
                />
              </>
            )}
            {settings.type === 'spin' && (
              <>
                <Slider
                  label="Center Radius"
                  value={settings.centerRadius || 0}
                  onChange={(value) => updateInstanceSettings(instance.id, { centerRadius: value })}
                  min={0}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={0}
                />
                <Slider
                  label="Center Gradient"
                  value={settings.centerGradient || 0}
                  onChange={(value) => updateInstanceSettings(instance.id, { centerGradient: value })}
                  min={0}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={0}
                />
              </>
            )}
            {settings.type === 'motion' && (
              <Slider
                label="Angle"
                value={settings.angle || 0}
                onChange={(value) => updateInstanceSettings(instance.id, { angle: value })}
                min={0}
                max={360}
                step={1}
                showValue={true}
                defaultValue={0}
              />
            )}
            {settings.type === 'tiltshift' && (
              <>
                <Slider
                  label="Radius"
                  value={settings.radius}
                  onChange={(value) => updateInstanceSettings(instance.id, { radius: value })}
                  min={0}
                  max={50}
                  step={0.1}
                  showValue={true}
                  defaultValue={0}
                />
                <Slider
                  label="Focus Position"
                  value={settings.focusPosition || 50}
                  onChange={(value) => updateInstanceSettings(instance.id, { focusPosition: value })}
                  min={0}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={50}
                />
                <Slider
                  label="Focus Width"
                  value={settings.focusWidth || 25}
                  onChange={(value) => updateInstanceSettings(instance.id, { focusWidth: value })}
                  min={0}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={25}
                />
                <Slider
                  label="Gradient"
                  value={settings.gradient || 12.5}
                  onChange={(value) => updateInstanceSettings(instance.id, { gradient: value })}
                  min={0}
                  max={100}
                  step={0.5}
                  showValue={true}
                  defaultValue={12.5}
                />
                <Slider
                  label="Angle"
                  value={settings.angle || 0}
                  onChange={(value) => updateInstanceSettings(instance.id, { angle: value })}
                  min={0}
                  max={360}
                  step={1}
                  showValue={true}
                  defaultValue={0}
                />
              </>
            )}
          </div>
        );

      case 'gradient':
        // Lookup the index to use as a key for instance identification
        const gradientInstanceIndex = effectInstances.findIndex(i => i.id === instance.id);
        
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Gradient map controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blend Mode</label>
              <select 
                className="mobile-select"
                value={settings.blendMode}
                onChange={(e) => {
                  // Update instance-specific settings
                  updateInstanceSettings(instance.id, { 
                    blendMode: e.target.value as GradientMapBlendMode 
                  });
                }}
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="hue">Hue</option>
                <option value="saturation">Saturation</option>
                <option value="color">Color</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>
            
            <Slider
              label="Opacity"
              value={settings.opacity}
              onChange={(value) => updateInstanceSettings(instance.id, { opacity: value })}
              min={0}
              max={1}
              step={0.01}
              unit="%"
              defaultValue={1} // Default value for Opacity
            />
            
            {/* Visual gradient preview */}
            <div className="mobile-control-group mb-2">
              <div 
                className="w-full h-12 rounded border border-[var(--border-color)] mt-1 shadow-inner" 
                style={{
                  background: getGradientPreviewStyle(settings.stops)
                }}
              ></div>
            </div>
            
            {/* Render dynamic gradient stops */}
            {settings.stops.map((stop: GradientStopType, index: number) => (
              <div key={`stop-${gradientInstanceIndex}-${index}`} className="mobile-control-group">
                <div className="flex items-center gap-2 w-full">
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    style={{ width: '32px', minWidth: '32px', height: '32px' }}
                    value={stop.color}
                    onChange={(e) => {
                      const newStops = [...settings.stops];
                      newStops[index] = { ...stop, color: e.target.value };
                      updateInstanceSettings(instance.id, { stops: newStops });
                    }}
                  />
                  <input
                    type="range"
                    className="flex-grow"
                    min="0"
                    max="100"
                    value={stop.position}
                    onChange={(e) => {
                      const newPosition = parseInt(e.target.value);
                      const newStops = [...settings.stops];
                      newStops[index] = { ...stop, position: newPosition };
                      updateInstanceSettings(instance.id, { stops: newStops });
                    }}
                  />
                  <span className="text-xs text-[var(--text-secondary)] w-10 text-right">{stop.position}%</span>
                  {settings.stops.length > 2 && (
                    <button 
                      className="slider-button"
                      onClick={() => {
                        const newStops = settings.stops.filter((_: GradientStopType, i: number) => i !== index);
                        updateInstanceSettings(instance.id, { stops: newStops });
                      }}
                      aria-label="Remove color stop"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add new stop button */}
            <div className="mobile-control-group mt-3">
              <button 
                className="mobile-action-button w-full"
                onClick={() => {
                  // Find a middle position between existing stops
                  const sortedStops = [...settings.stops].sort((a, b) => a.position - b.position);
                  let newPosition = 50; // Default middle position
                  
                  if (sortedStops.length >= 2) {
                    // Find largest gap between stops
                    let maxGap = 0;
                    let gapPosition = 0;
                    
                    for (let i = 0; i < sortedStops.length - 1; i++) {
                      const gap = sortedStops[i + 1].position - sortedStops[i].position;
                      if (gap > maxGap) {
                        maxGap = gap;
                        gapPosition = sortedStops[i].position + gap / 2;
                      }
                    }
                    
                    newPosition = Math.round(gapPosition);
                  }
                  
                  // Add new stop with a random color
                  const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                  const newStops = [...settings.stops, { position: newPosition, color: randomColor }];
                  updateInstanceSettings(instance.id, { stops: newStops });
                }}
              >
                + Add Color Stop
              </button>
            </div>
          </div>
        );

      case 'threshold':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Threshold controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Mode</label>
              <select 
                className="mobile-select"
                value={settings.mode}
                onChange={(e) => updateInstanceSettings(instance.id, { mode: e.target.value as 'solid' | 'gradient' })}
              >
                <option value="solid">Solid</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>

            <Slider
              label="Threshold"
              value={settings.threshold}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
              defaultValue={128}
            />

            {settings.mode === 'solid' ? (
              <>
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Dark Color</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.darkColor}
                    onChange={(e) => updateInstanceSettings(instance.id, { darkColor: e.target.value })}
                  />
                </div>
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Light Color</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.lightColor}
                    onChange={(e) => updateInstanceSettings(instance.id, { lightColor: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Dark Area Gradient */}
                <div className="mobile-control-group mb-2">
                  <label className="mobile-control-label">Dark Area Gradient</label>
                  <div 
                    className="w-full h-12 rounded border border-[var(--border-color)] mt-1 shadow-inner" 
                    style={{
                      background: getGradientPreviewStyle(settings.darkStops)
                    }}
                  ></div>
                </div>

                <Slider
                  label="Dark Gradient Angle"
                  value={settings.darkGradientAngle}
                  onChange={(value) => updateInstanceSettings(instance.id, { darkGradientAngle: value })}
                  min={0}
                  max={360}
                  step={1}
                  defaultValue={0}
                  unit="°"
                />
                
                {/* Render dark gradient stops */}
                {settings.darkStops.map((stop: ThresholdStop, index: number) => (
                  <div key={`dark-stop-${index}`} className="mobile-control-group">
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        type="color" 
                        className="mobile-color-picker"
                        style={{ width: '32px', minWidth: '32px', height: '32px' }}
                        value={stop.color}
                        onChange={(e) => {
                          const newStops = [...settings.darkStops];
                          newStops[index] = { ...stop, color: e.target.value };
                          updateInstanceSettings(instance.id, { darkStops: newStops });
                        }}
                      />
                      <input
                        type="range"
                        className="flex-grow"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => {
                          const newPosition = parseInt(e.target.value);
                          const newStops = [...settings.darkStops];
                          newStops[index] = { ...stop, position: newPosition };
                          updateInstanceSettings(instance.id, { darkStops: newStops });
                        }}
                      />
                      <span className="text-xs text-[var(--text-secondary)] w-10 text-right">{stop.position}%</span>
                      {settings.darkStops.length > 2 && (
                        <button 
                          className="slider-button"
                          onClick={() => {
                            const newStops = settings.darkStops.filter((_: ThresholdStop, i: number) => i !== index);
                            updateInstanceSettings(instance.id, { darkStops: newStops });
                          }}
                          aria-label="Remove color stop"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add new dark stop button */}
                <div className="mobile-control-group mt-3">
                  <button 
                    className="mobile-action-button w-full"
                    onClick={() => {
                      const sortedStops = [...settings.darkStops].sort((a, b) => a.position - b.position);
                      let newPosition = 50;
                      
                      if (sortedStops.length >= 2) {
                        let maxGap = 0;
                        let gapPosition = 0;
                        
                        for (let i = 0; i < sortedStops.length - 1; i++) {
                          const gap = sortedStops[i + 1].position - sortedStops[i].position;
                          if (gap > maxGap) {
                            maxGap = gap;
                            gapPosition = sortedStops[i].position + gap / 2;
                          }
                        }
                        
                        newPosition = Math.round(gapPosition);
                      }
                      
                      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                      const newStops = [...settings.darkStops, { position: newPosition, color: randomColor }];
                      updateInstanceSettings(instance.id, { darkStops: newStops });
                    }}
                  >
                    + Add Dark Color Stop
                  </button>
                </div>

                {/* Light Area Gradient */}
                <div className="mobile-control-group mb-2 mt-6">
                  <label className="mobile-control-label">Light Area Gradient</label>
                  <div 
                    className="w-full h-12 rounded border border-[var(--border-color)] mt-1 shadow-inner" 
                    style={{
                      background: getGradientPreviewStyle(settings.lightStops)
                    }}
                  ></div>
                </div>

                <Slider
                  label="Light Gradient Angle"
                  value={settings.lightGradientAngle}
                  onChange={(value) => updateInstanceSettings(instance.id, { lightGradientAngle: value })}
                  min={0}
                  max={360}
                  step={1}
                  defaultValue={0}
                  unit="°"
                />
                
                {/* Render light gradient stops */}
                {settings.lightStops.map((stop: ThresholdStop, index: number) => (
                  <div key={`light-stop-${index}`} className="mobile-control-group">
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        type="color" 
                        className="mobile-color-picker"
                        style={{ width: '32px', minWidth: '32px', height: '32px' }}
                        value={stop.color}
                        onChange={(e) => {
                          const newStops = [...settings.lightStops];
                          newStops[index] = { ...stop, color: e.target.value };
                          updateInstanceSettings(instance.id, { lightStops: newStops });
                        }}
                      />
                      <input
                        type="range"
                        className="flex-grow"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => {
                          const newPosition = parseInt(e.target.value);
                          const newStops = [...settings.lightStops];
                          newStops[index] = { ...stop, position: newPosition };
                          updateInstanceSettings(instance.id, { lightStops: newStops });
                        }}
                      />
                      <span className="text-xs text-[var(--text-secondary)] w-10 text-right">{stop.position}%</span>
                      {settings.lightStops.length > 2 && (
                        <button 
                          className="slider-button"
                          onClick={() => {
                            const newStops = settings.lightStops.filter((_: ThresholdStop, i: number) => i !== index);
                            updateInstanceSettings(instance.id, { lightStops: newStops });
                          }}
                          aria-label="Remove color stop"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add new light stop button */}
                <div className="mobile-control-group mt-3">
                  <button 
                    className="mobile-action-button w-full"
                    onClick={() => {
                      const sortedStops = [...settings.lightStops].sort((a, b) => a.position - b.position);
                      let newPosition = 50;
                      
                      if (sortedStops.length >= 2) {
                        let maxGap = 0;
                        let gapPosition = 0;
                        
                        for (let i = 0; i < sortedStops.length - 1; i++) {
                          const gap = sortedStops[i + 1].position - sortedStops[i].position;
                          if (gap > maxGap) {
                            maxGap = gap;
                            gapPosition = sortedStops[i].position + gap / 2;
                          }
                        }
                        
                        newPosition = Math.round(gapPosition);
                      }
                      
                      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
                      const newStops = [...settings.lightStops, { position: newPosition, color: randomColor }];
                      updateInstanceSettings(instance.id, { lightStops: newStops });
                    }}
                  >
                    + Add Light Color Stop
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'dither':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Dithering controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Dither Type</label>
              <select 
                className="mobile-select"
                value={settings.type || 'floyd-steinberg'}
                onChange={(e) => updateInstanceSettings(instance.id, { type: e.target.value })}
              >
                <option value="floyd-steinberg">Floyd-Steinberg</option>
                <option value="ordered">Ordered</option>
                <option value="jarvis">Jarvis</option>
                <option value="judice-ninke">Judice-Ninke</option>
                <option value="stucki">Stucki</option>
                <option value="burkes">Burkes</option>
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Color Mode</label>
              <select 
                className="mobile-select"
                value={settings.colorMode || 'grayscale'}
                onChange={(e) => updateInstanceSettings(instance.id, { colorMode: e.target.value })}
              >
                <option value="grayscale">Grayscale</option>
                <option value="color">Color</option>
                <option value="2-color">2-Color</option>
              </select>
            </div>
            <Slider
              label="Resolution"
              value={settings.resolution || 30}
              onChange={(value) => updateInstanceSettings(instance.id, { resolution: value })}
              min={1}
              max={100}
              step={1}
              unit="%"
              defaultValue={30} // Default value for Resolution
            />
            <Slider
              label="Threshold"
              value={settings.threshold || 128}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
              defaultValue={128} // Default value for Threshold
            />
            <Slider
              label="Color Depth"
              value={settings.colorDepth || 2}
              onChange={(value) => updateInstanceSettings(instance.id, { colorDepth: value })}
              min={2}
              max={256}
              step={1}
              unit=" colors"
              defaultValue={2} // Default value for Color Depth
            />
            {settings.colorMode === '2-color' && (
              <>
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Dark Color</label>
                  <input
                    type="color"
                    value={settings.darkColor || '#000000'}
                    onChange={(e) => updateInstanceSettings(instance.id, { darkColor: e.target.value })}
                  />
                </div>
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Light Color</label>
                  <input
                    type="color"
                    value={settings.lightColor || '#FFFFFF'}
                    onChange={(e) => updateInstanceSettings(instance.id, { lightColor: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'halftone':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Halftone controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Shape</label>
              <select 
                className="mobile-select"
                value={settings.shape}
                onChange={(e) => updateInstanceSettings(instance.id, { shape: e.target.value as HalftoneShape })}
              >
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="diamond">Diamond</option>
                <option value="line">Line</option>
                <option value="cross">Cross</option>
                <option value="ellipse">Ellipse</option>
                <option value="triangle">Triangle</option>
                <option value="hexagon">Hexagon</option>
              </select>
            </div>
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Pattern</label>
              <select 
                className="mobile-select"
                value={settings.arrangement}
                onChange={(e) => updateInstanceSettings(instance.id, { arrangement: e.target.value as HalftoneArrangement })}
              >
                <option value="grid">Grid</option>
                <option value="hexagonal">Hexagonal</option>
                <option value="spiral">Spiral</option>
                <option value="concentric">Concentric</option>
                <option value="random">Random</option>
              </select>
            </div>

            {/* Hexagonal Pattern Controls */}
            {settings.arrangement === 'hexagonal' && (
              <>
                <div className="mobile-control-group">
                  <Slider
                    label="Row Offset"
                    value={settings.hexagonalRowOffset || 0.5}
                    onChange={(value) => updateInstanceSettings(instance.id, { hexagonalRowOffset: value })}
                    min={0.1}
                    max={1.0}
                    step={0.01}
                    defaultValue={0.5}
                  />
                </div>
              </>
            )}
            
            <Slider
              label="Cell Size"
              value={settings.cellSize}
              onChange={(value) => updateInstanceSettings(instance.id, { cellSize: value })}
              min={2}
              max={30}
              step={1}
              unit="px"
              defaultValue={5} // Default value for Cell Size
            />
            <Slider
              label="Dot Scale"
              value={settings.dotScaleFactor}
              onChange={(value) => updateInstanceSettings(instance.id, { dotScaleFactor: value })}
              min={0.1}
              max={1.5}
              step={0.05}
              defaultValue={1} // Default value for Dot Scale
            />
            <Slider
              label="Mix Amount"
              value={settings.mix}
              onChange={(value) => updateInstanceSettings(instance.id, { mix: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
              defaultValue={0} // Default value for Mix Amount
            />
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Colored</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.colored}
                  onChange={(e) => updateInstanceSettings(instance.id, { colored: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.invertBrightness}
                  onChange={(e) => updateInstanceSettings(instance.id, { invertBrightness: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Font Family */}
            <FontFamilySelector
              value={settings.fontFamily || 'Arial'}
              onChange={value => updateInstanceSettings(instance.id, { fontFamily: value })}
              onCustomFontLoad={font => updateInstanceSettings(instance.id, { 
                fontFamily: font.family,
                customFontUrl: font.url
              })}
              settings={settings}
              onFontWeightChange={weight => updateInstanceSettings(instance.id, { fontWeight: weight })}
            />
            
            {/* Text */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Text</label>
              <textarea
                className="mobile-select text-[var(--text-primary)]"
                style={{ minHeight: 64, resize: 'vertical' }}
                value={settings.text}
                onChange={(e) => updateInstanceSettings(instance.id, { text: e.target.value })}
                placeholder="Enter text"
                rows={3}
              />
            </div>

            {/* Font Size */}
            <Slider
              label="Font Size"
              value={settings.fontSize}
              onChange={(value) => updateInstanceSettings(instance.id, { fontSize: value })}
              min={1}
              max={400}
              step={1}
              unit="px"
              defaultValue={24}
            />

            {/* Font Weight */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Font Weight</label>
              <select
                className="mobile-select"
                value={settings.fontWeight}
                onChange={(e) => updateInstanceSettings(instance.id, { fontWeight: e.target.value })}
              >
                {[
                  { value: "100", label: "Thin (100)" },
                  { value: "200", label: "Extra Light (200)" },
                  { value: "300", label: "Light (300)" },
                  { value: "400", label: "Regular (400)" },
                  { value: "500", label: "Medium (500)" },
                  { value: "600", label: "Semi Bold (600)" },
                  { value: "700", label: "Bold (700)" },
                  { value: "800", label: "Extra Bold (800)" },
                  { value: "900", label: "Black (900)" }
                ].map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Letter Spacing */}
            <Slider
              label="Letter Spacing (relative to font size)"
              value={settings.letterSpacing}
              onChange={(value) => updateInstanceSettings(instance.id, { letterSpacing: value })}
              min={-0.2}
              max={2}
              step={0.01}
              defaultValue={0}
            />

            {/* Line Height */}
            <Slider
              label="Line Height"
              value={settings.lineHeight}
              onChange={(value) => updateInstanceSettings(instance.id, { lineHeight: value })}
              min={0.1}
              max={4}
              step={0.05}
              defaultValue={1.2}
            />

            {/* Blend Mode */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blend Mode</label>
              <select
                className="mobile-select"
                value={settings.blendMode || 'source-over'}
                onChange={e => updateInstanceSettings(instance.id, { blendMode: e.target.value })}
              >
                <option value="source-over">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="hue">Hue</option>
                <option value="saturation">Saturation</option>
                <option value="color">Color</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>

            {/* Text Style */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Text Style</label>
              <select
                className="mobile-select"
                value={settings.textStyle || 'fill'}
                onChange={(e) => updateInstanceSettings(instance.id, { textStyle: e.target.value as 'fill' | 'stroke' })}
              >
                <option value="fill">Fill</option>
                <option value="stroke">Stroke</option>
              </select>
            </div>

            {settings.textStyle === 'stroke' && (
              <Slider
                label="Stroke Weight"
                value={settings.strokeWeight || 1}
                onChange={(value) => updateInstanceSettings(instance.id, { strokeWeight: value })}
                min={0.1}
                max={10}
                step={0.1}
                unit="px"
                defaultValue={1}
              />
            )}

            {/* Text Color */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Text Color</label>
              <input
                type="color"
                className="mobile-color-picker"
                value={settings.color}
                onChange={(e) => updateInstanceSettings(instance.id, { color: e.target.value })}
              />
            </div>

            {/* X Position */}
            <Slider
              label="X Position"
              value={settings.x}
              onChange={(value) => updateInstanceSettings(instance.id, { x: value })}
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.5}
            />

            {/* Y Position */}
            <Slider
              label="Y Position"
              value={settings.y}
              onChange={(value) => updateInstanceSettings(instance.id, { y: value })}
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.5}
            />

            {/* Rotation */}
            <Slider
              label="Rotation"
              value={settings.rotation || 0}
              onChange={(value) => updateInstanceSettings(instance.id, { rotation: value })}
              min={0}
              max={360}
              step={1}
              unit="°"
              defaultValue={0}
            />

            {/* Alignment */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Alignment</label>
              <select
                className="mobile-select"
                value={settings.align}
                onChange={(e) => updateInstanceSettings(instance.id, { align: e.target.value as 'left' | 'center' | 'right' })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        );

      case 'paint':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Brush Size */}
            <Slider
              label="Brush Size"
              value={settings.brushSize || 10}
              onChange={(value) => updateInstanceSettings(instance.id, { brushSize: value })}
              min={1}
              max={100}
              step={1}
              unit="px"
              defaultValue={10}
            />

            {/* Paint Color */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Paint Color</label>
              <input
                type="color"
                className="mobile-color-picker"
                value={settings.color || '#000000'}
                onChange={(e) => updateInstanceSettings(instance.id, { color: e.target.value })}
              />
            </div>

            {/* Opacity */}
            <Slider
              label="Opacity"
              value={settings.opacity || 1}
              onChange={(value) => updateInstanceSettings(instance.id, { opacity: value })}
              min={0}
              max={1}
              step={0.01}
              unit=""
              defaultValue={1}
            />

            {/* Blend Mode */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blend Mode</label>
              <select
                className="mobile-select"
                value={settings.blendMode || 'source-over'}
                onChange={e => updateInstanceSettings(instance.id, { blendMode: e.target.value })}
              >
                <option value="source-over">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="hue">Hue</option>
                <option value="saturation">Saturation</option>
                <option value="color">Color</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>

            {/* Paint Actions */}
            <div className="mobile-control-group">
              <div className="flex gap-2 w-full">
                <button
                  className={`mobile-action-button w-full ${(!settings.strokes || settings.strokes.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    const currentStrokes = settings.strokes || [];
                    if (currentStrokes.length > 0) {
                      const newStrokes = currentStrokes.slice(0, -1);
                      updateInstanceSettings(instance.id, { strokes: newStrokes });
                    }
                  }}
                  disabled={!settings.strokes || settings.strokes.length === 0}
                  title="Undo last paint stroke"
                >
                  Undo
                </button>
                <button
                  className={`mobile-action-button w-full ${(!settings.strokes || settings.strokes.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => updateInstanceSettings(instance.id, { strokes: [] })}
                  disabled={!settings.strokes || settings.strokes.length === 0}
                  title="Clear all paint strokes"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Info about using paint */}
            <div className="mobile-control-group">
              <p className="text-xs text-[var(--text-secondary)] p-2 bg-[var(--bg-secondary)] rounded">
                💡 When Paint effect is enabled and active, click and drag on the canvas to paint directly onto your image.
              </p>
            </div>
          </div>
        );

      case 'glitch':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Main glitch controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">General Glitch</label>
              <div className="mobile-toggle-container">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.enabled}
                    onChange={(e) => updateInstanceSettings(instance.id, { enabled: e.target.checked })}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {settings.enabled && (
              <>
                <Slider
                  label="Intensity"
                  value={settings.glitchIntensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { glitchIntensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  defaultValue={0} // Default value for Glitch Intensity
                />
                <Slider
                  label="Density"
                  value={settings.glitchDensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { glitchDensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  defaultValue={0} // Default value for Glitch Density
                />
                <Slider
                  label="Size"
                  value={settings.glitchSize}
                  onChange={(value) => updateInstanceSettings(instance.id, { glitchSize: value })}
                  min={1}
                  max={50}
                  step={1}
                  unit="px"
                  defaultValue={10} // Default value for Glitch Size
                />
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Direction</label>
                  <select 
                    className="mobile-select"
                    value={settings.glitchDirection}
                    onChange={(e) => updateInstanceSettings(instance.id, { glitchDirection: e.target.value as 'horizontal' | 'vertical' | 'both' })}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </>
            )}
            
            {/* Channel shift controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Channel Shift</label>
              <div className="mobile-toggle-container">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.channelShiftEnabled}
                    onChange={(e) => updateInstanceSettings(instance.id, { channelShiftEnabled: e.target.checked })}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {settings.channelShiftEnabled && (
              <>
                <Slider
                  label="Shift Amount"
                  value={settings.channelShiftAmount}
                  onChange={(value) => updateInstanceSettings(instance.id, { channelShiftAmount: value })}
                  min={1}
                  max={20}
                  step={1}
                  unit="px"
                  defaultValue={5} // Default value for Shift Amount
                />
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Shift Mode</label>
                  <select 
                    className="mobile-select"
                    value={settings.channelShiftMode}
                    onChange={(e) => updateInstanceSettings(instance.id, { channelShiftMode: e.target.value as 'rgb' | 'rb' | 'rg' | 'gb' })}
                  >
                    <option value="rgb">RGB</option>
                    <option value="rb">RB</option>
                    <option value="rg">RG</option>
                    <option value="gb">GB</option>
                  </select>
                </div>
              </>
            )}
            
            {/* Noise controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Noise</label>
              <div className="mobile-toggle-container">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.noiseEnabled}
                    onChange={(e) => updateInstanceSettings(instance.id, { noiseEnabled: e.target.checked })}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {settings.noiseEnabled && (
              <Slider
                label="Noise Amount"
                value={settings.noiseAmount}
                onChange={(value) => updateInstanceSettings(instance.id, { noiseAmount: value })}
                min={0}
                max={100}
                step={1}
                unit="%"
                defaultValue={0} // Default value for Noise Amount
              />
            )}

            {/* Pixel Sorting controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Pixel Sorting</label>
              <div className="mobile-toggle-container">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.pixelSortingEnabled}
                    onChange={(e) => updateInstanceSettings(instance.id, { pixelSortingEnabled: e.target.checked })}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {settings.pixelSortingEnabled && (
              <>
                <Slider
                  label="Threshold"
                  value={settings.pixelSortingThreshold}
                  onChange={(value) => updateInstanceSettings(instance.id, { pixelSortingThreshold: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.5} // Default value for Pixel Sorting Threshold
                />
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Direction</label>
                  <select 
                    className="mobile-select"
                    value={settings.pixelSortingDirection}
                    onChange={(e) => updateInstanceSettings(instance.id, { pixelSortingDirection: e.target.value as 'horizontal' | 'vertical' | 'both' })}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </>
            )}
            
            {/* Scan Lines controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Scan Lines</label>
              <div className="mobile-toggle-container">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.scanLinesEnabled}
                    onChange={(e) => updateInstanceSettings(instance.id, { scanLinesEnabled: e.target.checked })}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {settings.scanLinesEnabled && (
              <>
                <Slider
                  label="Count"
                  value={settings.scanLinesCount}
                  onChange={(value) => updateInstanceSettings(instance.id, { scanLinesCount: value })}
                  min={1}
                  max={100}
                  step={1}
                  defaultValue={50} // Default value for Scan Lines Count
                />
                <Slider
                  label="Intensity"
                  value={settings.scanLinesIntensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { scanLinesIntensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  defaultValue={50} // Default value for Scan Lines Intensity
                />
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Direction</label>
                  <select 
                    className="mobile-select"
                    value={settings.scanLinesDirection}
                    onChange={(e) => updateInstanceSettings(instance.id, { scanLinesDirection: e.target.value as 'horizontal' | 'vertical' | 'both' })}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </>
            )}
            
            {/* Blocks controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blocks</label>
              <div className="mobile-toggle-container">
                <label className="mobile-effect-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.blocksEnabled}
                    onChange={(e) => updateInstanceSettings(instance.id, { blocksEnabled: e.target.checked })}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {settings.blocksEnabled && (
              <>
                <Slider
                  label="Size"
                  value={settings.blocksSize}
                  onChange={(value) => updateInstanceSettings(instance.id, { blocksSize: value })}
                  min={5}
                  max={50}
                  step={1}
                  unit="px"
                  defaultValue={10} // Default value for Blocks Size
                />
                <Slider
                  label="Offset"
                  value={settings.blocksOffset}
                  onChange={(value) => updateInstanceSettings(instance.id, { blocksOffset: value })}
                  min={0}
                  max={50}
                  step={1}
                  unit="%"
                  defaultValue={0} // Default value for Blocks Offset
                />
                <Slider
                  label="Density"
                  value={settings.blocksDensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { blocksDensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  defaultValue={100} // Default value for Blocks Density
                />
              </>
            )}
          </div>
        );

      case 'grid':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Grid controls */}
            <Slider
              label="Columns"
              value={settings.columns}
              onChange={(value) => updateInstanceSettings(instance.id, { columns: value })}
              min={1}
              max={10}
              step={1}
              defaultValue={1} // Default value for Columns
            />
            <Slider
              label="Rows"
              value={settings.rows}
              onChange={(value) => updateInstanceSettings(instance.id, { rows: value })}
              min={1}
              max={10}
              step={1}
              defaultValue={1} // Default value for Rows
            />
            
            {/* Rotation settings */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Apply Rotation</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.applyRotation}
                  onChange={(e) => updateInstanceSettings(instance.id, { applyRotation: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            {settings.applyRotation && (
              <Slider
                label="Max Rotation"
                value={settings.maxRotation}
                onChange={(value) => updateInstanceSettings(instance.id, { maxRotation: value })}
                min={1}
                max={45}
                step={1}
                unit="°"
                defaultValue={1} // Default value for Max Rotation
              />
            )}
            
            {/* Split settings */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Split Cells</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.splitEnabled}
                  onChange={(e) => updateInstanceSettings(instance.id, { splitEnabled: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            {settings.splitEnabled && (
              <>
                <Slider
                  label="Split Probability"
                  value={settings.splitProbability}
                  onChange={(value) => updateInstanceSettings(instance.id, { splitProbability: value })}
                  min={0}
                  max={1}
                  step={0.05}
                  unit=""
                  defaultValue={0.5} // Default value for Split Probability
                />
                <Slider
                  label="Max Split Levels"
                  value={settings.maxSplitLevels}
                  onChange={(value) => updateInstanceSettings(instance.id, { maxSplitLevels: value })}
                  min={1}
                  max={4}
                  step={1}
                  defaultValue={1} // Default value for Max Split Levels
                />
                <Slider
                  label="Min Cell Size"
                  value={settings.minCellSize}
                  onChange={(value) => updateInstanceSettings(instance.id, { minCellSize: value })}
                  min={10}
                  max={100}
                  step={5}
                  unit="px"
                  defaultValue={10} // Default value for Min Cell Size
                />
              </>
            )}
          </div>
        );

      case 'mosaicShift':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Mosaic Shift controls */}
            <Slider
              label="Columns"
              value={settings.columns}
              onChange={(value) => updateInstanceSettings(instance.id, { columns: value })}
              min={2}
              max={20}
              step={1}
              defaultValue={5} // Default value for Columns
            />
            <Slider
              label="Rows"
              value={settings.rows}
              onChange={(value) => updateInstanceSettings(instance.id, { rows: value })}
              min={2}
              max={20}
              step={1}
              defaultValue={5} // Default value for Rows
            />
            
            <Slider
              label="Max X Offset"
              value={settings.maxOffsetX}
              onChange={(value) => updateInstanceSettings(instance.id, { maxOffsetX: value })}
              min={0}
              max={200}
              step={1}
              unit="px"
              defaultValue={10} // Default value for Max X Offset
            />
            
            <Slider
              label="Max Y Offset"
              value={settings.maxOffsetY}
              onChange={(value) => updateInstanceSettings(instance.id, { maxOffsetY: value })}
              min={0}
              max={200}
              step={1}
              unit="px"
              defaultValue={10} // Default value for Max Y Offset
            />
            
            <Slider
              label="Intensity"
              value={settings.intensity}
              onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
              defaultValue={50} // Default value for Intensity
            />
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Shift Pattern</label>
              <select 
                className="mobile-select"
                value={settings.pattern}
                onChange={(e) => updateInstanceSettings(instance.id, { pattern: e.target.value as ShiftPattern })}
              >
                <option value="random">Random</option>
                <option value="wave">Wave</option>
                <option value="radial">Radial</option>
                <option value="spiral">Spiral</option>
              </select>
            </div>
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Preserve Edges</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.preserveEdges}
                  onChange={(e) => updateInstanceSettings(instance.id, { preserveEdges: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Random Rotation</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.randomRotation}
                  onChange={(e) => updateInstanceSettings(instance.id, { randomRotation: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            {settings.randomRotation && (
              <Slider
                label="Max Rotation"
                value={settings.maxRotation}
                onChange={(value) => updateInstanceSettings(instance.id, { maxRotation: value })}
                min={0}
                max={180}
                step={1}
                unit="°"
                defaultValue={0} // Default value for Max Rotation
              />
            )}
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Use Background Color</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.useBackgroundColor}
                  onChange={(e) => updateInstanceSettings(instance.id, { useBackgroundColor: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            {settings.useBackgroundColor && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Background Color</label>
                <input 
                  type="color" 
                  className="mobile-color-picker"
                  value={settings.backgroundColor || '#000000'}
                  onChange={(e) => updateInstanceSettings(instance.id, { backgroundColor: e.target.value })}
                />
              </div>
            )}
            
            <div className="mobile-control-group">
              <button 
                className="mobile-action-button w-full"
                onClick={() => updateInstanceSettings(instance.id, { seed: Math.random() * 1000 })}
              >
                Randomize
              </button>
            </div>
          </div>
        );

      case 'sliceShift':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Primary Controls - Always visible */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Effect Mode</label>
              <select 
                className="mobile-select"
                value={settings.mode}
                onChange={(e) => updateInstanceSettings(instance.id, { mode: e.target.value })}
              >
                <option value="random">Random Offset</option>
                <option value="alternating">Alternating Offset</option>
                <option value="wave">Wave Offset</option>
                <option value="rearrange">Rearrange Slices</option>
                <option value="repeat">Repeat Slices</option>
              </select>
            </div>

            <div className="mobile-control-group">
              <label className="mobile-control-label">Direction</label>
              <select 
                className="mobile-select"
                value={settings.direction}
                onChange={(e) => updateInstanceSettings(instance.id, { direction: e.target.value })}
              >
                <option value="vertical">Vertical Slices</option>
                <option value="horizontal">Horizontal Slices</option>
                <option value="both">Both Directions</option>
              </select>
            </div>
            
            <Slider
              label="Number of Slices"
              value={settings.slices}
              onChange={(value) => updateInstanceSettings(instance.id, { slices: value })}
              min={2}
              max={100}
              step={1}
              defaultValue={10}
            />

            {/* Mode-specific controls */}
            {settings.mode !== 'rearrange' && settings.mode !== 'repeat' && (
              <>
                <Slider
                  label="Max Offset"
                  value={settings.maxOffset}
                  onChange={(value) => updateInstanceSettings(instance.id, { maxOffset: value })}
                  min={0}
                  max={200}
                  step={1}
                  unit="px"
                  defaultValue={20}
                />

                <Slider
                  label="Intensity"
                  value={settings.intensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  defaultValue={50}
                />
              </>
            )}

            {/* Rearrange mode specific controls */}
            {settings.mode === 'rearrange' && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Rearrange Pattern</label>
                <select 
                  className="mobile-select"
                  value={settings.rearrangeMode}
                  onChange={(e) => updateInstanceSettings(instance.id, { rearrangeMode: e.target.value })}
                >
                  <option value="random">Random</option>
                  <option value="reverse">Reverse</option>
                  <option value="alternate">Alternate</option>
                  <option value="shuffle">Shuffle</option>
                </select>
              </div>
            )}

            {/* Background settings */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Use Background Color</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.useBackgroundColor}
                  onChange={(e) => updateInstanceSettings(instance.id, { useBackgroundColor: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>

            {settings.useBackgroundColor && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Background Color</label>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateInstanceSettings(instance.id, { backgroundColor: e.target.value })}
                  className="mobile-color-picker"
                />
              </div>
            )}

            {/* Removed feathering controls since they're not working properly */}
          </div>
        );

      case 'posterize':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Levels"
              value={settings.levels}
              onChange={(value) => updateInstanceSettings(instance.id, { levels: value })}
              min={2}
              max={256}
              step={1}
              defaultValue={2} // True default value for Levels
            />
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Color Mode</label>
              <select 
                className="mobile-select"
                value={settings.colorMode}
                onChange={(e) => updateInstanceSettings(instance.id, { colorMode: e.target.value as 'rgb' | 'hsv' | 'lab' })}
              >
                <option value="rgb">RGB</option>
                <option value="hsv">HSV</option>
                <option value="lab">LAB</option>
              </select>
            </div>

            <div className="mobile-control-group">
              <label className="mobile-control-label">Preserve Luminance</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.preserveLuminance}
                  onChange={(e) => updateInstanceSettings(instance.id, { preserveLuminance: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>

            <div className="mobile-control-group">
              <label className="mobile-control-label">Dithering</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.dithering}
                  onChange={(e) => updateInstanceSettings(instance.id, { dithering: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            {settings.dithering && (
              <Slider
                label="Dither Amount"
                value={settings.ditherAmount}
                onChange={(value) => updateInstanceSettings(instance.id, { ditherAmount: value })}
                min={0}
                max={100}
                step={1}
                defaultValue={50} // True default value for Dither Amount
              />
            )}
          </div>
        );

      case 'findEdges':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Algorithm</label>
              <select 
                className="mobile-select"
                value={settings.algorithm}
                onChange={(e) => updateInstanceSettings(instance.id, { algorithm: e.target.value as EdgeDetectionAlgorithm })}
              >
                <option value="sobel">Sobel</option>
                <option value="prewitt">Prewitt</option>
                <option value="canny">Canny</option>
                <option value="laplacian">Laplacian</option>
              </select>
            </div>

            <Slider
              label="Intensity"
              value={settings.intensity}
              onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
              defaultValue={50} // Default value for Intensity
            />

            <Slider
              label="Threshold"
              value={settings.threshold}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
              defaultValue={128} // Default value for Threshold
            />

            <div className="mobile-control-group">
              <label className="mobile-control-label">Color Mode</label>
              <select 
                className="mobile-select"
                value={settings.colorMode}
                onChange={(e) => updateInstanceSettings(instance.id, { colorMode: e.target.value as 'grayscale' | 'color' | 'inverted' })}
              >
                <option value="grayscale">Grayscale</option>
                <option value="color">Color</option>
                <option value="inverted">Inverted</option>
              </select>
            </div>

            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.invert}
                  onChange={(e) => updateInstanceSettings(instance.id, { invert: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>

            <Slider
              label="Blur Radius"
              value={settings.blurRadius}
              onChange={(value) => updateInstanceSettings(instance.id, { blurRadius: value })}
              min={0}
              max={10}
              step={0.5}
              unit="px"
              defaultValue={0} // Default value for Blur Radius
            />
          </div>
        );

      case 'blob':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Cell Size"
              value={settings.cellSize}
              onChange={(value) => updateInstanceSettings(instance.id, { cellSize: value })}
              min={2}
              max={30}
              step={1}
              unit="px"
              defaultValue={5} // Default value for Cell Size
            />
            <Slider
              label="Mix Amount"
              value={settings.mix}
              onChange={(value) => updateInstanceSettings(instance.id, { mix: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
              defaultValue={0} // Default value for Mix Amount
            />
            <Slider
              label="Sharpness"
              value={settings.sharpness}
              onChange={(value) => updateInstanceSettings(instance.id, { sharpness: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
              defaultValue={0} // Default value for Sharpness
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Merge Colors</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.mergeColors}
                  onChange={(e) => updateInstanceSettings(instance.id, { mergeColors: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert Colors</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.invertColors}
                  onChange={(e) => updateInstanceSettings(instance.id, { invertColors: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
          </div>
        );

      case 'glow':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Radius"
              value={settings.radius}
              onChange={(value) => updateInstanceSettings(instance.id, { radius: value })}
              min={0}
              max={50}
              step={1}
              unit="px"
              defaultValue={0} // Default value for Radius
            />
            <Slider
              label="Intensity"
              value={settings.intensity}
              onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
              defaultValue={0} // Default value for Intensity
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Color</label>
              <input
                type="color"
                className="mobile-color-picker"
                value={settings.color}
                onChange={(e) => updateInstanceSettings(instance.id, { color: e.target.value })}
              />
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blend Mode</label>
              <select
                className="mobile-select"
                value={settings.blendMode}
                onChange={e => updateInstanceSettings(instance.id, { blendMode: e.target.value })}
              >
                <option value="screen">Screen</option>
                <option value="add">Add</option>
                <option value="lighten">Lighten</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
          </div>
        );

      case 'polarPixel':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Radius"
              value={settings.radius}
              onChange={(value) => updateInstanceSettings(instance.id, { radius: value })}
              min={10}
              max={200}
              step={1}
              unit="px"
              defaultValue={50} // Default value for Radius
            />
            <Slider
              label="Pixel Size"
              value={settings.pixelSize}
              onChange={(value) => updateInstanceSettings(instance.id, { pixelSize: value })}
              min={1}
              max={20}
              step={1}
              unit="px"
              defaultValue={5} // Default value for Pixel Size
            />
            <Slider
              label="Angle Step"
              value={settings.angleStep}
              onChange={(value) => updateInstanceSettings(instance.id, { angleStep: value })}
              min={1}
              max={90}
              step={1}
              unit="°"
              defaultValue={10} // Default value for Angle Step
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Preserve Colors</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.preserveColors}
                  onChange={(e) => updateInstanceSettings(instance.id, { preserveColors: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.invert}
                  onChange={(e) => updateInstanceSettings(instance.id, { invert: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
          </div>
        );

      case 'pixel':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Mode Selector */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Mode</label>
              <select
                className="mobile-select"
                value={settings.mode || 'grid'}
                onChange={e => updateInstanceSettings(instance.id, { mode: e.target.value })}
              >
                <option value="grid">Grid</option>
                <option value="radial">Radial</option>
                <option value="offgrid">Off Grid</option>
                <option value="voronoi">Voronoi</option>
                <option value="rings">Rings</option>
                <option value="random">Random</option>
              </select>
            </div>

            {/* Variant Selector */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Variant</label>
              <select
                className="mobile-select"
                value={settings.variant || 'classic'}
                onChange={e => updateInstanceSettings(instance.id, { variant: e.target.value })}
              >
                <option value="classic">Classic</option>
                <option value="posterized">Posterized</option>
                <option value="grayscale">Grayscale</option>
              </select>
            </div>

            {/* Mode-specific controls */}
            {settings.mode === 'grid' && (
              <Slider
                label="Cell Size"
                value={settings.cellSize || 16}
                onChange={value => updateInstanceSettings(instance.id, { cellSize: value })}
                min={2}
                max={100}
                step={1}
                unit="px"
                defaultValue={16}
              />
            )}
            {settings.mode === 'radial' && (
              <>
                <Slider
                  label="Rings"
                  value={settings.rings || 24}
                  onChange={value => updateInstanceSettings(instance.id, { rings: value })}
                  min={2}
                  max={100}
                  step={1}
                  defaultValue={24}
                />
                <Slider
                  label="Segments"
                  value={settings.segments || 48}
                  onChange={value => updateInstanceSettings(instance.id, { segments: value })}
                  min={2}
                  max={180}
                  step={1}
                  defaultValue={48}
                />
                <Slider
                  label="Center X"
                  value={settings.centerX ?? 0.5}
                  onChange={value => updateInstanceSettings(instance.id, { centerX: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.5}
                />
                <Slider
                  label="Center Y"
                  value={settings.centerY ?? 0.5}
                  onChange={value => updateInstanceSettings(instance.id, { centerY: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.5}
                />
              </>
            )}
            {settings.mode === 'offgrid' && (
              <>
                <Slider
                  label="Block Size"
                  value={settings.offGridSize || 16}
                  onChange={value => updateInstanceSettings(instance.id, { offGridSize: value })}
                  min={2}
                  max={100}
                  step={1}
                  unit="px"
                  defaultValue={16}
                />
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Orientation</label>
                  <select
                    className="mobile-select"
                    value={settings.offGridOrientation || 'horizontal'}
                    onChange={e => updateInstanceSettings(instance.id, { offGridOrientation: e.target.value })}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
              </>
            )}
            {settings.mode === 'voronoi' && (
              <>
                <Slider
                  label="Seeds"
                  value={settings.voronoiSeeds || 32}
                  onChange={value => updateInstanceSettings(instance.id, { voronoiSeeds: value })}
                  min={2}
                  max={256}
                  step={1}
                  defaultValue={32}
                />
                <Slider
                  label="Jitter"
                  value={settings.voronoiJitter || 0.2}
                  onChange={value => updateInstanceSettings(instance.id, { voronoiJitter: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.2}
                />
              </>
            )}
            {settings.mode === 'rings' && (
              <Slider
                label="Ring Count"
                value={settings.ringCount || 24}
                onChange={value => updateInstanceSettings(instance.id, { ringCount: value })}
                min={2}
                max={100}
                step={1}
                defaultValue={24}
              />
            )}
            {settings.mode === 'random' && (
              <>
                <Slider
                  label="Min Block Size"
                  value={settings.minBlockSize || 8}
                  onChange={value => updateInstanceSettings(instance.id, { minBlockSize: value })}
                  min={2}
                  max={100}
                  step={1}
                  unit="px"
                  defaultValue={8}
                />
                <Slider
                  label="Max Block Size"
                  value={settings.maxBlockSize || 32}
                  onChange={value => updateInstanceSettings(instance.id, { maxBlockSize: value })}
                  min={2}
                  max={100}
                  step={1}
                  unit="px"
                  defaultValue={32}
                />
              </>
            )}

            {/* Variant-specific controls */}
            {settings.variant === 'posterized' && (
              <Slider
                label="Posterize Levels"
                value={settings.posterizeLevels || 4}
                onChange={value => updateInstanceSettings(instance.id, { posterizeLevels: value })}
                min={2}
                max={8}
                step={1}
                defaultValue={4}
              />
            )}
            {settings.variant === 'grayscale' && (
              <Slider
                label="Grayscale Levels"
                value={settings.grayscaleLevels || 2}
                onChange={value => updateInstanceSettings(instance.id, { grayscaleLevels: value })}
                min={2}
                max={256}
                step={1}
                defaultValue={2}
              />
            )}
          </div>
        );

      case 'noise':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Type</label>
              <select
                className="mobile-select"
                value={settings.type}
                onChange={e => updateInstanceSettings(instance.id, { type: e.target.value })}
              >
                <option value="gaussian">Gaussian</option>
                <option value="uniform">Uniform</option>
                <option value="salt-and-pepper">Salt and Pepper</option>
                <option value="perlin">Perlin</option>
                <option value="simplex">Simplex</option>
              </select>
            </div>
            <Slider
              label="Amount"
              value={settings.amount}
              onChange={(value) => updateInstanceSettings(instance.id, { amount: value })}
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.1} // Default value for Amount
            />
            <Slider
              label="Density"
              value={settings.density}
              onChange={(value) => updateInstanceSettings(instance.id, { density: value })}
              min={0}
              max={1}
              step={0.01}
              defaultValue={0.5} // Default value for Density
            />
            {settings.type === 'perlin' && (
              <>
                <Slider
                  label="Scale"
                  value={settings.scale}
                  onChange={(value) => updateInstanceSettings(instance.id, { scale: value })}
                  min={0.01}
                  max={100.0}
                  step={0.01}
                  defaultValue={0.1} // Default value for Scale
                />
                <Slider
                  label="Octaves"
                  value={settings.octaves}
                  onChange={(value) => updateInstanceSettings(instance.id, { octaves: value })}
                  min={1}
                  max={8}
                  step={1}
                  defaultValue={4} // Default value for Octaves
                />
                <Slider
                  label="Persistence"
                  value={settings.persistence}
                  onChange={(value) => updateInstanceSettings(instance.id, { persistence: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.5} // Default value for Persistence
                />
              </>
            )}
            {settings.type === 'simplex' && (
              <>
                <Slider
                  label="Scale"
                  value={settings.scale}
                  onChange={(value) => updateInstanceSettings(instance.id, { scale: value })}
                  min={0.01}
                  max={100.0}
                  step={0.01}
                  defaultValue={0.1} // Default value for Scale
                />
                <Slider
                  label="Octaves"
                  value={settings.octaves}
                  onChange={(value) => updateInstanceSettings(instance.id, { octaves: value })}
                  min={1}
                  max={8}
                  step={1}
                  defaultValue={4} // Default value for Octaves
                />
                <Slider
                  label="Persistence"
                  value={settings.persistence}
                  onChange={(value) => updateInstanceSettings(instance.id, { persistence: value })}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.5} // Default value for Persistence
                />
              </>
            )}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Monochrome</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.monochrome}
                  onChange={(e) => updateInstanceSettings(instance.id, { monochrome: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            {settings.monochrome && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Monochrome Color</label>
                <input 
                  type="color" 
                  className="mobile-color-picker"
                  value={settings.monochromeColor || '#000000'}
                  onChange={(e) => updateInstanceSettings(instance.id, { monochromeColor: e.target.value })}
                />
              </div>
            )}
          </div>
        );

      case 'linocut':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Threshold"
              value={settings.threshold}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
              defaultValue={128} // Default value for Threshold
            />
            <Slider
              label="Line Width"
              value={settings.lineWidth}
              onChange={(value) => updateInstanceSettings(instance.id, { lineWidth: value })}
              min={1}
              max={10}
              step={1}
              defaultValue={1} // Default value for Line Width
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.invert}
                  onChange={(e) => updateInstanceSettings(instance.id, { invert: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Color</label>
              <input
                type="color"
                className="mobile-color-picker"
                value={settings.lineColor}
                onChange={(e) => updateInstanceSettings(instance.id, { lineColor: e.target.value })}
              />
            </div>
          </div>
        );

      case 'levels':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Main RGB Controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Levels</label>
              <Slider
                label="Input Black"
                value={settings.inputBlack}
                onChange={(value) => updateInstanceSettings(instance.id, { inputBlack: value })}
                min={0}
                max={255}
                step={1}
                defaultValue={0}
              />
              <Slider
                label="Input White"
                value={settings.inputWhite}
                onChange={(value) => updateInstanceSettings(instance.id, { inputWhite: value })}
                min={0}
                max={255}
                step={1}
                defaultValue={255}
              />
              <Slider
                label="Gamma"
                value={settings.gamma}
                onChange={(value) => updateInstanceSettings(instance.id, { gamma: value })}
                min={0.1}
                max={10}
                step={0.1}
                defaultValue={1}
              />
              <Slider
                label="Output Black"
                value={settings.outputBlack}
                onChange={(value) => updateInstanceSettings(instance.id, { outputBlack: value })}
                min={0}
                max={255}
                step={1}
                defaultValue={0}
              />
              <Slider
                label="Output White"
                value={settings.outputWhite}
                onChange={(value) => updateInstanceSettings(instance.id, { outputWhite: value })}
                min={0}
                max={255}
                step={1}
                defaultValue={255}
              />
            </div>
          </div>
        );

      case 'ascii':
        const fontSizeMin = Math.max(1, settings.cellSize * 0.5);
        const fontSizeMax = settings.cellSize * 2;
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Grid Size"
              value={settings.cellSize}
              onChange={(value) => updateInstanceSettings(instance.id, { cellSize: value })}
              min={2}
              max={40}
              step={1}
              unit="px"
              defaultValue={8}
            />
            <Slider
              label="Font Size"
              value={settings.fontSize}
              onChange={(value) => updateInstanceSettings(instance.id, { fontSize: value })}
              min={fontSizeMin}
              max={fontSizeMax}
              step={1}
              unit="px"
              defaultValue={Math.max(10, fontSizeMin)}
            />
            <Slider
              label="Jitter"
              value={settings.jitter || 0}
              onChange={(value) => updateInstanceSettings(instance.id, { jitter: value })}
              min={0}
              max={settings.cellSize}
              step={1}
              unit="px"
              defaultValue={0}
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Character Set</label>
              <select
                className="mobile-select"
                value={settings.characterSet || 'standard'}
                onChange={e => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    updateInstanceSettings(instance.id, { characterSet: 'custom', charset: settings.charset || '' });
                  } else {
                    updateInstanceSettings(instance.id, { characterSet: value, charset: ASCII_CHARSETS[value] });
                  }
                }}
              >
                <option value="standard">Standard</option>
                <option value="complex">Complex</option>
                <option value="braille">Braille</option>
                <option value="blocks">Blocks</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {settings.characterSet === 'custom' && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Custom Charset</label>
                <input
                  type="text"
                  className="mobile-text-input border border-[var(--border-color)] rounded px-2 py-1"
                  style={{ color: 'var(--text-primary)', background: 'var(--input-bg)', fontFamily: 'monospace', fontSize: '1rem' }}
                  value={settings.charset || ''}
                  onChange={e => updateInstanceSettings(instance.id, { charset: e.target.value })}
                  placeholder="Enter characters to use"
                />
              </div>
            )}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Color Invert</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.colorInvert}
                  onChange={(e) => updateInstanceSettings(instance.id, { colorInvert: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Monochrome</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.monochrome}
                  onChange={(e) => updateInstanceSettings(instance.id, { monochrome: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            {settings.monochrome !== false && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Text Color</label>
                <input
                  type="color"
                  className="mobile-color-picker"
                  value={settings.textColor || '#ffffff'}
                  onChange={e => updateInstanceSettings(instance.id, { textColor: e.target.value })}
                />
              </div>
            )}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Background Color</label>
              <input
                type="color"
                className="mobile-color-picker"
                value={settings.backgroundColor || '#000000'}
                onChange={(e) => updateInstanceSettings(instance.id, { backgroundColor: e.target.value })}
              />
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Rotation Mode</label>
              <select
                className="mobile-select"
                value={settings.rotationMode || 'none'}
                onChange={e => updateInstanceSettings(instance.id, { rotationMode: e.target.value })}
              >
                <option value="none">None</option>
                <option value="random">Random</option>
                <option value="flow">Flow Field</option>
              </select>
            </div>
            {settings.rotationMode !== 'none' && (
              <Slider
                label="Max Rotation"
                value={settings.rotationMax || 0}
                onChange={value => updateInstanceSettings(instance.id, { rotationMax: value })}
                min={0}
                max={90}
                step={1}
                unit="°"
                defaultValue={0} // Default value for Max Rotation
              />
            )}
            <div className="mobile-control-group">
              <button
                className="mobile-action-button w-full"
                onClick={() => window.dispatchEvent(new CustomEvent('export-ascii-text'))}
              >
                Export as Text
              </button>
            </div>
          </div>
        );

      case 'lcd':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Pixel Size"
              value={settings.pixelSize}
              onChange={(value) => updateInstanceSettings(instance.id, { pixelSize: value })}
              min={1}
              max={10}
              step={1}
              unit="px"
              defaultValue={2} // Default value for Pixel Size
            />
            <Slider
              label="Contrast"
              value={settings.contrast}
              onChange={(value) => updateInstanceSettings(instance.id, { contrast: value })}
              min={0}
              max={200}
              step={1}
              unit="%"
              defaultValue={100} // Default value for Contrast
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Subpixel Orientation</label>
              <select
                className="mobile-select"
                value={settings.subpixelOrientation}
                onChange={e => updateInstanceSettings(instance.id, { subpixelOrientation: e.target.value })}
              >
                <option value="rgb">RGB</option>
                <option value="bgr">BGR</option>
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Grid Lines</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.gridLines}
                  onChange={(e) => updateInstanceSettings(instance.id, { gridLines: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            <Slider
              label="Grid Thickness"
              value={settings.gridThickness}
              onChange={(value) => updateInstanceSettings(instance.id, { gridThickness: value })}
              min={0.1}
              max={2}
              step={0.1}
              unit="px"
              defaultValue={0.5} // Default value for Grid Thickness
            />
          </div>
        );

      case 'snake':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Grid Size"
              value={settings.gridSize}
              onChange={(value) => updateInstanceSettings(instance.id, { gridSize: value })}
              min={2}
              max={50}
              step={1}
              unit="px"
              defaultValue={10}
            />
            <Slider
              label="Color Count"
              value={settings.colorCount}
              onChange={(value) => updateInstanceSettings(instance.id, { colorCount: value })}
              min={2}
              max={30}
              step={1}
              defaultValue={8}
            />
            <Slider
              label="Corner Radius"
              value={settings.cornerRadius}
              onChange={(value) => updateInstanceSettings(instance.id, { cornerRadius: value })}
              min={0}
              max={20}
              step={1}
              unit="px"
              defaultValue={0}
            />
            <Slider
              label="Padding"
              value={settings.padding}
              onChange={(value) => updateInstanceSettings(instance.id, { padding: value })}
              min={0}
              max={20}
              step={1}
              unit="px"
              defaultValue={0}
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Color Mode</label>
              <select
                className="mobile-select"
                value={settings.colorMode}
                onChange={e => updateInstanceSettings(instance.id, { colorMode: e.target.value })}
              >
                <option value="grayscale">Grayscale</option>
                <option value="dominant">Dominant</option>
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Background Color</label>
              <input
                type="color"
                className="mobile-color-picker"
                value={settings.backgroundColor}
                onChange={e => updateInstanceSettings(instance.id, { backgroundColor: e.target.value })}
              />
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Outline Style</label>
              <select
                className="mobile-select"
                value={settings.outlineStyle}
                onChange={e => updateInstanceSettings(instance.id, { outlineStyle: e.target.value })}
              >
                <option value="pixel">Pixel</option>
                <option value="smooth">Smooth</option>
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Shape</label>
              <select
                className="mobile-select"
                value={settings.shape}
                onChange={e => updateInstanceSettings(instance.id, { shape: e.target.value })}
              >
                <option value="row">Row</option>
                <option value="column">Column</option>
                <option value="diagonal">Diagonal</option>
                <option value="diagonal2">Diagonal 2</option>
              </select>
            </div>
          </div>
        );

      case 'threeD':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <ThreeDEffectControls
              settings={settings}
              onChange={(newSettings) => updateInstanceSettings(instance.id, newSettings)}
            />
          </div>
        );

      case 'shapegrid':
        const availableShapes = ['circle', 'square', 'triangle', 'cross', 'heart'] as const;
        type ShapeType = typeof availableShapes[number];
        const isShapesOpen = shapesOpenStates[instance.id] ?? true;
        
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Grid Size"
              value={settings.gridSize}
              onChange={(value) => updateInstanceSettings(instance.id, { gridSize: value })}
              min={2}
              max={50}
              step={1}
              unit="px"
              defaultValue={10} // Default value for Grid Size
            />
            <Slider
              label="Threshold"
              value={settings.threshold}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
              defaultValue={128} // Default value for Threshold
            />
            
            <Slider
              label="Merge Levels"
              value={settings.mergeLevels}
              onChange={(value) => updateInstanceSettings(instance.id, { mergeLevels: value })}
              min={0}
              max={5}
              step={1}
              defaultValue={0} // Default value for Merge Levels
            />
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Random Rotation</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.randomRotation}
                  onChange={(e) => updateInstanceSettings(instance.id, { randomRotation: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Background Color</label>
              <input 
                type="color" 
                className="mobile-color-picker"
                value={settings.colors.background}
                onChange={(e) => updateInstanceSettings(instance.id, { 
                  colors: { ...settings.colors, background: e.target.value } 
                })}
              />
            </div>
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Foreground Color</label>
              <input 
                type="color" 
                className="mobile-color-picker"
                value={settings.colors.foreground}
                onChange={(e) => updateInstanceSettings(instance.id, { 
                  colors: { ...settings.colors, foreground: e.target.value } 
                })}
              />
            </div>

            <div className="mobile-control-section">
              <button
                className="mobile-control-section-header"
                onClick={() => toggleShapesSection(instance.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span>Available Shapes</span>
                  {isShapesOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                </div>
              </button>
              
              {isShapesOpen && (
                <div className="mobile-control-section-content">
                  {availableShapes.map((shape) => (
                    <div key={shape} className="mobile-control-group">
                      <label className="mobile-control-label capitalize">{shape}</label>
                      <label className="mobile-effect-toggle">
                        <input 
                          type="checkbox" 
                          checked={settings.shapes.includes(shape)}
                          onChange={() => {
                            const newShapes = settings.shapes.includes(shape)
                              ? settings.shapes.filter((s: ShapeType) => s !== shape)
                              : [...settings.shapes, shape];
                            if (newShapes.length > 0) {
                              updateInstanceSettings(instance.id, { shapes: newShapes });
                            }
                          }}
                        />
                        <span className="mobile-effect-toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'truchet':
        return (
          <TruchetControls
            settings={getInstanceSettings(instance)}
            onChange={(settings) => updateInstanceSettings(instance.id, settings)}
          />
        );

      case 'distort':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Upload Displacement Map</label>
              <div className="mobile-file-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        updateInstanceSettings(instance.id, {
                          ...settings,
                          displacementMap: reader.result as string,
                          displacementMapUpdatedAt: Date.now(), // Force re-render
                          preserveAspectRatio: true,
                          scale: 1.0,
                          offsetX: 0,
                          offsetY: 0,
                          smoothness: 0
                        });
                        // Call processImageCallback if provided to force re-render
                        if (typeof processImageCallback === 'function') {
                          processImageCallback();
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>

            <Slider
              label="X Distortion"
              value={settings.xAmount || 0}
              onChange={(value) => {
                updateInstanceSettings(instance.id, {
                  ...settings,
                  xAmount: value
                });
              }}
              min={-500}
              max={500}
              step={1}
              showValue={true}
              defaultValue={0} // Default value for X Distortion
            />

            <Slider
              label="Y Distortion"
              value={settings.yAmount || 0}
              onChange={(value) => {
                updateInstanceSettings(instance.id, {
                  ...settings,
                  yAmount: value
                });
              }}
              min={-500}
              max={500}
              step={1}
              showValue={true}
              defaultValue={0} // Default value for Y Distortion
            />

            {settings.displacementMap && (
              <>
                <div className="border-t border-[var(--border-color)] my-2"></div>
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Preserve Aspect Ratio</label>
                  <label className="mobile-effect-toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.preserveAspectRatio}
                      onChange={(e) => updateInstanceSettings(instance.id, {
                        ...settings,
                        preserveAspectRatio: e.target.checked
                      })}
                    />
                    <span className="mobile-effect-toggle-slider"></span>
                  </label>
                </div>

                <Slider
                  label="Scale"
                  value={settings.scale}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    scale: value
                  })}
                  min={0.1}
                  max={20.0}
                  step={0.5}
                  showValue={true}
                  defaultValue={1.0} // Default value for Scale
                />

                <Slider
                  label="Smoothness"
                  value={settings.smoothness}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    smoothness: value
                  })}
                  min={0}
                  max={20}
                  step={0.1}
                  showValue={true}
                  defaultValue={0} // Default value for Smoothness
                />
                <Slider
                  label="Color Aberration"
                  value={settings.colorAberration || 0}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    colorAberration: value
                  })}
                  min={0}
                  max={10}
                  step={0.1}
                  showValue={true}
                  defaultValue={0} // Default value for Color Aberration
                />

                <Slider
                  label="X Position"
                  value={settings.offsetX}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    offsetX: value
                  })}
                  min={-100}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={0} // Default value for X Position
                />

                <Slider
                  label="Y Position"
                  value={settings.offsetY}
                  onChange={(value) => updateInstanceSettings(instance.id, {
                    ...settings,
                    offsetY: value
                  })}
                  min={-100}
                  max={100}
                  step={1}
                  showValue={true}
                  defaultValue={0} // Default value for Y Position
                />
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // At the top of MobileControls component, add drag-and-drop state
  const [draggedEffectId, setDraggedEffectId] = useState<string | null>(null);
  const [dragOverEffectId, setDragOverEffectId] = useState<string | null>(null);

  // Drag event handlers
  const handleDragStart = (id: string) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedEffectId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => {
    setDraggedEffectId(null);
    setDragOverEffectId(null);
  };
  const handleDragOver = (id: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverEffectId(id);
  };
  const handleDrop = (id: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedEffectId && draggedEffectId !== id) {
      const dragIndex = effectInstances.findIndex(inst => inst.id === draggedEffectId);
      const hoverIndex = effectInstances.findIndex(inst => inst.id === id);
      if (dragIndex !== -1 && hoverIndex !== -1 && dragIndex !== hoverIndex) {
        const newInstances = [...effectInstances];
        const [draggedItem] = newInstances.splice(dragIndex, 1);
        newInstances.splice(hoverIndex, 0, draggedItem);
        updateEffectInstances(newInstances);
      }
    }
    setDraggedEffectId(null);
    setDragOverEffectId(null);
  };

  // Update renderEffectSection to use these handlers and remove all hooks from inside
  const renderEffectSection = (instance: EffectInstance, index: number) => {
    const sameTypeEffects = effectInstances.filter(i => i.type === instance.type);
    const sameTypeCount = sameTypeEffects.length;
    const instanceIndex = sameTypeEffects.findIndex(i => i.id === instance.id);

    const effectLabel =
      instance.type === 'color' ? 'Color' :
      instance.type === 'halftone' ? 'Halftone' :
      instance.type === 'grid' ? 'Grid' :
      instance.type === 'dither' ? 'Dither' :
      instance.type === 'text' ? 'Text' :
      instance.type === 'glitch' ? 'Glitch' :
      instance.type === 'blur' ? 'Blur' :
      instance.type === 'gradient' ? 'Gradient' :
      instance.type === 'threshold' ? 'Threshold' :
      instance.type === 'mosaicShift' ? 'Mosaic' :
      instance.type === 'sliceShift' ? 'Slice' :
      instance.type === 'posterize' ? 'Posterize' :
      instance.type === 'findEdges' ? 'Find Edges' :
      instance.type === 'blob' ? 'Blob' :
      instance.type === 'glow' ? 'Glow' :
      instance.type === 'pixel' ? 'Pixel' :
      instance.type === 'noise' ? 'Noise' :
      instance.type === 'linocut' ? 'Linocut' :
      instance.type === 'levels' ? 'Levels' :
      instance.type === 'ascii' ? 'Ascii' :
      instance.type === 'lcd' ? 'LCD' :
      instance.type === 'snake' ? 'Snake' :
      instance.type === 'threeD' ? '3D' :
      instance.type === 'shapegrid' ? 'Shape Grid' :
      instance.type === 'truchet' ? 'Truchet' :
      instance.type === 'distort' ? 'Distort' :
      instance.type === 'paint' ? 'Paint' :
      'Effect';
    const title = sameTypeCount > 1 ? `${effectLabel} ${instanceIndex + 1}` : effectLabel;

    // Visual feedback for drag-over
    const isDragging = draggedEffectId === instance.id;
    const isDragOver = dragOverEffectId === instance.id && draggedEffectId !== instance.id;

    return (
      <div
        key={instance.id}
        className={`mobile-effect-section${isDragOver ? ' drag-over' : ''}`}
        onDragOver={handleDragOver(instance.id)}
        onDrop={handleDrop(instance.id)}
        style={{ opacity: isDragging ? 0.5 : 1, border: isDragOver ? '2px dashed var(--accent-bg)' : undefined }}
      >
        <div className="mobile-effect-header">
          <div className="mobile-header-row effect-title-toggle-container">
            <div className="effect-title-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Drag handle icon */}
              <span
                className="effect-drag-handle"
                draggable
                onDragStart={handleDragStart(instance.id)}
                onDragEnd={handleDragEnd}
                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', marginRight: 4 }}
                title="Drag to reorder"
              >
                <MdDragIndicator size={20} />
              </span>
              <span className="effect-order-number">
                {index + 1}
              </span>
              {effectIcons[instance.type] && (
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>{effectIcons[instance.type]}</span>
              )}
              <h3 
                className="mobile-effect-title"
                onClick={() => toggleSection(instance.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {title}
              </h3>
            </div>
            <label className="mobile-effect-toggle">
              <input 
                type="checkbox" 
                checked={instance.enabled}
                onChange={(e) => toggleEffectEnabled(instance.id, e.target.checked)}
              />
              <span className="mobile-effect-toggle-slider"></span>
            </label>
          </div>
          <div className="mobile-header-row">
            <div className="effect-controls-container">
              {renderEffectControls(instance)}
            </div>
          </div>
        </div>
        {renderEffectContent(instance)}
      </div>
    );
  };

  // Icon mapping for each effect type
  const effectIcons: { [key: string]: React.ReactNode } = {
    blob: <MdPattern />,
    blur: <MdBlurOn />,
    color: <MdOutlineColorLens />,
    dither: <MdGrain />,
    distort: <MdWaves />,
    findEdges: <MdFingerprint />,
    glitch: <MdSnowing />,
    glow: <FaRegSun />,
    gradient: <MdGradient />,
    grid: <MdOutlineGridOn />,
    halftone: <FaRegDotCircle />,
    invert: <MdOutlineInvertColors />,
    linocut: <MdOutlineWaves />,
    levels: <FiBarChart2 />,
    ascii: <MdEmojiSymbols />,
    lcd: <FiTv />,
    snake: <SnakeIcon />,
    text: <MdOutlineTextFields />,
    threeD: <Md3dRotation />,
    shapegrid: <MdInterests />,
    truchet: <GiGearStickPattern />,
    noise: <MdGrain />,
    paint: <FiPenTool />,
    pixel: <MdApps />,
    mosaicShift: <MdViewComfy />,
    sliceShift: <MdContentCut />,
    posterize: <MdPalette />,
    polarPixel: <MdRadar />
  };

  return (
    <>
      {/* Effects list first */}
      {effectInstances.map((instance, index) => renderEffectSection(instance, index))}
      
      {/* Add Effect section */}
      <div>
        <h3 className="text-[var(--text-color)] text-lg pp-mondwest-font mb-3">Add Effect</h3>
        <div className="effect-buttons-container">
          {[
            { label: '3D', type: 'threeD', desc: 'Rotate and tilt your image in 3D space for a perspective or isometric look.' },
            { label: 'Ascii', type: 'ascii', desc: 'Convert your image into ASCII art using characters.' },
            { label: 'Blob', type: 'blob', desc: 'Connect dots based on brightness to create organic, blobby patterns.' },
            { label: 'Blur', type: 'blur', desc: 'Soften or distort your image with various blur types (Gaussian, Box, Motion, etc.).' },
            { label: 'Color', type: 'color', desc: 'Adjust brightness, contrast, saturation, hue, and invert colors.' },
            { label: 'Dither', type: 'dither', desc: 'Apply classic or modern dithering for a retro, pixelated look.' },
            { label: 'Distort', type: 'distort', desc: 'Apply displacement map distortion using a grayscale image.' },
            { label: 'Find Edges', type: 'findEdges', desc: 'Highlight edges in your image using various edge detection algorithms.' },
            { label: 'Glitch', type: 'glitch', desc: 'Add digital glitch effects: pixel sorting, channel shift, scan lines, and more.' },
            { label: 'Glow', type: 'glow', desc: 'Add a glowing aura to bright areas for a dreamy or sci-fi look.' },
            { label: 'Gradient', type: 'gradient', desc: 'Map image brightness to a custom color gradient for creative colorization.' },
            { label: 'Grid', type: 'grid', desc: 'Overlay a grid and manipulate cells for mosaic or tiled effects.' },
            { label: 'Halftone', type: 'halftone', desc: 'Simulate print halftone patterns with dots, lines, or shapes.' },
            { label: 'LCD', type: 'lcd', desc: 'Simulate LCD/CRT subpixel patterns for a digital or retro display look.' },
            { label: 'Levels', type: 'levels', desc: 'Fine-tune image brightness, contrast, and color levels.' },
            { label: 'Linocut', type: 'linocut', desc: 'Create a linocut or woodcut print effect.' },
            { label: 'Mosaic Shift', type: 'mosaicShift', desc: 'Create mosaic patterns with shifting tiles.' },
            { label: 'Noise', type: 'noise', desc: 'Add various types of noise patterns to your image.' },
            { label: 'Paint', type: 'paint', desc: 'Paint directly on the canvas with customizable brush size and colors.' },
            { label: 'Pixel', type: 'pixel', desc: 'Create pixel art effects with customizable grid sizes.' },
            { label: 'Posterize', type: 'posterize', desc: 'Reduce the number of colors for a poster-like look.' },
            { label: 'Shape Grid', type: 'shapegrid', desc: 'Fill a grid with various shapes based on image brightness.' },
            { label: 'Slice', type: 'sliceShift', desc: 'Create sliced and shifted patterns with various effects.' },
            { label: 'Snake', type: 'snake', desc: 'Create a snake-like pattern that follows image contours.' },
            { label: 'Text', type: 'text', desc: 'Add customizable text overlays with various fonts and styles.' },
            { label: 'Threshold', type: 'threshold', desc: 'Convert your image to black and white using a threshold value.' },
            { label: 'Truchet', type: 'truchet', desc: 'Generate Truchet tile patterns based on your image.' }
          ].map(effect => (
            <button
              key={effect.type}
              className="plain-effect-btn"
              onClick={() => addEffect(effect.type as EffectType)}
              title={effect.desc}
            >
              {effectIcons[effect.type] || <FiPlus size={12} />} {effect.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileControls 