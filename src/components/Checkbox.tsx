import React from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
      />
      <label className="text-sm text-[var(--text-primary)]">{label}</label>
    </div>
  );
};

export default Checkbox; 