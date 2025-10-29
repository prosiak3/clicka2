import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { MapPin, Fish, Flag } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import { Location } from '../types';
import { useSettings } from '../utils/settings';

interface MapProps {
  center: [number, number];
  catches?: Array<{
    location: { latitude: number; longitude: number; timestamp: string };
    species: string;
  }>;
  showRadius?: boolean;
  height?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    source: 'gps' | 'network' | 'ip';
  };
  locations?: Location[];
  onAddWaypoint?: (location: Location) => void;
  isActive?: boolean;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function MapClickHandler({ onAddWaypoint }: { onAddWaypoint?: (location: Location) => void }) {
  useMapEvents({
    click: (e) => {
      if (onAddWaypoint) {
        onAddWaypoint({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          timestamp: new Date().toISOString(),
          isManualWaypoint: true
        });
      }
    }
  });
  return null;
}

const waypointIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createFlagIcon = () => {
  return new DivIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    html: `
      <div class="relative w-8 h-8">
        <div class="absolute inset-0 bg-red-500 rounded-full opacity-20"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </div>
      </div>
    `
  });
};

const createFishIcon = () => {
  return new DivIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div class="relative w-8 h-8">
        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-20"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
            <path d="M12 20l-3-3h6l-3 3z"/>
            <path d="M16.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z"/>
            <path d="M18 9l-3 3"/>
          </svg>
        </div>
      </div>
    `
  });
};

const createLocationIcon = (source: 'gps' | 'network' | 'ip') => {
  const color = source === 'gps' ? 'blue' : source === 'network' ? 'orange' : 'gray';
  
  return new DivIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div class="relative w-8 h-8">
        <div class="absolute inset-0 bg-${color}-500 rounded-full opacity-20 animate-ping"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-4 h-4 bg-${color}-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      </div>
    `
  });
};

const MAP_LAYERS = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community'
  }
} as const;

export function Map({ 
  center, 
  catches = [], 
  showRadius = false,
  height = '200px',
  currentLocation,
  locations = [],
  onAddWaypoint,
  isActive = false
}: MapProps) {
  const settings = useSettings();
  const mapType = settings.display.mapType;

  const getWaypoints = () => {
    if (locations.length === 0) return [];

    const waypoints: typeof locations = [];
    const startTime = new Date(locations[0].timestamp);
    
    locations.forEach((location, index) => {
      const locationTime = new Date(location.timestamp);
      const minutesSinceStart = differenceInMinutes(locationTime, startTime);

      if (index === 0 || 
          minutesSinceStart % 5 === 0 || 
          index === locations.length - 1 ||
          location.isManualWaypoint) {
        waypoints.push(location);
      }
    });

    return waypoints;
  };

  const routeCoordinates = locations.map(loc => [loc.latitude, loc.longitude] as [number, number]);
  const waypoints = getWaypoints();

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height, width: '100%' }}
        className="rounded-lg z-0"
        zoomControl={false}
      >
        <TileLayer
          url={MAP_LAYERS[mapType].url}
          attribution={MAP_LAYERS[mapType].attribution}
        />
        <MapUpdater center={center} />
        
        {isActive && onAddWaypoint && <MapClickHandler onAddWaypoint={onAddWaypoint} />}
        
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="blue"
            weight={3}
            opacity={0.6}
          />
        )}

        {waypoints.map((waypoint) => (
          <Marker
            key={`waypoint-${waypoint.timestamp}`}
            position={[waypoint.latitude, waypoint.longitude]}
            icon={waypoint.isManualWaypoint ? createFlagIcon() : waypointIcon}
          />
        ))}

        {catches.map((catch_, index) => (
          <React.Fragment key={index}>
            <Marker 
              position={[catch_.location.latitude, catch_.location.longitude]}
              icon={createFishIcon()}
            />
            {settings.display.showMapRadius && showRadius && (
              <Circle
                center={[catch_.location.latitude, catch_.location.longitude]}
                radius={settings.display.mapRadiusSize}
                pathOptions={{ 
                  color: 'blue', 
                  fillColor: 'blue', 
                  fillOpacity: 0.1,
                  weight: 1 
                }}
              />
            )}
          </React.Fragment>
        ))}

        {currentLocation && (
          <>
            <Marker
              position={[currentLocation.latitude, currentLocation.longitude]}
              icon={createLocationIcon(currentLocation.source)}
            />
            {settings.display.showMapRadius && showRadius && (
              <Circle
                center={[currentLocation.latitude, currentLocation.longitude]}
                radius={currentLocation.accuracy}
                pathOptions={{
                  color: currentLocation.source === 'gps' ? 'blue' : 
                         currentLocation.source === 'network' ? 'orange' : 'gray',
                  fillColor: currentLocation.source === 'gps' ? 'blue' : 
                            currentLocation.source === 'network' ? 'orange' : 'gray',
                  fillOpacity: 0.1,
                  weight: 1,
                  dashArray: currentLocation.source === 'ip' ? '5, 5' : undefined
                }}
              />
            )}
          </>
        )}
      </MapContainer>

      {isActive && onAddWaypoint && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-sm text-center text-gray-600" style={{ zIndex: 9999 }}>
          Click anywhere on the map to add a waypoint
        </div>
      )}
    </div>
  );
}