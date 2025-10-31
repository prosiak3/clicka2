import React from 'react';
import { MapPin, X } from 'lucide-react';

interface GpsPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
}

export function GpsPermissionDialog({
  isOpen,
  onClose,
  onRequestPermission
}: GpsPermissionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Location Access Required</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Clicka needs access to your location to:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Track your fishing spots</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Get local weather conditions</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span>Save catch locations</span>
            </li>
          </ul>
          <p className="text-sm text-gray-500 mb-4">
            Your location data is only used while the app is active and never shared with third parties.
          </p>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Later
          </button>
          <button
            onClick={onRequestPermission}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable Location Access
          </button>
        </div>
      </div>
    </div>
  );
}