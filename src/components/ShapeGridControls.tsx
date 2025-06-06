import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { ShapeGridSettings } from './ShapeGridEffect';

interface ShapeGridControlsProps {
  settings: ShapeGridSettings;
  onSettingsChange: (settings: Partial<ShapeGridSettings>) => void;
}

export default function ShapeGridControls({ settings, onSettingsChange }: ShapeGridControlsProps) {
  const availableShapes = ['circle', 'square', 'triangle', 'cross'] as const;

  const handleShapeToggle = (shape: typeof availableShapes[number]) => {
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
        <label className="block text-sm font-medium mb-2">Background Color</label>
        <div className="relative">
          <div
            className="w-8 h-8 rounded border cursor-pointer"
            style={{ backgroundColor: settings.colors.background }}
            onClick={() => onSettingsChange({ 
              colors: { ...settings.colors, background: settings.colors.background } 
            })}
          />
          <HexColorPicker
            color={settings.colors.background}
            onChange={(color) => onSettingsChange({ 
              colors: { ...settings.colors, background: color } 
            })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Foreground Color</label>
        <div className="relative">
          <div
            className="w-8 h-8 rounded border cursor-pointer"
            style={{ backgroundColor: settings.colors.foreground }}
            onClick={() => onSettingsChange({ 
              colors: { ...settings.colors, foreground: settings.colors.foreground } 
            })}
          />
          <HexColorPicker
            color={settings.colors.foreground}
            onChange={(color) => onSettingsChange({ 
              colors: { ...settings.colors, foreground: color } 
            })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Shapes</label>
        <div className="flex flex-wrap gap-2">
          {availableShapes.map((shape) => (
            <button
              key={shape}
              className={`px-3 py-1 rounded ${
                settings.shapes.includes(shape)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleShapeToggle(shape)}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 