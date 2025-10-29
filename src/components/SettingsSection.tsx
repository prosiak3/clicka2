import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SettingsSection({
  title,
  icon,
  children,
  isExpanded,
  onToggle
}: SettingsSectionProps) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-100 dark:border-dark-600 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {icon}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-50">{title}</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-6 border-t border-gray-100 dark:border-dark-600">
          {children}
        </div>
      )}
    </div>
  );
}