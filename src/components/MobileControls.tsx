'use client'


import React, { useState, useRef, useCallback, useEffect } from 'react'
import './MobileControls.css'
import { DitherSettings, DitherColorMode, DitherType } from './DitherUtils'
import { HalftoneSettings, HalftoneShape, HalftoneArrangement } from './Halftone'
import { ColorSettings } from './ColorUtils'
import { ThresholdSettings } from './ThresholdUtils'
import { GlitchSettings } from './GlitchUtils'
import { GradientMapSettings, GradientMapBlendMode, GradientStop } from './GradientMapUtils'
import { GridSettings } from './Grid'
import Slider from './Slider'
import { BlurSettings, EffectInstance, TextEffectSettings, EffectType } from '../types'
import { saveEffectSettings, loadEffectSettings, EffectSettings } from '../utils/EffectSettingsUtils'
import { isVectorExportAvailable } from './ExportUtils'
import { FiFileText, FiPlus, FiCopy, FiTrash2, FiArrowUp, FiArrowDown, FiGrid, FiDroplet, FiSliders, FiZap, FiEye, FiLayers, FiType, FiHash, FiImage, FiStar, FiAlignCenter, FiBarChart2, FiCpu, FiFilter, FiChevronRight, FiTv } from 'react-icons/fi';
import { FaRegDotCircle, FaRegSquare, FaRegCircle, FaRegClone, FaRegObjectGroup, FaRegSmile, FaRegSun, FaRegMoon, FaRegSnowflake, FaRegChartBar, FaRegKeyboard, FaThLarge } from 'react-icons/fa';
import { MdGradient, MdBlurOn, MdOutlineTextFields, MdOutlineNoiseControlOff, MdOutlineGridOn, MdOutlineColorLens, MdOutlineInvertColors, MdOutlineTextIncrease, MdOutlineTextRotateVertical, MdOutlineTextRotationNone, MdOutlineTextRotationAngleup, MdOutlineTextRotationAngledown } from 'react-icons/md';
import { MdFitbit, MdCompare, MdTexture, MdFingerprint, MdGrain, MdTonality, MdPattern, MdSnowing, MdTerminal, MdStream, MdOutlineWaves } from 'react-icons/md';
import { MosaicShiftSettings, ShiftPattern } from './MosaicShift'
import { SliceShiftSettings } from './SliceShift'
import { PosterizeSettings } from './Posterize'
import { FindEdgesSettings, EdgeDetectionAlgorithm } from './FindEdges'
import { PolarPixelSettings } from './PolarPixel'
import { PixelEffectSettings, PixelMode, PixelVariant } from './PixelEffect'
import Toggle from './Toggle'
import Switch from './Switch'
import LCDEffect from './LCDEffect'

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
const getGradientPreviewStyle = (stops: GradientStop[]) => {
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
  updateTextEffectSettings
}) => {
  const [openSection, setOpenSection] = useState<string | null>(null)

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

  // Update the renderEffectContent function to use instance-specific settings
  const renderEffectContent = (instance: EffectInstance) => {
    // Don't render anything if the section is closed
    if (openSection !== instance.id) return null;
    
    // Get the instance-specific settings
    const settings = getInstanceSettings(instance);
  
    // Render appropriate controls based on effect type
    switch (instance.type) {
      case 'color':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Color adjustments controls */}
            <Slider
              label="Brightness"
              value={settings.brightness}
              onChange={(value) => updateInstanceSettings(instance.id, { brightness: value })}
              min={0}
              max={200}
              step={1}
              unit="%"
            />
            <Slider
              label="Contrast"
              value={settings.contrast}
              onChange={(value) => updateInstanceSettings(instance.id, { contrast: value })}
              min={0}
              max={200}
              step={1}
              unit="%"
            />
            <Slider
              label="Saturation"
              value={settings.saturation}
              onChange={(value) => updateInstanceSettings(instance.id, { saturation: value })}
              min={0}
              max={200}
              step={1}
              unit="%"
            />
            <Slider
              label="Hue Shift"
              value={settings.hueShift}
              onChange={(value) => updateInstanceSettings(instance.id, { hueShift: value })}
              min={-180}
              max={180}
              step={1}
              unit="°"
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
                value={settings.type || 'gaussian'}
                onChange={(e) => updateInstanceSettings(instance.id, { type: e.target.value })}
              >
                <option value="gaussian">Gaussian</option>
                <option value="box">Box</option>
                <option value="radial">Radial</option>
                <option value="motion">Motion</option>
                <option value="tiltshift">Tilt Shift</option>
              </select>
            </div>

            <Slider
              label="Radius"
              value={settings.radius || 1}
              onChange={(value) => updateInstanceSettings(instance.id, { radius: value })}
              min={1}
              max={50}
              step={1}
              unit="px"
            />

            {settings.type === 'radial' && (
              <>
                <Slider
                  label="Center X"
                  value={settings.centerX || 50}
                  onChange={(value) => updateInstanceSettings(instance.id, { centerX: value })}
                  min={0}
                  max={100}
                  step={1}
                />
                <Slider
                  label="Center Y"
                  value={settings.centerY || 50}
                  onChange={(value) => updateInstanceSettings(instance.id, { centerY: value })}
                  min={0}
                  max={100}
                  step={1}
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
              />
            )}

            {settings.type === 'tiltshift' && (
              <>
                <Slider
                  label="Focus Position"
                  value={settings.focusPosition || 50}
                  onChange={(value) => updateInstanceSettings(instance.id, { focusPosition: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />
                <Slider
                  label="Focus Width"
                  value={settings.focusWidth || 25}
                  onChange={(value) => updateInstanceSettings(instance.id, { focusWidth: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />
                <Slider
                  label="Angle"
                  value={settings.angle || 0}
                  onChange={(value) => updateInstanceSettings(instance.id, { angle: value })}
                  min={0}
                  max={180}
                  step={1}
                  unit="°"
                />
                <Slider
                  label="Gradient"
                  value={settings.gradient || 12.5}
                  onChange={(value) => updateInstanceSettings(instance.id, { gradient: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
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
            />
            
            {settings.mode === 'solid' && (
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
            )}
            
            {settings.mode === 'gradient' && (
              <>
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Dark Color Start</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.darkColorStart}
                    onChange={(e) => updateInstanceSettings(instance.id, { darkColorStart: e.target.value })}
                  />
                </div>
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Dark Color End</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.darkColorEnd}
                    onChange={(e) => updateInstanceSettings(instance.id, { darkColorEnd: e.target.value })}
                  />
                </div>
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Light Color Start</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.lightColorStart}
                    onChange={(e) => updateInstanceSettings(instance.id, { lightColorStart: e.target.value })}
                  />
                </div>
                
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Light Color End</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.lightColorEnd}
                    onChange={(e) => updateInstanceSettings(instance.id, { lightColorEnd: e.target.value })}
                  />
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
            />
            <Slider
              label="Threshold"
              value={settings.threshold || 128}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
            />
            {/* Color Depth - Only show if not in 2-color mode */}
            {settings.colorMode !== '2-color' && (
              <Slider
                label="Color Depth"
                value={settings.colorDepth || 2}
                onChange={(value) => updateInstanceSettings(instance.id, { colorDepth: value })}
                min={2}
                max={256}
                step={1}
                unit=" colors"
              />
            )}
            {/* Color controls for 2-color mode */}
            {settings.colorMode === '2-color' && (
              <>
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Dark Color</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
                    value={settings.darkColor || '#000000'}
                    onChange={(e) => updateInstanceSettings(instance.id, { darkColor: e.target.value })}
                  />
                </div>
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Light Color</label>
                  <input 
                    type="color" 
                    className="mobile-color-picker"
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
            
            <Slider
              label="Cell Size"
              value={settings.cellSize}
              onChange={(value) => updateInstanceSettings(instance.id, { cellSize: value })}
              min={2}
              max={30}
              step={1}
              unit="px"
            />
            <Slider
              label="Dot Scale"
              value={settings.dotScaleFactor}
              onChange={(value) => updateInstanceSettings(instance.id, { dotScaleFactor: value })}
              min={0.1}
              max={1.5}
              step={0.05}
            />
            <Slider
              label="Mix Amount"
              value={settings.mix}
              onChange={(value) => updateInstanceSettings(instance.id, { mix: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
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
            <div className="mobile-control-group">
              <label className="mobile-control-label">Font Family</label>
              <select
                className="mobile-select"
                value={settings.fontFamily || 'Arial'}
                onChange={e => updateInstanceSettings(instance.id, { fontFamily: e.target.value })}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Custom">Custom Uploaded</option>
              </select>
            </div>
            {(settings.fontFamily === 'Custom' || settings.fontFamily?.startsWith('custom-')) && (
              <div className="mobile-control-group">
                <label className="mobile-control-label">Upload Font</label>
                <label className="mobile-action-button" style={{ display: 'inline-block', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', background: 'var(--accent-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 500 }}>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fontName = `custom-${file.name.replace(/\W/g, '')}`;
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          if (event.target && event.target.result) {
                            const dataUrl = event.target.result;
                            if (typeof dataUrl === 'string') {
                              const font = new FontFace(fontName, `url(${dataUrl})`);
                              await font.load();
                              document.fonts.add(font);
                              updateInstanceSettings(instance.id, { fontFamily: fontName });
                            }
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  Upload Custom Font
                </label>
              </div>
            )}
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
            />
            {/* Font Weight */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Font Weight</label>
              <select
                className="mobile-select"
                value={settings.fontWeight}
                onChange={(e) => updateInstanceSettings(instance.id, { fontWeight: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
                <option value="bolder">Bolder</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </div>
            {/* Letter Spacing */}
            <Slider
              label="Letter Spacing"
              value={settings.letterSpacing}
              onChange={(value) => updateInstanceSettings(instance.id, { letterSpacing: value })}
              min={-10}
              max={100}
              step={1}
              unit="px"
            />
            {/* Line Height */}
            <Slider
              label="Line Height"
              value={settings.lineHeight}
              onChange={(value) => updateInstanceSettings(instance.id, { lineHeight: value })}
              min={0.1}
              max={4}
              step={0.05}
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
            />
            {/* Y Position */}
            <Slider
              label="Y Position"
              value={settings.y}
              onChange={(value) => updateInstanceSettings(instance.id, { y: value })}
              min={0}
              max={1}
              step={0.01}
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
            />
            {/* Alignment (kept at the end for now) */}
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
                />
                <Slider
                  label="Density"
                  value={settings.glitchDensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { glitchDensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />
                <Slider
                  label="Size"
                  value={settings.glitchSize}
                  onChange={(value) => updateInstanceSettings(instance.id, { glitchSize: value })}
                  min={1}
                  max={50}
                  step={1}
                  unit="px"
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
                />
                <Slider
                  label="Intensity"
                  value={settings.scanLinesIntensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { scanLinesIntensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
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
                />
                <Slider
                  label="Offset"
                  value={settings.blocksOffset}
                  onChange={(value) => updateInstanceSettings(instance.id, { blocksOffset: value })}
                  min={0}
                  max={50}
                  step={1}
                  unit="%"
                />
                <Slider
                  label="Density"
                  value={settings.blocksDensity}
                  onChange={(value) => updateInstanceSettings(instance.id, { blocksDensity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
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
            />
            <Slider
              label="Rows"
              value={settings.rows}
              onChange={(value) => updateInstanceSettings(instance.id, { rows: value })}
              min={1}
              max={10}
              step={1}
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
                />
                <Slider
                  label="Max Split Levels"
                  value={settings.maxSplitLevels}
                  onChange={(value) => updateInstanceSettings(instance.id, { maxSplitLevels: value })}
                  min={1}
                  max={4}
                  step={1}
                />
                <Slider
                  label="Min Cell Size"
                  value={settings.minCellSize}
                  onChange={(value) => updateInstanceSettings(instance.id, { minCellSize: value })}
                  min={10}
                  max={100}
                  step={5}
                  unit="px"
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
            />
            <Slider
              label="Rows"
              value={settings.rows}
              onChange={(value) => updateInstanceSettings(instance.id, { rows: value })}
              min={2}
              max={20}
              step={1}
            />
            
            <Slider
              label="Max X Offset"
              value={settings.maxOffsetX}
              onChange={(value) => updateInstanceSettings(instance.id, { maxOffsetX: value })}
              min={0}
              max={200}
              step={1}
              unit="px"
            />
            
            <Slider
              label="Max Y Offset"
              value={settings.maxOffsetY}
              onChange={(value) => updateInstanceSettings(instance.id, { maxOffsetY: value })}
              min={0}
              max={200}
              step={1}
              unit="px"
            />
            
            <Slider
              label="Intensity"
              value={settings.intensity}
              onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
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
            {/* Slice Shift controls */}
            <Slider
              label="Number of Slices"
              value={settings.slices}
              onChange={(value) => updateInstanceSettings(instance.id, { slices: value })}
              min={5}
              max={100}
              step={1}
            />
            
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
                  <option value="alternate">Alternate (even/odd)</option>
                  <option value="shuffle">Shuffle</option>
                </select>
              </div>
            )}
            
            {(settings.mode === 'random' || settings.mode === 'alternating' || settings.mode === 'wave') && (
              <Slider
                label="Max Offset"
                value={settings.maxOffset}
                onChange={(value) => updateInstanceSettings(instance.id, { maxOffset: value })}
                min={0}
                max={100}
                step={1}
                unit="px"
              />
            )}
            
            {/* Only show intensity slider for modes where it applies */}
            {(settings.mode === 'random' || settings.mode === 'alternating' || settings.mode === 'wave') && (
              <Slider
                label="Intensity"
                value={settings.intensity}
                onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
                min={0}
                max={100}
                step={1}
                unit="%"
              />
            )}
            
            <div className="mobile-control-group">
              <label className="mobile-control-label">Edge Feathering</label>
              <label className="mobile-effect-toggle">
                <input 
                  type="checkbox" 
                  checked={settings.feathering}
                  onChange={(e) => updateInstanceSettings(instance.id, { feathering: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            
            {settings.feathering && (
              <Slider
                label="Feather Amount"
                value={settings.featherAmount}
                onChange={(value) => updateInstanceSettings(instance.id, { featherAmount: value })}
                min={0}
                max={100}
                step={1}
                unit="%"
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
                unit="%"
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
            />

            <Slider
              label="Threshold"
              value={settings.threshold}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
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
            />
            <Slider
              label="Mix Amount"
              value={settings.mix}
              onChange={(value) => updateInstanceSettings(instance.id, { mix: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
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
              <label className="mobile-control-label">Arrangement</label>
              <select 
                className="mobile-select"
                value={settings.arrangement}
                onChange={(e) => updateInstanceSettings(instance.id, { arrangement: e.target.value as 'grid' | 'spiral' | 'concentric' })}
              >
                <option value="grid">Grid</option>
                <option value="spiral">Spiral</option>
                <option value="concentric">Concentric</option>
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Shape</label>
              <select 
                className="mobile-select"
                value={settings.shape}
                onChange={(e) => updateInstanceSettings(instance.id, { shape: e.target.value as 'circle' | 'square' | 'diamond' })}
              >
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Connection Type</label>
              <select 
                className="mobile-select"
                value={settings.connectionType}
                onChange={(e) => updateInstanceSettings(instance.id, { connectionType: e.target.value as 'straight' | 'curved' | 'wavy' })}
              >
                <option value="straight">Straight</option>
                <option value="curved">Curved</option>
                <option value="wavy">Wavy</option>
              </select>
            </div>
            <Slider
              label="Connection Strength"
              value={settings.connectionStrength}
              onChange={(value) => updateInstanceSettings(instance.id, { connectionStrength: value })}
              min={1}
              max={5}
              step={0.5}
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Connection Color</label>
              <input 
                type="color" 
                className="mobile-color-picker"
                value={settings.connectionColor}
                onChange={(e) => updateInstanceSettings(instance.id, { connectionColor: e.target.value })}
              />
            </div>
            <Slider
              label="Min Distance"
              value={settings.minDistance}
              onChange={(value) => updateInstanceSettings(instance.id, { minDistance: value })}
              min={5}
              max={100}
              step={1}
              unit="px"
            />
            <Slider
              label="Max Distance"
              value={settings.maxDistance}
              onChange={(value) => updateInstanceSettings(instance.id, { maxDistance: value })}
              min={10}
              max={200}
              step={1}
              unit="px"
            />
            <Slider
              label="Angle Offset"
              value={settings.angleOffset}
              onChange={(value) => updateInstanceSettings(instance.id, { angleOffset: value })}
              min={0}
              max={360}
              step={1}
              unit="°"
            />
            <Slider
              label="Size Variation"
              value={settings.sizeVariation}
              onChange={(value) => updateInstanceSettings(instance.id, { sizeVariation: value })}
              min={0}
              max={1}
              step={0.05}
            />
            <Slider
              label="Dot Scale"
              value={settings.dotScaleFactor}
              onChange={(value) => updateInstanceSettings(instance.id, { dotScaleFactor: value })}
              min={0.1}
              max={1.5}
              step={0.05}
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Invert Brightness</label>
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

      case 'glow':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Glow controls */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Glow Color</label>
              <input 
                type="color" 
                className="mobile-color-picker"
                value={settings.color || '#ffffff'}
                onChange={(e) => updateInstanceSettings(instance.id, { color: e.target.value })}
              />
            </div>

            <Slider
              label="Intensity"
              value={settings.intensity || 50}
              onChange={(value) => updateInstanceSettings(instance.id, { intensity: value })}
              min={0}
              max={100}
              step={1}
              unit="%"
            />

            <Slider
              label="Threshold"
              value={settings.threshold || 128}
              onChange={(value) => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={255}
              step={1}
            />

            <Slider
              label="Softness"
              value={settings.softness || 5}
              onChange={(value) => updateInstanceSettings(instance.id, { softness: value })}
              min={0}
              max={20}
              step={1}
              unit="px"
            />

            <div className="mobile-control-group">
              <label className="mobile-control-label">Blend Mode</label>
              <select 
                className="mobile-select"
                value={settings.blendMode || 'normal'}
                onChange={(e) => updateInstanceSettings(instance.id, { blendMode: e.target.value as 'add' | 'normal' })}
              >
                <option value="normal">Normal</option>
                <option value="add">Add</option>
              </select>
            </div>
          </div>
        );

      case 'polarPixel': {
        const settings = instanceSettings[instance.id] as PolarPixelSettings;
        if (!settings) return null;
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Rings"
              value={settings.rings}
              onChange={(value) => updateInstanceSettings(instance.id, { rings: value })}
              min={4}
              max={64}
              step={1}
            />
            <Slider
              label="Segments"
              value={settings.segments}
              onChange={(value) => updateInstanceSettings(instance.id, { segments: value })}
              min={8}
              max={128}
              step={1}
            />
            <Slider
              label="Center X"
              value={settings.centerX}
              onChange={(value) => updateInstanceSettings(instance.id, { centerX: value })}
              min={0}
              max={1}
              step={0.01}
            />
            <Slider
              label="Center Y"
              value={settings.centerY}
              onChange={(value) => updateInstanceSettings(instance.id, { centerY: value })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        );
      }

      case 'pixel': {
        const settings = instanceSettings[instance.id] as PixelEffectSettings;
        if (!settings) return null;
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            {/* Pixel controls only. Do NOT include rotationMode or rotationMax controls here. */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Mode</label>
              <select
                className="mobile-select"
                value={settings.mode}
                onChange={e => updateInstanceSettings(instance.id, { mode: e.target.value as PixelMode })}
              >
                <option value="grid">Grid</option>
                <option value="radial">Radial</option>
                <option value="offgrid">Off Grid</option>
                <option value="voronoi">Voronoi</option>
                <option value="rings">Rings</option>
                <option value="random">Random</option>
              </select>
            </div>

            {/* Mode-specific size/shape controls */}
            {settings.mode === 'grid' && (
              <Slider
                label="Cell Size"
                value={settings.cellSize || 16}
                onChange={value => updateInstanceSettings(instance.id, { cellSize: value })}
                min={4}
                max={64}
                step={1}
              />
            )}
            {settings.mode === 'offgrid' && (
              <>
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
                <Slider
                  label="Size"
                  value={settings.offGridSize || 16}
                  onChange={value => updateInstanceSettings(instance.id, { offGridSize: value })}
                  min={4}
                  max={64}
                  step={1}
                />
              </>
            )}
            {settings.mode === 'voronoi' && (
              <>
                <Slider
                  label="Seeds"
                  value={settings.voronoiSeeds || 32}
                  onChange={value => updateInstanceSettings(instance.id, { voronoiSeeds: value })}
                  min={1}
                  max={4096}
                  step={1}
                />
                <Slider
                  label="Jitter"
                  value={settings.voronoiJitter || 0.2}
                  onChange={value => updateInstanceSettings(instance.id, { voronoiJitter: value })}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </>
            )}
            {settings.mode === 'rings' && (
              <Slider
                label="Ring Count"
                value={settings.ringCount || 24}
                onChange={value => updateInstanceSettings(instance.id, { ringCount: value })}
                min={2}
                max={64}
                step={1}
              />
            )}
            {settings.mode === 'random' && (
              <>
                <Slider
                  label="Min Block Size"
                  value={settings.minBlockSize || 8}
                  onChange={value => updateInstanceSettings(instance.id, { minBlockSize: value })}
                  min={2}
                  max={64}
                  step={1}
                />
                <Slider
                  label="Max Block Size"
                  value={settings.maxBlockSize || 32}
                  onChange={value => updateInstanceSettings(instance.id, { maxBlockSize: value })}
                  min={4}
                  max={128}
                  step={1}
                />
              </>
            )}
            {settings.mode === 'radial' && (
              <>
                <Slider
                  label="Rings"
                  value={settings.rings || 24}
                  onChange={value => updateInstanceSettings(instance.id, { rings: value })}
                  min={2}
                  max={64}
                  step={1}
                />
                <Slider
                  label="Segments"
                  value={settings.segments || 48}
                  onChange={value => updateInstanceSettings(instance.id, { segments: value })}
                  min={4}
                  max={128}
                  step={1}
                />
                <Slider
                  label="Center X"
                  value={settings.centerX !== undefined ? settings.centerX : 0.5}
                  onChange={value => updateInstanceSettings(instance.id, { centerX: value })}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <Slider
                  label="Center Y"
                  value={settings.centerY !== undefined ? settings.centerY : 0.5}
                  onChange={value => updateInstanceSettings(instance.id, { centerY: value })}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </>
            )}

            {/* Color Variant Controls (shown for all modes) */}
            <div className="mobile-control-group">
              <label className="mobile-control-label">Variant</label>
              <select
                className="mobile-select"
                value={settings.variant || 'classic'}
                onChange={e => updateInstanceSettings(instance.id, { variant: e.target.value as PixelVariant })}
              >
                <option value="classic">Classic</option>
                <option value="posterized">Posterized</option>
                <option value="grayscale">Grayscale</option>
              </select>
            </div>
            {settings.variant === 'posterized' && (
              <Slider
                label="Color Levels"
                value={settings.posterizeLevels || 4}
                onChange={value => updateInstanceSettings(instance.id, { posterizeLevels: value })}
                min={2}
                max={8}
                step={1}
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
              />
            )}
            {/* Removed rotationMode and rotationMax controls from pixel effect */}
          </div>
        );
      }

      case 'noise': {
        const settings = instanceSettings[instance.id];
        if (!settings) return null;
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Type</label>
              <select
                className="mobile-select"
                value={settings.type}
                onChange={e => updateInstanceSettings(instance.id, { type: e.target.value })}
              >
                <option value="perlin">Perlin</option>
              </select>
            </div>
            <Slider
              label="Intensity"
              value={settings.intensity || 0.5}
              onChange={value => updateInstanceSettings(instance.id, { intensity: value })}
              min={0}
              max={1}
              step={0.01}
            />
            <Slider
              label="Scale"
              value={settings.scale || 0.1}
              onChange={value => updateInstanceSettings(instance.id, { scale: value })}
              min={0.01}
              max={500}
              step={0.01}
            />
            <Slider
              label="Seed"
              value={settings.seed || 0}
              onChange={value => updateInstanceSettings(instance.id, { seed: value })}
              min={0}
              max={1000}
              step={1}
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Blend Mode</label>
              <select
                className="mobile-select"
                value={settings.blendMode || 'normal'}
                onChange={e => updateInstanceSettings(instance.id, { blendMode: e.target.value })}
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
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Monochrome</label>
              <label className="mobile-effect-toggle">
                <input
                  type="checkbox"
                  checked={!!settings.monochrome}
                  onChange={e => updateInstanceSettings(instance.id, { monochrome: e.target.checked })}
                />
                <span className="mobile-effect-toggle-slider"></span>
              </label>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Channel</label>
              <select
                className="mobile-select"
                value={settings.channel || 'all'}
                onChange={e => updateInstanceSettings(instance.id, { channel: e.target.value })}
              >
                <option value="all">All</option>
                <option value="r">Red</option>
                <option value="g">Green</option>
                <option value="b">Blue</option>
              </select>
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
          </div>
        );
      }

      case 'linocut': {
        const settings = instanceSettings[instance.id];
        if (!settings) return null;
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Line Spacing"
              value={settings.lineSpacing || 10}
              onChange={value => updateInstanceSettings(instance.id, { lineSpacing: value })}
              min={2}
              max={64}
              step={1}
            />
            <Slider
              label="Stroke Width"
              value={settings.strokeWidth || 8}
              onChange={value => updateInstanceSettings(instance.id, { strokeWidth: value })}
              min={1}
              max={32}
              step={1}
            />
            <Slider
              label="Min Line"
              value={settings.minLine || 1}
              onChange={value => updateInstanceSettings(instance.id, { minLine: value })}
              min={0.1}
              max={16}
              step={0.1}
            />
            <Slider
              label="Noise Scale"
              value={settings.noiseScale || 0.015}
              onChange={value => updateInstanceSettings(instance.id, { noiseScale: value })}
              min={0.001}
              max={0.1}
              step={0.001}
            />
            <Slider
              label="Center X"
              value={settings.centerX || 0.5}
              onChange={value => updateInstanceSettings(instance.id, { centerX: value })}
              min={0}
              max={1}
              step={0.01}
            />
            <Slider
              label="Center Y"
              value={settings.centerY || 0.5}
              onChange={value => updateInstanceSettings(instance.id, { centerY: value })}
              min={0}
              max={1}
              step={0.01}
            />
            <Slider
              label="Threshold"
              value={settings.threshold || 0.5}
              onChange={value => updateInstanceSettings(instance.id, { threshold: value })}
              min={0}
              max={1}
              step={0.01}
            />
            <Toggle
              label="Invert"
              value={settings.invert || false}
              onChange={value => updateInstanceSettings(instance.id, { invert: value })}
            />
            <Toggle
              label="Vertical"
              value={settings.orientation === 'vertical'}
              onChange={value => updateInstanceSettings(instance.id, { orientation: value ? 'vertical' : 'horizontal' })}
            />
          </div>
        );
      }

      case 'levels': {
        const settings = instanceSettings[instance.id];
        if (!settings) return null;
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Black Point"
              value={settings.black}
              onChange={value => updateInstanceSettings(instance.id, { black: value })}
              min={0}
              max={255}
              step={1}
            />
            <Slider
              label="Gamma"
              value={settings.gamma}
              onChange={value => updateInstanceSettings(instance.id, { gamma: value })}
              min={0.1}
              max={5}
              step={0.01}
            />
            <Slider
              label="White Point"
              value={settings.white}
              onChange={value => updateInstanceSettings(instance.id, { white: value })}
              min={0}
              max={255}
              step={1}
            />
          </div>
        );
      }

      case 'ascii': {
        // Charset presets
        const asciiPresets = [
          { label: 'Dense', value: '@%#*+=-:. ' },
          { label: 'Blocks', value: '█▓▒░ ' },
          { label: 'Sparse', value: '@#S%?*+;:,. ' },
          { label: 'Classic', value: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\0 ' },
          { label: 'Custom', value: settings.charset }
        ];
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <Slider
              label="Cell Size"
              value={settings.cellSize}
              onChange={(value) => updateInstanceSettings(instance.id, { cellSize: value })}
              min={4}
              max={32}
              step={1}
              unit="px"
            />
            <Slider
              label="Font Size"
              value={settings.fontSize}
              onChange={(value) => updateInstanceSettings(instance.id, { fontSize: value })}
              min={4}
              max={64}
              step={1}
              unit="px"
            />
            <div className="mobile-control-group">
              <label className="mobile-control-label">Charset Preset</label>
              <select
                className="mobile-select"
                value={asciiPresets.find(p => p.value === settings.charset) ? settings.charset : 'custom'}
                onChange={e => {
                  const preset = asciiPresets.find(p => p.value === e.target.value);
                  if (preset && preset.label !== 'Custom') {
                    updateInstanceSettings(instance.id, { charset: preset.value, preset: preset.label });
                  }
                }}
              >
                {asciiPresets.map(p => (
                  <option key={p.label} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Charset</label>
              <input
                type="text"
                className="mobile-select"
                value={settings.charset}
                onChange={(e) => updateInstanceSettings(instance.id, { charset: e.target.value, preset: 'Custom' })}
              />
            </div>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Monochrome</label>
              <label className="mobile-effect-toggle">
                <input
                  type="checkbox"
                  checked={settings.monochrome !== false}
                  onChange={e => updateInstanceSettings(instance.id, { monochrome: e.target.checked })}
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
            <Slider
              label="Random Jitter"
              value={settings.jitter || 0}
              onChange={value => updateInstanceSettings(instance.id, { jitter: value })}
              min={0}
              max={settings.cellSize}
              step={1}
              unit="px"
            />
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
      }

      case 'lcd':
        return (
          <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
            <div className="mobile-control-group">
              <label className="mobile-control-label">Pattern</label>
              <select
                className="mobile-select"
                value={settings.pattern || 'LCD'}
                onChange={e => updateInstanceSettings(instance.id, { ...settings, pattern: e.target.value })}
              >
                <option value="TV CRT">TV CRT</option>
                <option value="PC CRT">PC CRT</option>
                <option value="XO-1 LCD">XO-1 LCD</option>
                <option value="LCD">LCD</option>
              </select>
            </div>
            <Slider
              label="Cell Width"
              value={settings.cellWidth}
              onChange={(value) => updateInstanceSettings(instance.id, { ...settings, cellWidth: value })}
              min={1}
              max={20}
              step={1}
              unit="px"
            />
            <Slider
              label="Cell Height"
              value={settings.cellHeight}
              onChange={(value) => updateInstanceSettings(instance.id, { ...settings, cellHeight: value })}
              min={1}
              max={20}
              step={1}
              unit="px"
            />
            <Slider
              label="Padding"
              value={settings.padding ?? 2}
              onChange={(value) => updateInstanceSettings(instance.id, { ...settings, padding: value })}
              min={0}
              max={20}
              step={1}
              unit="px"
            />
            <Slider
              label="Intensity"
              value={settings.intensity}
              onChange={(value) => updateInstanceSettings(instance.id, { ...settings, intensity: value })}
              min={0}
              max={10}
              step={0.1}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Update the rendering of sections to use the new renderEffectContent function
  const renderEffectSection = (instance: EffectInstance) => {
    const sameTypeEffects = effectInstances.filter(i => i.type === instance.type);
    const sameTypeCount = sameTypeEffects.length;
    const instanceIndex = sameTypeEffects.findIndex(i => i.id === instance.id);

    // Use only the effect name (no 'Effect' in the label)
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
      'Effect';
    const title = sameTypeCount > 1 ? `${effectLabel} ${instanceIndex + 1}` : effectLabel;

    return (
      <div key={instance.id} className="mobile-effect-section">
        {renderSectionHeader(instance, title)}
        {renderEffectContent(instance)}
      </div>
    );
  };

  // Icon mapping for each effect type
  const effectIcons: Record<string, React.ReactNode> = {
    blob: <MdPattern />,
    blur: <MdBlurOn />,
    color: <MdOutlineColorLens />,
    dither: <MdSnowing />,
    findEdges: <FiEye />,
    glitch: <FiZap />,
    glow: <MdStream />,
    gradient: <MdGradient />,
    grid: <FiGrid />,
    halftone: <MdFitbit />,
    mosaicShift: <FaThLarge />,
    noise: <MdFingerprint />,
    pixel: <MdGrain />,
    posterize: <MdTonality />,
    sliceShift: <MdTexture />,
    text: <FiType />,
    threshold: <MdCompare />,
    linocut: <MdOutlineWaves />,
    levels: <FiBarChart2 />,
    ascii: <MdTerminal />,
    lcd: <FiTv />,
  };

  return (
    <>
      {/* Effects list first */}
      {effectInstances.map(instance => renderEffectSection(instance))}
      
      {/* Add Effect section */}
      <div>
        <h3 className="text-[var(--text-color)] text-lg pp-mondwest-font mb-3">Add Effect</h3>
        <div className="effect-buttons-container">
          {[
            { label: 'Blob', type: 'blob' },
            { label: 'Blur', type: 'blur' },
            { label: 'Color', type: 'color' },
            { label: 'Dither', type: 'dither' },
            { label: 'Find Edges', type: 'findEdges' },
            { label: 'Glitch', type: 'glitch' },
            { label: 'Glow', type: 'glow' },
            { label: 'Gradient', type: 'gradient' },
            { label: 'Grid', type: 'grid' },
            { label: 'Halftone', type: 'halftone' },
            { label: 'Mosaic', type: 'mosaicShift' },
            { label: 'Noise', type: 'noise' },
            { label: 'Pixel', type: 'pixel' },
            { label: 'Posterize', type: 'posterize' },
            { label: 'Slice', type: 'sliceShift' },
            { label: 'Text', type: 'text' },
            { label: 'Threshold', type: 'threshold' },
            { label: 'Linocut', type: 'linocut' },
            { label: 'Levels', type: 'levels' },
            { label: 'Ascii', type: 'ascii' },
            { label: 'LCD', type: 'lcd' },
          ]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(effect => (
              <button
                key={effect.type}
                className="plain-effect-btn"
                onClick={() => addEffect(effect.type as EffectType)}
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