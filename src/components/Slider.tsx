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
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const formatValue = (val: number) => {
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
          disabled={value <= min}
        >
          -
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <button
          type="button"
          className="slider-button"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Slider; 