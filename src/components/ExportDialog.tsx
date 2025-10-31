import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { FishingSession } from '../types';
import { format } from 'date-fns';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: FishingSession[];
}

type ExportFormat = 'gpx' | 'csv' | 'kml' | 'lowrance' | 'google';

export function ExportDialog({ isOpen, onClose, sessions }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gpx');

  if (!isOpen) return null;

  const exportData = () => {
    let content = '';
    let filename = `fishing-locations-${format(new Date(), 'yyyy-MM-dd')}`;
    let mimeType = 'text/plain';

    switch (selectedFormat) {
      case 'gpx':
        content = generateGPX(sessions);
        filename += '.gpx';
        mimeType = 'application/gpx+xml';
        break;
      case 'csv':
        content = generateCSV(sessions);
        filename += '.csv';
        mimeType = 'text/csv';
        break;
      case 'kml':
        content = generateKML(sessions);
        filename += '.kml';
        mimeType = 'application/vnd.google-earth.kml+xml';
        break;
      case 'lowrance':
        content = generateLowrance(sessions);
        filename += '.usr';
        mimeType = 'text/plain';
        break;
      case 'google':
        const url = generateGoogleMapsURL(sessions);
        window.open(url, '_blank');
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Export Location Data</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="gpx">GPX (Universal)</option>
                <option value="csv">CSV (Universal)</option>
                <option value="kml">KML (Google Earth)</option>
                <option value="lowrance">USR (Lowrance)</option>
                <option value="google">Google Maps</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {selectedFormat === 'gpx' && (
                <p>GPX format is compatible with most GPS devices and mapping software.</p>
              )}
              {selectedFormat === 'csv' && (
                <p>CSV format can be imported into spreadsheets and databases.</p>
              )}
              {selectedFormat === 'kml' && (
                <p>KML format is used by Google Earth and other mapping applications.</p>
              )}
              {selectedFormat === 'lowrance' && (
                <p>USR format is specific to Lowrance fish finders and chartplotters.</p>
              )}
              {selectedFormat === 'google' && (
                <p>Opens your fishing locations directly in Google Maps.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function generateGPX(sessions: FishingSession[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Clicka Fishing App">
  ${sessions.map(session => `
  <trk>
    <name>Fishing Session ${format(new Date(session.startTime), 'yyyy-MM-dd HH:mm')}</name>
    <trkseg>
      ${session.locations.map(loc => `
      <trkpt lat="${loc.latitude}" lon="${loc.longitude}">
        <time>${loc.timestamp}</time>
      </trkpt>`).join('')}
    </trkseg>
  </trk>
  ${session.catches.map(catch_ => `
  <wpt lat="${catch_.location.latitude}" lon="${catch_.location.longitude}">
    <name>${catch_.species}</name>
    <desc>Weight: ${catch_.weight}kg, Length: ${catch_.length}cm</desc>
    <time>${catch_.timestamp}</time>
  </wpt>`).join('')}
  `).join('')}
</gpx>`;
}

function generateCSV(sessions: FishingSession[]): string {
  const headers = 'Type,Date,Time,Latitude,Longitude,Species,Weight,Length\n';
  const rows = sessions.flatMap(session => [
    ...session.locations.map(loc => 
      `track,${format(new Date(loc.timestamp), 'yyyy-MM-dd')},${format(new Date(loc.timestamp), 'HH:mm:ss')},${loc.latitude},${loc.longitude},,,`
    ),
    ...session.catches.map(catch_ =>
      `catch,${format(new Date(catch_.timestamp), 'yyyy-MM-dd')},${format(new Date(catch_.timestamp), 'HH:mm:ss')},${catch_.location.latitude},${catch_.location.longitude},${catch_.species},${catch_.weight},${catch_.length}`
    )
  ]).join('\n');
  
  return headers + rows;
}

function generateKML(sessions: FishingSession[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Fishing Locations</name>
    ${sessions.map(session => `
    <Folder>
      <name>Session ${format(new Date(session.startTime), 'yyyy-MM-dd HH:mm')}</name>
      <Placemark>
        <name>Track</name>
        <LineString>
          <coordinates>
            ${session.locations.map(loc => `${loc.longitude},${loc.latitude}`).join(' ')}
          </coordinates>
        </LineString>
      </Placemark>
      ${session.catches.map(catch_ => `
      <Placemark>
        <name>${catch_.species}</name>
        <description>Weight: ${catch_.weight}kg, Length: ${catch_.length}cm</description>
        <Point>
          <coordinates>${catch_.location.longitude},${catch_.location.latitude}</coordinates>
        </Point>
      </Placemark>`).join('')}
    </Folder>`).join('')}
  </Document>
</kml>`;
}

function generateLowrance(sessions: FishingSession[]): string {
  let content = 'Clicka Fishing Locations\n';
  sessions.forEach(session => {
    content += `Session ${format(new Date(session.startTime), 'yyyy-MM-dd HH:mm')}\n`;
    session.catches.forEach(catch_ => {
      content += `${catch_.location.latitude},${catch_.location.longitude},${catch_.species},${catch_.weight}kg\n`;
    });
  });
  return content;
}

function generateGoogleMapsURL(sessions: FishingSession[]): string {
  const locations = sessions.flatMap(session => 
    session.catches.map(catch_ => `${catch_.location.latitude},${catch_.location.longitude}`)
  );
  return `https://www.google.com/maps/dir/${locations.join('/')}`;
}