'use client'

import React, { useState } from 'react'
import './MobileControls.css'
import { DitherSettings, DitherColorMode, DitherType } from './DitherUtils'
import { HalftoneSettings, HalftoneShape, HalftoneArrangement } from './Halftone'
import { ColorSettings } from './ColorUtils'
import { ThresholdSettings } from './ThresholdUtils'
import { GlitchSettings } from './GlitchUtils'
import { TextDitherSettings } from './TextDitherUtils'
import { GradientMapSettings, GradientMapBlendMode } from './GradientMapUtils'
import { GridSettings } from './Grid'

interface MobileControlsProps {
  ditherSettings: DitherSettings
  halftoneSettings: HalftoneSettings
  colorSettings: ColorSettings
  thresholdSettings: ThresholdSettings
  glitchSettings: GlitchSettings
  textDitherSettings: TextDitherSettings
  gradientMapSettings: GradientMapSettings
  gridSettings: GridSettings
  effectsOrder: string[]
  updateDitherSettings: (settings: Partial<DitherSettings>) => void
  updateHalftoneSettings: (setting: keyof HalftoneSettings, value: any) => void
  updateColorSettings: (setting: keyof ColorSettings, value: any) => void
  updateThresholdSettings: (settings: Partial<ThresholdSettings>) => void
  updateGlitchSettings: (settings: Partial<GlitchSettings>) => void
  updateTextDitherSettings: (settings: Partial<TextDitherSettings>) => void
  updateGradientMapSettings: (settings: Partial<GradientMapSettings>) => void
  updateGridSettings: (setting: keyof GridSettings, value: any) => void
  updateEffectsOrder: (newOrder: string[]) => void
  onResetImage: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onCropImage: () => void
}

const MobileControls: React.FC<MobileControlsProps> = ({
  ditherSettings,
  halftoneSettings,
  colorSettings,
  thresholdSettings,
  glitchSettings,
  textDitherSettings,
  gradientMapSettings,
  gridSettings,
  effectsOrder,
  updateDitherSettings,
  updateHalftoneSettings,
  updateColorSettings,
  updateThresholdSettings,
  updateGlitchSettings,
  updateTextDitherSettings,
  updateGradientMapSettings,
  updateGridSettings,
  updateEffectsOrder,
  onResetImage,
  onExportPng,
  onExportSvg,
  onCropImage
}) => {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const moveEffectUp = (effectType: string) => {
    const index = effectsOrder.indexOf(effectType)
    if (index > 0) {
      const newOrder = [...effectsOrder]
      // Swap with previous element
      ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      
      // Apply the update
      updateEffectsOrder(newOrder)
      
      // Visual feedback - briefly highlight/open the moved section
      setOpenSection(effectType)
    }
  }

  const moveEffectDown = (effectType: string) => {
    const index = effectsOrder.indexOf(effectType)
    if (index < effectsOrder.length - 1) {
      const newOrder = [...effectsOrder]
      // Swap with next element
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      
      // Apply the update
      updateEffectsOrder(newOrder)
      
      // Visual feedback - briefly highlight/open the moved section
      setOpenSection(effectType)
    }
  }

  // Function to render the reorder controls
  const renderReorderControls = (effectType: string) => {
    const index = effectsOrder.indexOf(effectType)
    const isFirst = index === 0
    const isLast = index === effectsOrder.length - 1

    return (
      <div className="reorder-buttons">
        <button
          className="reorder-btn"
          onClick={(e) => {
            e.stopPropagation()
            moveEffectUp(effectType)
          }}
          disabled={isFirst}
          aria-label="Move effect up"
          title="Move up in processing order"
        >
          ▲
        </button>
        <button
          className="reorder-btn"
          onClick={(e) => {
            e.stopPropagation()
            moveEffectDown(effectType)
          }}
          disabled={isLast}
          aria-label="Move effect down"
          title="Move down in processing order"
        >
          ▼
        </button>
      </div>
    )
  }

  // Helper function to render section headers with reorder controls
  const renderSectionHeader = (
    effectType: string,
    title: string,
    isEnabled: boolean,
    onToggleEnable: (isEnabled: boolean) => void
  ) => {
    const orderIndex = effectsOrder.indexOf(effectType)
    
    return (
      <div className={`mobile-effect-header ${openSection === effectType ? 'section-open' : ''}`}>
        <div className="flex items-center">
          {renderReorderControls(effectType)}
          <div className="flex items-center">
            <span className="effect-order-number">
              {orderIndex + 1}
            </span>
            <h3 
              className="mobile-effect-title"
              onClick={() => toggleSection(effectType)}
            >
              {title}
            </h3>
          </div>
        </div>
        <label className="mobile-effect-toggle">
          <input 
            type="checkbox" 
            checked={isEnabled}
            onChange={(e) => onToggleEnable(e.target.checked)}
          />
          <span className="mobile-effect-toggle-slider"></span>
        </label>
      </div>
    )
  }

  // Helper function to render a specific effect section by type
  const renderEffectSection = (effectType: string) => {
    switch (effectType) {
      case 'color':
        return (
          <div key="color" className="mobile-effect-section">
            {renderSectionHeader(
              'color',
              'Color Adjustments',
              colorSettings.enabled,
              (enabled) => updateColorSettings('enabled', enabled)
            )}
            <div className={`mobile-effect-content ${openSection === 'color' ? 'open' : ''}`}>
              {/* Color settings content */}
              <div className="mobile-control-group">
                <label className="mobile-control-label">Brightness ({colorSettings.brightness}%)</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={200}
                  value={colorSettings.brightness}
                  onChange={(e) => updateColorSettings('brightness', parseInt(e.target.value))}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Contrast ({colorSettings.contrast}%)</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={200}
                  value={colorSettings.contrast}
                  onChange={(e) => updateColorSettings('contrast', parseInt(e.target.value))}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Saturation ({colorSettings.saturation}%)</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={200}
                  value={colorSettings.saturation}
                  onChange={(e) => updateColorSettings('saturation', parseInt(e.target.value))}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Hue Shift ({colorSettings.hueShift}°)</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={-180}
                  max={180}
                  value={colorSettings.hueShift}
                  onChange={(e) => updateColorSettings('hueShift', parseInt(e.target.value))}
                />
              </div>
              
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
      
      case 'gradient':
        return (
          <div key="gradient" className="mobile-effect-section">
            {renderSectionHeader(
              'gradient',
              'Gradient Map',
              gradientMapSettings.enabled,
              (enabled) => updateGradientMapSettings({ enabled })
            )}
            <div className={`mobile-effect-content ${openSection === 'gradient' ? 'open' : ''}`}>
              {/* Gradient Map content */}
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
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Opacity ({Math.round(gradientMapSettings.opacity * 100)}%)</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={1}
                  step={0.01}
                  value={gradientMapSettings.opacity}
                  onChange={(e) => updateGradientMapSettings({ opacity: parseFloat(e.target.value) })}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Dark Color (0%)</label>
                <input 
                  type="color" 
                  className="mobile-color-picker"
                  value={gradientMapSettings.stops[0]?.color || '#000000'}
                  onChange={(e) => {
                    const newStops = [...gradientMapSettings.stops];
                    newStops[0] = { ...newStops[0], color: e.target.value };
                    updateGradientMapSettings({ stops: newStops });
                  }}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Mid Color (50%)</label>
                <input 
                  type="color" 
                  className="mobile-color-picker"
                  value={gradientMapSettings.stops[1]?.color || '#808080'}
                  onChange={(e) => {
                    const newStops = [...gradientMapSettings.stops];
                    if (newStops.length > 1) {
                      newStops[1] = { ...newStops[1], color: e.target.value };
                    } else {
                      newStops.push({ position: 50, color: e.target.value });
                    }
                    updateGradientMapSettings({ stops: newStops });
                  }}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Light Color (100%)</label>
                <input 
                  type="color" 
                  className="mobile-color-picker"
                  value={gradientMapSettings.stops[gradientMapSettings.stops.length - 1]?.color || '#ffffff'}
                  onChange={(e) => {
                    const newStops = [...gradientMapSettings.stops];
                    const lastIndex = newStops.length - 1;
                    if (lastIndex >= 0) {
                      newStops[lastIndex] = { ...newStops[lastIndex], color: e.target.value };
                      updateGradientMapSettings({ stops: newStops });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'threshold':
        return (
          <div key="threshold" className="mobile-effect-section">
            {renderSectionHeader(
              'threshold',
              'Threshold',
              thresholdSettings.enabled,
              (enabled) => updateThresholdSettings({ enabled })
            )}
            <div className={`mobile-effect-content ${openSection === 'threshold' ? 'open' : ''}`}>
              {/* Threshold content */}
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
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Threshold ({thresholdSettings.threshold})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={255}
                  value={thresholdSettings.threshold}
                  onChange={(e) => updateThresholdSettings({ threshold: parseInt(e.target.value) })}
                />
              </div>
              
              {thresholdSettings.mode === 'solid' && (
                <>
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Dark Color</label>
                    <input 
                      type="color" 
                      className="mobile-color-picker"
                      value={thresholdSettings.darkColor}
                      onChange={(e) => updateThresholdSettings({ darkColor: e.target.value })}
                    />
                  </div>
                  
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Light Color</label>
                    <input 
                      type="color" 
                      className="mobile-color-picker"
                      value={thresholdSettings.lightColor}
                      onChange={(e) => updateThresholdSettings({ lightColor: e.target.value })}
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
                      onChange={(e) => updateThresholdSettings({ darkColorStart: e.target.value })}
                    />
                  </div>
                  
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Dark Color End</label>
                    <input 
                      type="color" 
                      className="mobile-color-picker"
                      value={thresholdSettings.darkColorEnd}
                      onChange={(e) => updateThresholdSettings({ darkColorEnd: e.target.value })}
                    />
                  </div>
                  
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Light Color Start</label>
                    <input 
                      type="color" 
                      className="mobile-color-picker"
                      value={thresholdSettings.lightColorStart}
                      onChange={(e) => updateThresholdSettings({ lightColorStart: e.target.value })}
                    />
                  </div>
                  
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Light Color End</label>
                    <input 
                      type="color" 
                      className="mobile-color-picker"
                      value={thresholdSettings.lightColorEnd}
                      onChange={(e) => updateThresholdSettings({ lightColorEnd: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'dither':
        return (
          <div key="dither" className="mobile-effect-section">
            {renderSectionHeader(
              'dither',
              'Dithering',
              ditherSettings.enabled,
              (enabled) => updateDitherSettings({ enabled })
            )}
            <div className={`mobile-effect-content ${openSection === 'dither' ? 'open' : ''}`}>
              {/* Dithering content */}
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
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Resolution ({ditherSettings.resolution})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={1}
                  max={100}
                  value={ditherSettings.resolution}
                  onChange={(e) => updateDitherSettings({ resolution: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Threshold ({ditherSettings.threshold})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={255}
                  value={ditherSettings.threshold}
                  onChange={(e) => updateDitherSettings({ threshold: parseInt(e.target.value) })}
                />
              </div>
              
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
              
              {ditherSettings.colorMode !== '2-color' && (
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Color Depth ({ditherSettings.colorDepth})</label>
                  <input 
                    type="range" 
                    className="mobile-slider"
                    min={2}
                    max={256}
                    value={ditherSettings.colorDepth}
                    onChange={(e) => updateDitherSettings({ colorDepth: parseInt(e.target.value) })}
                  />
                </div>
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
          <div key="halftone" className="mobile-effect-section">
            {renderSectionHeader(
              'halftone',
              'Halftone Effect',
              halftoneSettings.enabled,
              (enabled) => updateHalftoneSettings('enabled', enabled)
            )}
            <div className={`mobile-effect-content ${openSection === 'halftone' ? 'open' : ''}`}>
              {/* Halftone content */}
              <div className="mobile-control-group">
                <label className="mobile-control-label">Cell Size ({halftoneSettings.cellSize})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={2}
                  max={30}
                  value={halftoneSettings.cellSize}
                  onChange={(e) => updateHalftoneSettings('cellSize', parseInt(e.target.value))}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Dot Scale ({halftoneSettings.dotScaleFactor.toFixed(2)})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={halftoneSettings.dotScaleFactor}
                  onChange={(e) => updateHalftoneSettings('dotScaleFactor', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Mix Amount ({halftoneSettings.mix}%)</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={100}
                  value={halftoneSettings.mix}
                  onChange={(e) => updateHalftoneSettings('mix', parseInt(e.target.value))}
                />
              </div>
              
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
      
      case 'glitch':
        return (
          <div key="glitch" className="mobile-effect-section">
            {renderSectionHeader(
              'glitch',
              'Glitch Effects',
              glitchSettings.masterEnabled,
              (enabled) => updateGlitchSettings({ masterEnabled: enabled })
            )}
            <div className={`mobile-effect-content ${openSection === 'glitch' ? 'open' : ''}`}>
              <div className="mobile-control-group">
                <label className="mobile-control-label">Intensity ({glitchSettings.glitchIntensity})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={100}
                  value={glitchSettings.glitchIntensity}
                  onChange={(e) => updateGlitchSettings({ glitchIntensity: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Density ({glitchSettings.glitchDensity})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={100}
                  value={glitchSettings.glitchDensity}
                  onChange={(e) => updateGlitchSettings({ glitchDensity: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );
      
      case 'textDither':
        return (
          <div key="textDither" className="mobile-effect-section">
            {renderSectionHeader(
              'textDither',
              'Text Dither Effect',
              textDitherSettings.enabled,
              (enabled) => updateTextDitherSettings({ enabled })
            )}
            <div className={`mobile-effect-content ${openSection === 'textDither' ? 'open' : ''}`}>
              <div className="mobile-control-group">
                <label className="mobile-control-label">Text Pattern</label>
                <input 
                  type="text" 
                  className="mobile-select"
                  value={textDitherSettings.text}
                  onChange={(e) => updateTextDitherSettings({ text: e.target.value })}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Font Size ({textDitherSettings.fontSize})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={6}
                  max={24}
                  value={textDitherSettings.fontSize}
                  onChange={(e) => updateTextDitherSettings({ fontSize: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Resolution ({textDitherSettings.resolution})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0.5}
                  max={4}
                  step={0.1}
                  value={textDitherSettings.resolution}
                  onChange={(e) => updateTextDitherSettings({ resolution: parseFloat(e.target.value) })}
                />
              </div>
              
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
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Contrast ({textDitherSettings.contrast})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={0}
                  max={2}
                  step={0.1}
                  value={textDitherSettings.contrast}
                  onChange={(e) => updateTextDitherSettings({ contrast: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );

      case 'grid':
        return (
          <div key="grid" className="mobile-effect-section">
            {renderSectionHeader(
              'grid',
              'Grid Effects',
              gridSettings.enabled,
              (enabled) => updateGridSettings('enabled', enabled)
            )}
            <div className={`mobile-effect-content ${openSection === 'grid' ? 'open' : ''}`}>
              <div className="mobile-control-group">
                <label className="mobile-control-label">Columns ({gridSettings.columns})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={1}
                  max={10}
                  value={gridSettings.columns}
                  onChange={(e) => updateGridSettings('columns', parseInt(e.target.value))}
                />
              </div>
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Rows ({gridSettings.rows})</label>
                <input 
                  type="range" 
                  className="mobile-slider"
                  min={1}
                  max={10}
                  value={gridSettings.rows}
                  onChange={(e) => updateGridSettings('rows', parseInt(e.target.value))}
                />
              </div>
              
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
                <div className="mobile-control-group">
                  <label className="mobile-control-label">Max Rotation ({gridSettings.maxRotation}°)</label>
                  <input 
                    type="range" 
                    className="mobile-slider"
                    min={0}
                    max={45}
                    value={gridSettings.maxRotation}
                    onChange={(e) => updateGridSettings('maxRotation', parseInt(e.target.value))}
                  />
                </div>
              )}
              
              <div className="mobile-control-group">
                <label className="mobile-control-label">Split Enabled</label>
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
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Split Probability ({gridSettings.splitProbability})</label>
                    <input 
                      type="range" 
                      className="mobile-slider"
                      min={0}
                      max={1}
                      step={0.05}
                      value={gridSettings.splitProbability}
                      onChange={(e) => updateGridSettings('splitProbability', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Max Split Levels ({gridSettings.maxSplitLevels})</label>
                    <input 
                      type="range" 
                      className="mobile-slider"
                      min={1}
                      max={5}
                      value={gridSettings.maxSplitLevels}
                      onChange={(e) => updateGridSettings('maxSplitLevels', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="mobile-control-group">
                    <label className="mobile-control-label">Min Cell Size ({gridSettings.minCellSize})</label>
                    <input 
                      type="range" 
                      className="mobile-slider"
                      min={10}
                      max={200}
                      value={gridSettings.minCellSize}
                      onChange={(e) => updateGridSettings('minCellSize', parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      
      // Main component return
      default:
        return null;
    }
  };

  return (
    <div className="mobile-controls">
      <div className="mobile-controls-panel">
        <div className="mobile-controls-header">
          <h2 className="mobile-controls-title">Image Controls</h2>
        </div>

        {/* Render effects in the order specified by effectsOrder */}
        {effectsOrder.map((effectType) => renderEffectSection(effectType))}

        {/* Crop Image Button */}
        <div className="mobile-effect-section">
          <button 
            onClick={onCropImage}
            className="mobile-action-button"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          >
            Crop Image
          </button>
        </div>

        {/* Controls Actions - Moved below Crop button */}
        <div className="mobile-effect-section">
          <div className="mobile-controls-actions">
            <button 
              onClick={onResetImage}
              className="mobile-action-button"
            >
              Reset
            </button>
            <button 
              onClick={onExportPng}
              className="mobile-action-button"
            >
              PNG
            </button>
            <button 
              onClick={onExportSvg}
              className="mobile-action-button"
            >
              SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileControls 