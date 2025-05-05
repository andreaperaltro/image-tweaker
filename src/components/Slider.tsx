import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = ''
}) => {
  // Use a safe value for calculations
  const safeValue = value === undefined || value === null ? min : value;
  
  const handleIncrement = () => {
    const newValue = Math.min(max, safeValue + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, safeValue - step);
    onChange(newValue);
  };

  const formatValue = (val: number) => {
    // Handle undefined or null values
    if (val === undefined || val === null) {
      return '0';
    }
    
    if (step >= 1) return Math.round(val).toString();
    return val.toFixed(2);
  };

  return (
    <div className="slider-container">
      <div className="slider-label-container">
        <label className="slider-label">{label}</label>
        <span className="slider-value">{formatValue(value)}{unit}</span>
      </div>
      <div className="slider-controls">
        <button
          type="button"
          className="slider-button"
          onClick={handleDecrement}
          disabled={safeValue <= min}
        >
          -
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <button
          type="button"
          className="slider-button"
          onClick={handleIncrement}
          disabled={safeValue >= max}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Slider; 