import React, { useRef, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
  hideLabelContainer?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  showValue = true,
  hideLabelContainer = false
}) => {
  // Store the initial value when the component mounts
  const initialValueRef = useRef<number>(value);

  // Update the initial value if it changes (this usually won't happen)
  useEffect(() => {
    if (initialValueRef.current === undefined) {
      initialValueRef.current = value;
    }
  }, []);

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

  const handleReset = () => {
    onChange(initialValueRef.current);
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
      {!hideLabelContainer && (
        <div className="slider-label-container">
          <label className="slider-label text-[var(--text-primary)] pp-mondwest-font font-medium">{label}</label>
          <div className="flex items-center gap-2">
            {showValue && (
              <span className="slider-value text-[var(--text-primary)] pp-mondwest-font font-medium">{formatValue(value)}{unit}</span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="reset-button text-xs text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Reset to default value"
            >
              ↺
            </button>
          </div>
        </div>
      )}
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