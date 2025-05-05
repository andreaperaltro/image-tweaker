'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import './MobileControls.css'
import { DitherSettings, DitherColorMode, DitherType } from './DitherUtils'
import { HalftoneSettings, HalftoneShape, HalftoneArrangement } from './Halftone'
import { ColorSettings } from './ColorUtils'
import { ThresholdSettings } from './ThresholdUtils'
import { GlitchSettings } from './GlitchUtils'
import { TextDitherSettings } from './TextDitherUtils'
import { GradientMapSettings, GradientMapBlendMode, GradientStop } from './GradientMapUtils'
import { GridSettings } from './Grid'
import Slider from './Slider'
import { BlurSettings, EffectInstance } from '../types'
import { saveEffectSettings, loadEffectSettings, EffectSettings } from '../utils/EffectSettingsUtils'
import { isVectorExportAvailable } from './ExportUtils'
import { FiFileText, FiPlus, FiCopy, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi'

interface MobileControlsProps {
  ditherSettings: DitherSettings
  halftoneSettings: HalftoneSettings
  colorSettings: ColorSettings
  thresholdSettings: ThresholdSettings
  glitchSettings: GlitchSettings
  textDitherSettings: TextDitherSettings
  gradientMapSettings: GradientMapSettings
  gridSettings: GridSettings
  effectInstances: EffectInstance[]
  updateDitherSettings: (settings: Partial<DitherSettings>) => void
  updateHalftoneSettings: (setting: keyof HalftoneSettings, value: any) => void
  updateColorSettings: (setting: keyof ColorSettings, value: any) => void
  updateThresholdSettings: (settings: Partial<ThresholdSettings>) => void
  updateGlitchSettings: (settings: Partial<GlitchSettings>) => void
  updateTextDitherSettings: (settings: Partial<TextDitherSettings>) => void
  updateGradientMapSettings: (settings: Partial<GradientMapSettings>) => void
  updateGridSettings: (setting: keyof GridSettings, value: any) => void
  updateEffectInstances: (instances: EffectInstance[]) => void
  addEffect: (type: string) => void
  duplicateEffect: (id: string) => void
  removeEffect: (id: string) => void
  onResetImage: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onCropImage: () => void
  blur: BlurSettings
  onBlurChange: (settings: BlurSettings) => void
  onSettingsLoaded?: (settings: EffectSettings) => void
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
  textDitherSettings,
  gradientMapSettings,
  gridSettings,
  effectInstances,
  updateDitherSettings,
  updateHalftoneSettings,
  updateColorSettings,
  updateThresholdSettings,
  updateGlitchSettings,
  updateTextDitherSettings,
  updateGradientMapSettings,
  updateGridSettings,
  updateEffectInstances,
  addEffect,
  duplicateEffect,
  removeEffect,
  onResetImage,
  onExportPng,
  onExportSvg,
  onCropImage,
  blur,
  onBlurChange,
  onSettingsLoaded
}) => {
  const [openSection, setOpenSection] = useState<string | null>(null)

  // Create debounced versions of update functions for color pickers
  const debouncedUpdateGradientMapSettings = useDebounce(updateGradientMapSettings, 100);
  const debouncedUpdateThresholdSettings = useDebounce(updateThresholdSettings, 100);
  const debouncedUpdateDitherSettings = useDebounce(updateDitherSettings, 100);
  
  // Helper function to handle color changes with debounce
  const handleColorChange = (
    updateFn: (settings: any) => void, 
    colorKey: string, 
    newColor: string
  ) => {
    // Update UI immediately for better feedback
    const inputElement = document.activeElement as HTMLInputElement;
    if (inputElement && inputElement.type === 'color') {
      inputElement.value = newColor;
    }
    
    // Debounce the actual state update
    if (colorKey.startsWith('stops')) {
      // Special handling for gradient stops array
      setTimeout(() => {
        updateFn({ [colorKey]: newColor });
      }, 100);
    } else {
      // Simple property update
      setTimeout(() => {
        updateFn({ [colorKey]: newColor });
      }, 100);
    }
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
          <div className="effect-title-container">
            <span className="effect-order-number">
              {orderIndex + 1}
            </span>
            <h3 
              className="mobile-effect-title"
              onClick={() => toggleSection(instance.id)}
            >
              {title} ({instance.id})
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
      textDitherSettings,
      gradientMapSettings,
      gridSettings,
      effectInstances,
      blur
    };
    saveEffectSettings(settings);
  };

  const handleLoadSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const settings = await loadEffectSettings(file);
        if (onSettingsLoaded) {
          onSettingsLoaded(settings);
        }
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

  return (
    <div className="mobile-controls">
      <div className="mobile-controls-panel">
        {/* Effects list first */}
        {effectInstances.map(instance => {
          switch (instance.type) {
            case 'color':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Color Adjustments')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Color adjustments controls */}
                    <Slider
                      label="Brightness"
                      value={colorSettings.brightness}
                      onChange={(value) => updateColorSettings('brightness', value)}
                      min={0}
                      max={200}
                      step={1}
                      unit="%"
                    />
                    <Slider
                      label="Contrast"
                      value={colorSettings.contrast}
                      onChange={(value) => updateColorSettings('contrast', value)}
                      min={0}
                      max={200}
                      step={1}
                      unit="%"
                    />
                    <Slider
                      label="Saturation"
                      value={colorSettings.saturation}
                      onChange={(value) => updateColorSettings('saturation', value)}
                      min={0}
                      max={200}
                      step={1}
                      unit="%"
                    />
                    <Slider
                      label="Hue Shift"
                      value={colorSettings.hueShift}
                      onChange={(value) => updateColorSettings('hueShift', value)}
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
                          checked={colorSettings.invert}
                          onChange={(e) => updateColorSettings('invert', e.target.checked)}
                        />
                        <span className="mobile-effect-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              );

            case 'blur':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Blur Effect')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Blur controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Blur Type</label>
                      <select 
                        className="mobile-select"
                        value={blur.type || 'gaussian'}
                        onChange={(e) => onBlurChange({ ...blur, type: e.target.value as any })}
                      >
                        <option value="gaussian">Gaussian</option>
                        <option value="radial">Radial</option>
                        <option value="motion">Motion</option>
                        <option value="tiltshift">Tilt Shift</option>
                      </select>
                    </div>

                    <Slider
                      label="Radius"
                      value={blur.radius || 0}
                      onChange={(value) => onBlurChange({ ...blur, radius: value })}
                      min={0}
                      max={200}
                      step={1}
                    />

                    {blur.type === 'radial' && (
                      <>
                        <Slider
                          label="Center X"
                          value={blur.centerX || 50}
                          onChange={(value) => onBlurChange({ ...blur, centerX: value })}
                          min={0}
                          max={100}
                          step={1}
                        />
                        <Slider
                          label="Center Y"
                          value={blur.centerY || 50}
                          onChange={(value) => onBlurChange({ ...blur, centerY: value })}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </>
                    )}

                    {blur.type === 'motion' && (
                      <Slider
                        label="Angle"
                        value={blur.angle || 0}
                        onChange={(value) => onBlurChange({ ...blur, angle: value })}
                        min={0}
                        max={360}
                        step={1}
                      />
                    )}

                    {blur.type === 'tiltshift' && (
                      <>
                        <Slider
                          label="Focus Position"
                          value={blur.focusPosition || 50}
                          onChange={(value) => onBlurChange({ ...blur, focusPosition: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                        <Slider
                          label="Focus Width"
                          value={blur.focusWidth || 25}
                          onChange={(value) => onBlurChange({ ...blur, focusWidth: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                        <Slider
                          label="Angle"
                          value={blur.angle || 0}
                          onChange={(value) => onBlurChange({ ...blur, angle: value })}
                          min={0}
                          max={180}
                          step={1}
                          unit="°"
                        />
                        <Slider
                          label="Gradient"
                          value={blur.gradient || 12.5}
                          onChange={(value) => onBlurChange({ ...blur, gradient: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                      </>
                    )}
                  </div>
                </div>
              );

            case 'gradient':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Gradient Map')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Gradient map controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Blend Mode</label>
                      <select 
                        className="mobile-select"
                        value={gradientMapSettings.blendMode}
                        onChange={(e) => updateGradientMapSettings({ blendMode: e.target.value as GradientMapBlendMode })}
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
                      value={gradientMapSettings.opacity}
                      onChange={(value) => updateGradientMapSettings({ opacity: value })}
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
                          background: getGradientPreviewStyle(gradientMapSettings.stops)
                        }}
                      ></div>
                    </div>
                    
                    {/* Render dynamic gradient stops */}
                    {gradientMapSettings.stops.map((stop, index) => (
                      <div key={`stop-${index}`} className="mobile-control-group">
                        <div className="flex items-center gap-2 w-full">
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            style={{ width: '32px', minWidth: '32px', height: '32px' }}
                            value={stop.color}
                            onChange={(e) => {
                              const newStops = [...gradientMapSettings.stops];
                              newStops[index] = { ...stop, color: e.target.value };
                              updateGradientMapSettings({ stops: newStops });
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
                              const newStops = [...gradientMapSettings.stops];
                              newStops[index] = { ...stop, position: newPosition };
                              updateGradientMapSettings({ stops: newStops });
                            }}
                          />
                          <span className="text-xs text-[var(--text-secondary)] w-10 text-right">{stop.position}%</span>
                          {gradientMapSettings.stops.length > 2 && (
                            <button 
                              className="slider-button"
                              onClick={() => {
                                const newStops = gradientMapSettings.stops.filter((_, i) => i !== index);
                                updateGradientMapSettings({ stops: newStops });
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
                          const sortedStops = [...gradientMapSettings.stops].sort((a, b) => a.position - b.position);
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
                          const newStops = [...gradientMapSettings.stops, { position: newPosition, color: randomColor }];
                          updateGradientMapSettings({ stops: newStops });
                        }}
                      >
                        + Add Color Stop
                      </button>
                    </div>
                  </div>
                </div>
              );

            case 'threshold':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Threshold')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Threshold controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Mode</label>
                      <select 
                        className="mobile-select"
                        value={thresholdSettings.mode}
                        onChange={(e) => updateThresholdSettings({ mode: e.target.value as 'solid' | 'gradient' })}
                      >
                        <option value="solid">Solid</option>
                        <option value="gradient">Gradient</option>
                      </select>
                    </div>
                    <Slider
                      label="Threshold"
                      value={thresholdSettings.threshold}
                      onChange={(value) => updateThresholdSettings({ threshold: value })}
                      min={0}
                      max={255}
                      step={1}
                    />
                    
                    {thresholdSettings.mode === 'solid' && (
                      <>
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Dark Color</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={thresholdSettings.darkColor}
                            onChange={(e) => handleColorChange(updateThresholdSettings, 'darkColor', e.target.value)}
                          />
                        </div>
                        
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Light Color</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={thresholdSettings.lightColor}
                            onChange={(e) => handleColorChange(updateThresholdSettings, 'lightColor', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    {thresholdSettings.mode === 'gradient' && (
                      <>
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Dark Color Start</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={thresholdSettings.darkColorStart}
                            onChange={(e) => handleColorChange(updateThresholdSettings, 'darkColorStart', e.target.value)}
                          />
                        </div>
                        
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Dark Color End</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={thresholdSettings.darkColorEnd}
                            onChange={(e) => handleColorChange(updateThresholdSettings, 'darkColorEnd', e.target.value)}
                          />
                        </div>
                        
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Light Color Start</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={thresholdSettings.lightColorStart}
                            onChange={(e) => handleColorChange(updateThresholdSettings, 'lightColorStart', e.target.value)}
                          />
                        </div>
                        
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Light Color End</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={thresholdSettings.lightColorEnd}
                            onChange={(e) => handleColorChange(updateThresholdSettings, 'lightColorEnd', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );

            case 'dither':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Dithering')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Dither controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Color Mode</label>
                      <select 
                        className="mobile-select"
                        value={ditherSettings.colorMode}
                        onChange={(e) => updateDitherSettings({ colorMode: e.target.value as DitherColorMode })}
                      >
                        <option value="grayscale">Grayscale</option>
                        <option value="color">Color</option>
                        <option value="2-color">2 Color Palette</option>
                      </select>
                    </div>

                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Type</label>
                      <select 
                        className="mobile-select"
                        value={ditherSettings.type}
                        onChange={(e) => updateDitherSettings({ type: e.target.value as DitherType })}
                      >
                        <option value="ordered">Ordered</option>
                        <option value="floyd-steinberg">Floyd-Steinberg</option>
                        <option value="jarvis">Jarvis</option>
                        <option value="judice-ninke">Judice & Ninke</option>
                        <option value="stucki">Stucki</option>
                        <option value="burkes">Burkes</option>
                      </select>
                    </div>

                    <Slider
                      label="Resolution"
                      value={ditherSettings.resolution}
                      onChange={(value) => updateDitherSettings({ resolution: value })}
                      min={1}
                      max={100}
                      step={1}
                    />

                    <Slider
                      label="Threshold"
                      value={ditherSettings.threshold}
                      onChange={(value) => updateDitherSettings({ threshold: value })}
                      min={0}
                      max={255}
                      step={1}
                    />
                    
                    {ditherSettings.colorMode !== '2-color' && (
                      <Slider
                        label="Color Depth"
                        value={ditherSettings.colorDepth}
                        onChange={(value) => updateDitherSettings({ colorDepth: value })}
                        min={2}
                        max={256}
                        step={1}
                      />
                    )}

                    {ditherSettings.colorMode === '2-color' && (
                      <>
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Dark Color</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={ditherSettings.darkColor}
                            onChange={(e) => updateDitherSettings({ darkColor: e.target.value })}
                          />
                        </div>
                        
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Light Color</label>
                          <input 
                            type="color" 
                            className="mobile-color-picker"
                            value={ditherSettings.lightColor}
                            onChange={(e) => updateDitherSettings({ lightColor: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );

            case 'halftone':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Halftone Effect')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Halftone controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Shape</label>
                      <select 
                        className="mobile-select"
                        value={halftoneSettings.shape}
                        onChange={(e) => updateHalftoneSettings('shape', e.target.value as HalftoneShape)}
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
                        value={halftoneSettings.arrangement}
                        onChange={(e) => updateHalftoneSettings('arrangement', e.target.value as HalftoneArrangement)}
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
                      value={halftoneSettings.cellSize}
                      onChange={(value) => updateHalftoneSettings('cellSize', value)}
                      min={2}
                      max={30}
                      step={1}
                      unit="px"
                    />
                    <Slider
                      label="Dot Scale"
                      value={halftoneSettings.dotScaleFactor}
                      onChange={(value) => updateHalftoneSettings('dotScaleFactor', value)}
                      min={0.1}
                      max={1.5}
                      step={0.05}
                    />
                    <Slider
                      label="Mix Amount"
                      value={halftoneSettings.mix}
                      onChange={(value) => updateHalftoneSettings('mix', value)}
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
                          checked={halftoneSettings.colored}
                          onChange={(e) => updateHalftoneSettings('colored', e.target.checked)}
                        />
                        <span className="mobile-effect-toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Invert</label>
                      <label className="mobile-effect-toggle">
                        <input 
                          type="checkbox" 
                          checked={halftoneSettings.invertBrightness}
                          onChange={(e) => updateHalftoneSettings('invertBrightness', e.target.checked)}
                        />
                        <span className="mobile-effect-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              );

            case 'textDither':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Text Dither')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Text dither controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Text Pattern</label>
                      <input 
                        type="text" 
                        className="mobile-select"
                        value={textDitherSettings.text}
                        onChange={(e) => updateTextDitherSettings({ text: e.target.value })}
                      />
                    </div>
                    
                    <Slider
                      label="Font Size"
                      value={textDitherSettings.fontSize}
                      onChange={(value) => updateTextDitherSettings({ fontSize: value })}
                      min={6}
                      max={24}
                      step={1}
                      unit="px"
                    />
                    
                    <Slider
                      label="Resolution"
                      value={textDitherSettings.resolution}
                      onChange={(value) => updateTextDitherSettings({ resolution: value })}
                      min={0.5}
                      max={4}
                      step={0.1}
                    />
                    
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">Color Mode</label>
                      <select 
                        className="mobile-select"
                        value={textDitherSettings.colorMode}
                        onChange={(e) => updateTextDitherSettings({ colorMode: e.target.value as 'monochrome' | 'colored' })}
                      >
                        <option value="monochrome">Monochrome</option>
                        <option value="colored">Colored</option>
                      </select>
                    </div>
                    
                    <Slider
                      label="Contrast"
                      value={textDitherSettings.contrast}
                      onChange={(value) => updateTextDitherSettings({ contrast: value })}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </div>
              );

            case 'glitch':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Glitch Effects')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Main glitch controls */}
                    <div className="mobile-control-group">
                      <label className="mobile-control-label">General Glitch</label>
                      <div className="mobile-toggle-container">
                        <label className="mobile-effect-toggle">
                          <input 
                            type="checkbox" 
                            checked={glitchSettings.enabled}
                            onChange={(e) => updateGlitchSettings({ enabled: e.target.checked })}
                          />
                          <span className="mobile-effect-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {glitchSettings.enabled && (
                      <>
                        <Slider
                          label="Intensity"
                          value={glitchSettings.glitchIntensity}
                          onChange={(value) => updateGlitchSettings({ glitchIntensity: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                        <Slider
                          label="Density"
                          value={glitchSettings.glitchDensity}
                          onChange={(value) => updateGlitchSettings({ glitchDensity: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                        <Slider
                          label="Size"
                          value={glitchSettings.glitchSize}
                          onChange={(value) => updateGlitchSettings({ glitchSize: value })}
                          min={1}
                          max={50}
                          step={1}
                          unit="px"
                        />
                        
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Direction</label>
                          <select 
                            className="mobile-select"
                            value={glitchSettings.glitchDirection}
                            onChange={(e) => updateGlitchSettings({ glitchDirection: e.target.value as 'horizontal' | 'vertical' | 'both' })}
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
                            checked={glitchSettings.channelShiftEnabled}
                            onChange={(e) => updateGlitchSettings({ channelShiftEnabled: e.target.checked })}
                          />
                          <span className="mobile-effect-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {glitchSettings.channelShiftEnabled && (
                      <>
                        <Slider
                          label="Shift Amount"
                          value={glitchSettings.channelShiftAmount}
                          onChange={(value) => updateGlitchSettings({ channelShiftAmount: value })}
                          min={1}
                          max={20}
                          step={1}
                          unit="px"
                        />
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Shift Mode</label>
                          <select 
                            className="mobile-select"
                            value={glitchSettings.channelShiftMode}
                            onChange={(e) => updateGlitchSettings({ channelShiftMode: e.target.value as 'rgb' | 'rb' | 'rg' | 'gb' })}
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
                            checked={glitchSettings.noiseEnabled}
                            onChange={(e) => updateGlitchSettings({ noiseEnabled: e.target.checked })}
                          />
                          <span className="mobile-effect-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {glitchSettings.noiseEnabled && (
                      <Slider
                        label="Noise Amount"
                        value={glitchSettings.noiseAmount}
                        onChange={(value) => updateGlitchSettings({ noiseAmount: value })}
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
                            checked={glitchSettings.pixelSortingEnabled}
                            onChange={(e) => updateGlitchSettings({ pixelSortingEnabled: e.target.checked })}
                          />
                          <span className="mobile-effect-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {glitchSettings.pixelSortingEnabled && (
                      <>
                        <Slider
                          label="Threshold"
                          value={glitchSettings.pixelSortingThreshold}
                          onChange={(value) => updateGlitchSettings({ pixelSortingThreshold: value })}
                          min={0}
                          max={1}
                          step={0.01}
                        />
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Direction</label>
                          <select 
                            className="mobile-select"
                            value={glitchSettings.pixelSortingDirection}
                            onChange={(e) => updateGlitchSettings({ pixelSortingDirection: e.target.value as 'horizontal' | 'vertical' | 'both' })}
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
                            checked={glitchSettings.scanLinesEnabled}
                            onChange={(e) => updateGlitchSettings({ scanLinesEnabled: e.target.checked })}
                          />
                          <span className="mobile-effect-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {glitchSettings.scanLinesEnabled && (
                      <>
                        <Slider
                          label="Count"
                          value={glitchSettings.scanLinesCount}
                          onChange={(value) => updateGlitchSettings({ scanLinesCount: value })}
                          min={1}
                          max={100}
                          step={1}
                        />
                        <Slider
                          label="Intensity"
                          value={glitchSettings.scanLinesIntensity}
                          onChange={(value) => updateGlitchSettings({ scanLinesIntensity: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                        <div className="mobile-control-group">
                          <label className="mobile-control-label">Direction</label>
                          <select 
                            className="mobile-select"
                            value={glitchSettings.scanLinesDirection}
                            onChange={(e) => updateGlitchSettings({ scanLinesDirection: e.target.value as 'horizontal' | 'vertical' | 'both' })}
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
                            checked={glitchSettings.blocksEnabled}
                            onChange={(e) => updateGlitchSettings({ blocksEnabled: e.target.checked })}
                          />
                          <span className="mobile-effect-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    {glitchSettings.blocksEnabled && (
                      <>
                        <Slider
                          label="Size"
                          value={glitchSettings.blocksSize}
                          onChange={(value) => updateGlitchSettings({ blocksSize: value })}
                          min={5}
                          max={50}
                          step={1}
                          unit="px"
                        />
                        <Slider
                          label="Offset"
                          value={glitchSettings.blocksOffset}
                          onChange={(value) => updateGlitchSettings({ blocksOffset: value })}
                          min={0}
                          max={50}
                          step={1}
                          unit="%"
                        />
                        <Slider
                          label="Density"
                          value={glitchSettings.blocksDensity}
                          onChange={(value) => updateGlitchSettings({ blocksDensity: value })}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                        />
                      </>
                    )}
                  </div>
                </div>
              );

            case 'grid':
              return (
                <div key={instance.id} className="mobile-effect-section">
                  {renderSectionHeader(instance, 'Grid Transform')}
                  <div className={`mobile-effect-content ${openSection === instance.id ? 'open' : ''}`}>
                    {/* Grid controls */}
                    <Slider
                      label="Columns"
                      value={gridSettings.columns}
                      onChange={(value) => updateGridSettings('columns', value)}
                      min={1}
                      max={10}
                      step={1}
                    />
                    <Slider
                      label="Rows"
                      value={gridSettings.rows}
                      onChange={(value) => updateGridSettings('rows', value)}
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
                          checked={gridSettings.applyRotation}
                          onChange={(e) => updateGridSettings('applyRotation', e.target.checked)}
                        />
                        <span className="mobile-effect-toggle-slider"></span>
                      </label>
                    </div>
                    
                    {gridSettings.applyRotation && (
                      <Slider
                        label="Max Rotation"
                        value={gridSettings.maxRotation}
                        onChange={(value) => updateGridSettings('maxRotation', value)}
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
                          checked={gridSettings.splitEnabled}
                          onChange={(e) => updateGridSettings('splitEnabled', e.target.checked)}
                        />
                        <span className="mobile-effect-toggle-slider"></span>
                      </label>
                    </div>
                    
                    {gridSettings.splitEnabled && (
                      <>
                        <Slider
                          label="Split Probability"
                          value={gridSettings.splitProbability}
                          onChange={(value) => updateGridSettings('splitProbability', value)}
                          min={0}
                          max={1}
                          step={0.05}
                          unit=""
                        />
                        <Slider
                          label="Max Split Levels"
                          value={gridSettings.maxSplitLevels}
                          onChange={(value) => updateGridSettings('maxSplitLevels', value)}
                          min={1}
                          max={4}
                          step={1}
                        />
                        <Slider
                          label="Min Cell Size"
                          value={gridSettings.minCellSize}
                          onChange={(value) => updateGridSettings('minCellSize', value)}
                          min={10}
                          max={100}
                          step={5}
                          unit="px"
                        />
                      </>
                    )}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
        
        {/* Simple add effect title and buttons with no containers */}
        {effectInstances.length > 0 && (
          <div className="add-effect-label">Add Effect</div>
        )}
        {effectInstances.length === 0 && (
          <div className="add-first-effect-label">Add Effect</div>
        )}
        
        <div className="effect-buttons-container">
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('color')}
          >
            <FiPlus size={12} /> Color
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('blur')}
          >
            <FiPlus size={12} /> Blur
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('gradient')}
          >
            <FiPlus size={12} /> Gradient
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('threshold')}
          >
            <FiPlus size={12} /> Threshold
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('dither')}
          >
            <FiPlus size={12} /> Dither
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('halftone')}
          >
            <FiPlus size={12} /> Halftone
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('textDither')}
          >
            <FiPlus size={12} /> Text
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('glitch')}
          >
            <FiPlus size={12} /> Glitch
          </button>
          <button 
            className="plain-effect-btn" 
            onClick={() => addEffect('grid')}
          >
            <FiPlus size={12} /> Grid
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileControls 