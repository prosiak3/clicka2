import React from 'react';
import { Check } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function SettingsButton({
  onClick,
  selected = false,
  disabled = false,
  icon,
  title,
  description,
  className = ''
}: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
        selected
          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
          : disabled
          ? 'bg-gray-50 dark:bg-dark-700 border-gray-200 dark:border-dark-600 opacity-50 cursor-not-allowed'
          : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
      } ${className}`}
    >
      {icon && (
        <div className={`p-2 rounded-lg ${
          selected
            ? 'bg-indigo-100 dark:bg-indigo-800'
            : 'bg-gray-100 dark:bg-dark-700'
        }`}>
          {React.cloneElement(icon as React.ReactElement, {
            className: `w-6 h-6 ${
              selected
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400'
            }`
          })}
        </div>
      )}
      <div className="flex-1 text-left">
        <p className={`font-medium ${
          selected
            ? 'text-indigo-900 dark:text-indigo-200'
            : 'text-gray-900 dark:text-gray-200'
        }`}>
          {title}
        </p>
        {description && (
          <p className={`text-sm ${
            selected
              ? 'text-indigo-600 dark:text-indigo-300'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {description}
          </p>
        )}
      </div>
      {selected && (
        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-indigo-500 dark:border-indigo-400 bg-indigo-500 dark:bg-indigo-400">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
}