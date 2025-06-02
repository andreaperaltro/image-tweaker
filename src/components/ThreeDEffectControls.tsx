import React from 'react';
import { ThreeDEffectSettings } from '../types';
import Slider from './Slider';

interface ThreeDEffectControlsProps {
  settings: ThreeDEffectSettings;
  onChange: (settings: ThreeDEffectSettings) => void;
}

export const ThreeDEffectControls: React.FC<ThreeDEffectControlsProps> = ({ settings, onChange }) => {
  const handleChange = (key: keyof ThreeDEffectSettings, value: number | string) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <>
      <div className="mobile-control-group">
        <Slider
          label="Rotation X"
          value={settings.rotationX}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(value: number) => handleChange('rotationX', value)}
        />
      </div>
      <div className="mobile-control-group">
        <Slider
          label="Rotation Y"
          value={settings.rotationY}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(value: number) => handleChange('rotationY', value)}
        />
      </div>
      <div className="mobile-control-group">
        <Slider
          label="Rotation Z"
          value={settings.rotationZ}
          min={-180}
          max={180}
          step={1}
          unit="°"
          onChange={(value: number) => handleChange('rotationZ', value)}
        />
      </div>
      <div className="mobile-control-group">
        <Slider
          label="Scale"
          value={settings.scale}
          min={0.1}
          max={2}
          step={0.01}
          unit="x"
          onChange={(value: number) => handleChange('scale', value)}
        />
      </div>
      <div className="mobile-control-group">
        <label>Background Color</label>
        <input
          type="color"
          value={settings.backgroundColor}
          onChange={(e) => handleChange('backgroundColor', e.target.value)}
          style={{ width: '100%', height: '40px' }}
        />
      </div>
    </>
  );
}; 