import React from 'react';
import { TruchetSettings, TruchetTileType } from './TruchetEffect';

interface TruchetControlsProps {
  settings: TruchetSettings;
  onChange: (settings: TruchetSettings) => void;
}

export function TruchetControls({ settings, onChange }: TruchetControlsProps) {
  const updateSettings = (updates: Partial<TruchetSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const toggleTileType = (type: TruchetTileType) => {
    const newTypes = settings.tileTypes.includes(type)
      ? settings.tileTypes.filter(t => t !== type)
      : [...settings.tileTypes, type];
    updateSettings({ tileTypes: newTypes });
  };

  return (
    <div className="space-y-4">
      {/* Tile Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Grid Size</label>
        <input
          type="range"
          min={3}
          max={30}
          step={1}
          value={settings.tileSize}
          onChange={e => updateSettings({ tileSize: Number(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="text-xs text-gray-500">{settings.tileSize}px</div>
      </div>

      {/* Pattern Density */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Pattern Density</label>
        <input
          type="range"
          min={0}
          max={200}
          value={settings.patternDensity}
          onChange={e => updateSettings({ patternDensity: Number(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="text-xs text-gray-500">{settings.patternDensity}%</div>
      </div>

      {/* Brightness Threshold */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Brightness Threshold</label>
        <input
          type="range"
          min={0}
          max={255}
          value={settings.threshold}
          onChange={e => updateSettings({ threshold: Number(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="text-xs text-gray-500">{settings.threshold}</div>
      </div>

      {/* Line Width */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Line Width</label>
        <input
          type="range"
          min={1}
          max={3}
          value={settings.lineWidth}
          onChange={e => updateSettings({ lineWidth: Number(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="text-xs text-gray-500">{settings.lineWidth}px</div>
      </div>

      {/* Tile Types */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tile Types</label>
        <div className="grid grid-cols-2 gap-2">
          {(['diagonal', 'quarter-circles', 'triangles'] as TruchetTileType[]).map(type => (
            <button
              key={type}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                settings.tileTypes.includes(type)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
              onClick={() => toggleTileType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Colors</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Dark Color</label>
            <input
              type="color"
              value={settings.colors.background}
              onChange={e => updateSettings({ colors: { ...settings.colors, background: e.target.value } })}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Light Color</label>
            <input
              type="color"
              value={settings.colors.foreground}
              onChange={e => updateSettings({ colors: { ...settings.colors, foreground: e.target.value } })}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 