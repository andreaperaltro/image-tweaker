import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ShapeGridSettings, ShapeType } from './ShapeGridEffect';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';

interface ShapeGridControlsProps {
  settings: ShapeGridSettings;
  onSettingsChange: (settings: Partial<ShapeGridSettings>) => void;
}

export default function ShapeGridControls({ settings, onSettingsChange }: ShapeGridControlsProps) {
  const [isShapesOpen, setIsShapesOpen] = useState(true);
  const availableShapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross', 'heart'];

  const handleShapeToggle = (shape: ShapeType) => {
    const newShapes = settings.shapes.includes(shape)
      ? settings.shapes.filter(s => s !== shape)
      : [...settings.shapes, shape];
    
    // Ensure at least one shape is selected
    if (newShapes.length > 0) {
      onSettingsChange({ shapes: newShapes });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Grid Size</label>
        <input
          type="range"
          min="2"
          max="50"
          value={settings.gridSize}
          onChange={(e) => onSettingsChange({ gridSize: Number(e.target.value) })}
          className="w-full"
        />
        <div className="text-sm text-gray-500">{settings.gridSize}px</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Threshold</label>
        <input
          type="range"
          min="0"
          max="255"
          value={settings.threshold}
          onChange={(e) => onSettingsChange({ threshold: Number(e.target.value) })}
          className="w-full"
        />
        <div className="text-sm text-gray-500">{settings.threshold}</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Merge Levels</label>
        <input
          type="range"
          min="0"
          max="5"
          value={settings.mergeLevels}
          onChange={(e) => onSettingsChange({ mergeLevels: Number(e.target.value) })}
          className="w-full"
        />
        <div className="text-sm text-gray-500">{settings.mergeLevels}</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Background Color</label>
        <div className="relative">
          <input 
            type="color" 
            className="mobile-color-picker"
            value={settings.colors.background}
            onChange={(e) => onSettingsChange({ 
              colors: { ...settings.colors, background: e.target.value } 
            })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Pattern Color</label>
        <div className="relative">
          <input 
            type="color" 
            className="mobile-color-picker"
            value={settings.colors.foreground}
            onChange={(e) => onSettingsChange({ 
              colors: { ...settings.colors, foreground: e.target.value } 
            })}
          />
        </div>
      </div>

      <div className="mobile-control-section">
        <button
          className="mobile-control-section-header"
          onClick={() => setIsShapesOpen(!isShapesOpen)}
        >
          <span>Available Shapes</span>
          {isShapesOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
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
                    onChange={() => handleShapeToggle(shape)}
                  />
                  <span className="mobile-effect-toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mobile-control-group">
        <label className="mobile-control-label">Random Rotation</label>
        <label className="mobile-effect-toggle">
          <input 
            type="checkbox" 
            checked={settings.randomRotation}
            onChange={(e) => onSettingsChange({ randomRotation: e.target.checked })}
          />
          <span className="mobile-effect-toggle-slider"></span>
        </label>
      </div>
    </div>
  );
} 