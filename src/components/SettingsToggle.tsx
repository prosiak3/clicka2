import React from 'react';

interface SettingsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SettingsToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false
}: SettingsToggleProps) {
  return (
    <label className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`}>
      <div className="flex-1">
        <span className="font-medium text-gray-900 dark:text-dark-50">{label}</span>
        {description && (
          <p className="text-sm text-gray-500 dark:text-dark-300 mt-1">{description}</p>
        )}
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`w-14 h-8 rounded-full transition-colors ${
          checked ? 'bg-indigo-500' : 'bg-gray-300'
        }`}>
          <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </div>
      </div>
    </label>
  );
}