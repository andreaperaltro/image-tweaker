'use client';

import React from 'react';
import { ImageParams } from './ImageEditor';
import { HalftoneArrangement, HalftoneShape } from '@/utils/imageUtils';

interface ControlPanelProps {
  params: ImageParams;
  onChange: (newParams: Partial<ImageParams>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, onChange }) => {
  // Helper function to create a slider control
  const Slider = ({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-600 w-12 text-right">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
    </div>
  );

  // Helper function to create a color picker control
  const ColorPicker = ({
    label,
    value,
    onChange
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border rounded"
        />
      </div>
    </div>
  );

  // Helper function to create a select control
  const Select = ({
    label,
    value,
    onChange,
    options
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-sm border rounded"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Helper function to create a checkbox control
  const Checkbox = ({
    label,
    checked,
    onChange
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="mb-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Canvas Size Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Canvas Size</h3>
        <Checkbox
          label="Auto Canvas Size"
          checked={params.autoCanvasSize}
          onChange={(value) => onChange({ autoCanvasSize: value })}
        />
        {!params.autoCanvasSize && (
          <>
            <Slider
              label="Width"
              value={params.canvasWidth}
              onChange={(value) => onChange({ canvasWidth: value })}
              min={100}
              max={4096}
              step={1}
            />
            <Slider
              label="Height"
              value={params.canvasHeight}
              onChange={(value) => onChange({ canvasHeight: value })}
              min={100}
              max={4096}
              step={1}
            />
            <Checkbox
              label="Lock Aspect Ratio"
              checked={params.lockRatio}
              onChange={(value) => onChange({ lockRatio: value })}
            />
            {params.lockRatio && (
              <Select
                label="Aspect Ratio"
                value={params.selectedRatio}
                onChange={(value) => onChange({ selectedRatio: value })}
                options={[
                  { value: '1:1', label: '1:1 Square' },
                  { value: '4:3', label: '4:3 Standard' },
                  { value: '16:9', label: '16:9 Widescreen' },
                  { value: '21:9', label: '21:9 Ultrawide' },
                ]}
              />
            )}
          </>
        )}
      </div>

      {/* Displacement Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Displacement</h3>
        <Slider
          label="Noise Scale"
          value={params.noiseScale}
          onChange={(value) => onChange({ noiseScale: value })}
          min={0}
          max={1}
          step={0.01}
        />
        <Slider
          label="X Displacement"
          value={params.displaceAmountX}
          onChange={(value) => onChange({ displaceAmountX: value })}
          min={-100}
          max={100}
          step={1}
        />
        <Slider
          label="Y Displacement"
          value={params.displaceAmountY}
          onChange={(value) => onChange({ displaceAmountY: value })}
          min={-100}
          max={100}
          step={1}
        />
      </div>

      {/* Color Effects */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Color Effects</h3>
        <Slider
          label="Color Shift"
          value={params.colorShiftAmount}
          onChange={(value) => onChange({ colorShiftAmount: value })}
          min={-180}
          max={180}
          step={1}
        />
        <Slider
          label="Saturation Variation"
          value={params.saturationVariation}
          onChange={(value) => onChange({ saturationVariation: value })}
          min={-1}
          max={1}
          step={0.01}
        />
        <Checkbox
          label="Enable Posterization"
          checked={params.enablePosterization}
          onChange={(value) => onChange({ enablePosterization: value })}
        />
        {params.enablePosterization && (
          <Slider
            label="Posterization Levels"
            value={params.posterizeLevels}
            onChange={(value) => onChange({ posterizeLevels: value })}
            min={2}
            max={8}
            step={1}
          />
        )}
      </div>

      {/* Colorization Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Colorization</h3>
        <Checkbox
          label="Enable Colorization"
          checked={params.enableColorization}
          onChange={(value) => onChange({ enableColorization: value })}
        />
        {params.enableColorization && (
          <>
            <ColorPicker
              label="Low Color"
              value={params.thresholdColorLow}
              onChange={(value) => onChange({ thresholdColorLow: value })}
            />
            <ColorPicker
              label="Mid Color"
              value={params.midColor}
              onChange={(value) => onChange({ midColor: value })}
            />
            <ColorPicker
              label="High Color"
              value={params.thresholdColorHigh}
              onChange={(value) => onChange({ thresholdColorHigh: value })}
            />
          </>
        )}
      </div>

      {/* Halftone Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Halftone Effect</h3>
        <Checkbox
          label="Enable Halftone"
          checked={params.halftoneEnabled}
          onChange={(value) => onChange({ halftoneEnabled: value })}
        />
        {params.halftoneEnabled && (
          <>
            <Slider
              label="Cell Size"
              value={params.halftoneCellSize}
              onChange={(value) => onChange({ halftoneCellSize: value })}
              min={2}
              max={50}
              step={1}
            />
            <Slider
              label="Mix Amount"
              value={params.halftoneMix}
              onChange={(value) => onChange({ halftoneMix: value })}
              min={0}
              max={1}
              step={0.01}
            />
            <Checkbox
              label="Colored Dots"
              checked={params.halftoneColored}
              onChange={(value) => onChange({ halftoneColored: value })}
            />
            <Select
              label="Arrangement"
              value={params.halftoneArrangement}
              onChange={(value) => onChange({ halftoneArrangement: value as HalftoneArrangement })}
              options={[
                { value: 'grid', label: 'Grid' },
                { value: 'hexagonal', label: 'Hexagonal' },
                { value: 'circular', label: 'Circular' },
              ]}
            />
            <Select
              label="Dot Shape"
              value={params.halftoneShape}
              onChange={(value) => onChange({ halftoneShape: value as HalftoneShape })}
              options={[
                { value: 'circle', label: 'Circle' },
                { value: 'square', label: 'Square' },
                { value: 'diamond', label: 'Diamond' },
                { value: 'triangle', label: 'Triangle' },
              ]}
            />
          </>
        )}
      </div>

      {/* Background Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Background</h3>
        <Select
          label="Background Type"
          value={params.backgroundType}
          onChange={(value) => onChange({ backgroundType: value })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'solid', label: 'Solid Color' },
            { value: 'gradient', label: 'Gradient' },
          ]}
        />
        {params.backgroundType === 'solid' && (
          <ColorPicker
            label="Background Color"
            value={params.backgroundColor}
            onChange={(value) => onChange({ backgroundColor: value })}
          />
        )}
        {params.backgroundType === 'gradient' && (
          <>
            <ColorPicker
              label="Gradient Start"
              value={params.backgroundGradientStart}
              onChange={(value) => onChange({ backgroundGradientStart: value })}
            />
            <ColorPicker
              label="Gradient End"
              value={params.backgroundGradientEnd}
              onChange={(value) => onChange({ backgroundGradientEnd: value })}
            />
            <Slider
              label="Gradient Angle"
              value={params.backgroundGradientAngle}
              onChange={(value) => onChange({ backgroundGradientAngle: value })}
              min={0}
              max={360}
              step={1}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ControlPanel; 