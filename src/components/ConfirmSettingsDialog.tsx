import React from 'react';
import { Check, X } from 'lucide-react';

interface ConfirmSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: {
    theme?: boolean;
    language?: boolean;
    measurementSystem?: boolean;
    notifications?: boolean;
    fishSpecies?: boolean;
    display?: boolean;
    tracking?: boolean;
  };
}

export function ConfirmSettingsDialog({
  isOpen,
  onClose,
  onConfirm,
  changes
}: ConfirmSettingsDialogProps) {
  if (!isOpen) return null;

  const hasChanges = Object.values(changes).some(value => value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">Save Changes</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-dark-300" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 dark:text-dark-200 mb-4">
            The following settings have been modified:
          </p>
          
          <div className="space-y-2">
            {changes.theme && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Theme</span>
              </div>
            )}
            {changes.language && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Language</span>
              </div>
            )}
            {changes.measurementSystem && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Measurement System</span>
              </div>
            )}
            {changes.notifications && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Notifications</span>
              </div>
            )}
            {changes.fishSpecies && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Fish Species</span>
              </div>
            )}
            {changes.display && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Display Settings</span>
              </div>
            )}
            {changes.tracking && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-200">
                <Check className="w-4 h-4 text-green-500" />
                <span>Tracking Interval</span>
              </div>
            )}
          </div>

          {!hasChanges && (
            <p className="text-gray-500 dark:text-dark-300 italic mt-2">
              No changes to save
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 dark:bg-dark-700 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-200 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!hasChanges}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}