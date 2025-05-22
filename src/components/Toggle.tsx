import React from 'react';

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, value, onChange }) => {
  return (
    <div className="mobile-control-group">
      <label className="mobile-control-label">{label}</label>
      <label className="mobile-effect-toggle">
        <input 
          type="checkbox" 
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="mobile-effect-toggle-slider"></span>
      </label>
    </div>
  );
};

export default Toggle; 