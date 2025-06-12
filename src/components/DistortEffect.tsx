import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Slider from './Slider';
import { DistortSettings } from '../types';
import Checkbox from './Checkbox';

interface DistortEffectProps {
  settings: DistortSettings;
  onChange: (settings: DistortSettings) => void;
}

export const DistortEffect: React.FC<DistortEffectProps> = ({ settings, onChange }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        onChange({
          ...settings,
          displacementMap: reader.result as string,
          preserveAspectRatio: true, // Default to preserving aspect ratio
          scale: 1.0, // Default scale
          offsetX: 0, // Default X offset
          offsetY: 0  // Default Y offset
        });
      };
      
      reader.readAsDataURL(file);
    }
  }, [settings, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxFiles: 1
  });

  const handleXAmountChange = (value: number) => {
    onChange({
      ...settings,
      xAmount: value
    });
  };

  const handleYAmountChange = (value: number) => {
    onChange({
      ...settings,
      yAmount: value
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border-color)] hover:border-emerald-500/50'}`}
      >
        <input {...getInputProps()} />
        <p className="text-[var(--text-primary)] pp-mondwest-font text-sm">
          {settings.displacementMap ? 'Displacement map loaded. Drop a new one to replace.' : 'Drop a grayscale image here to use as displacement map'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Slider
          label="X Distortion"
          value={settings.xAmount}
          onChange={handleXAmountChange}
          min={-500}
          max={500}
          step={1}
          showValue={true}
        />

        <Slider
          label="Y Distortion"
          value={settings.yAmount}
          onChange={handleYAmountChange}
          min={-500}
          max={500}
          step={1}
          showValue={true}
        />

        {settings.displacementMap && (
          <>
            <div className="border-t border-[var(--border-color)] my-2"></div>
            
            <Checkbox
              label="Preserve Aspect Ratio"
              checked={settings.preserveAspectRatio}
              onChange={(value) => onChange({ ...settings, preserveAspectRatio: value })}
            />

            <Slider
              label="Scale"
              value={settings.scale}
              onChange={(value) => onChange({ ...settings, scale: value })}
              min={0.1}
              max={2.0}
              step={0.1}
              showValue={true}
            />

            <Slider
              label="X Position"
              value={settings.offsetX}
              onChange={(value) => onChange({ ...settings, offsetX: value })}
              min={-100}
              max={100}
              step={1}
              showValue={true}
            />

            <Slider
              label="Y Position"
              value={settings.offsetY}
              onChange={(value) => onChange({ ...settings, offsetY: value })}
              min={-100}
              max={100}
              step={1}
              showValue={true}
            />
          </>
        )}
      </div>
    </div>
  );
}; 