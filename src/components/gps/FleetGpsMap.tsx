import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap 
} from '@vis.gl/react-google-maps';
import { VehicleGpsTelemetry } from '../../types';
import { 
  Car, 
  Navigation, 
  Gauge, 
  BatteryCharging, 
  Fuel, 
  Radio, 
  MapPin, 
  Volume2, 
  Lock, 
  Clock, 
  ExternalLink,
  Layers,
  Compass,
  Crosshair,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { RunningCarMarker } from './RunningCarMarker';
import { calculateDistanceKm } from '../../services/geofenceAlertService';
import { theftPreventionService } from '../../services/theftPreventionService';

interface FleetGpsMapProps {
  telemetryList: VehicleGpsTelemetry[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  showRentedOnly?: boolean;
}

// Google Maps Native Geofence Boundary Circle Renderer
const GeofenceCircle: React.FC<{
  center: { lat: number; lng: number };
  radiusKm: number;
  isBreached: boolean;
  zoneName: string;
}> = ({ center, radiusKm, isBreached, zoneName }) => {
  const map = useMap();
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !(window as any).google?.maps?.Circle) return;

    const radiusMeters = radiusKm * 1000;

    if (!circleRef.current) {
      circleRef.current = new (window as any).google.maps.Circle({
        map,
        center,
        radius: radiusMeters,
        fillColor: isBreached ? '#ef4444' : '#0ea5e9',
        fillOpacity: isBreached ? 0.18 : 0.10,
        strokeColor: isBreached ? '#dc2626' : '#0284c7',
        strokeOpacity: 0.85,
        strokeWeight: 2,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusMeters);
      circleRef.current.setOptions({
        fillColor: isBreached ? '#ef4444' : '#0ea5e9',
        fillOpacity: isBreached ? 0.18 : 0.10,
        strokeColor: isBreached ? '#dc2626' : '#0284c7',
      });
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center.lat, center.lng, radiusKm, isBreached]);

  return null;
};

// Helper component to center map on selected vehicle
const MapRecenterController: React.FC<{ targetCoords: { lat: number; lng: number } | null }> = ({ targetCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (map && targetCoords) {
      map.panTo(targetCoords);
      if (map.getZoom()! < 12) {
        map.setZoom(13);
      }
    }
  }, [map, targetCoords]);
  return null;
};

export const FleetGpsMap: React.FC<FleetGpsMapProps> = ({
  telemetryList,
  selectedVehicleId,
  onSelectVehicle,
  showRentedOnly = false
}) => {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB2rPfD-MSGSsLOLhQaonxTeInqsjwS8Go';
  const [selectedMarkerVehicle, setSelectedMarkerVehicle] = useState<VehicleGpsTelemetry | null>(null);
  const [chirpFeedback, setChirpFeedback] = useState<string | null>(null);
  const [showGeofencePerimeter, setShowGeofencePerimeter] = useState(true);

  // Filter vehicles
  const displayedVehicles = showRentedOnly 
    ? telemetryList.filter(t => t.status === 'RENTED' || !!t.activeRental)
    : telemetryList;

  const activeSelected = telemetryList.find(t => t.vehicleId === selectedVehicleId) || displayedVehicles[0] || telemetryList[0];

  // Geofence config for active selected vehicle
  const selectedConfig = activeSelected ? theftPreventionService.getConfig(activeSelected.vehicleId) : null;
  const activeDistanceToCenter = (activeSelected && selectedConfig)
    ? calculateDistanceKm(
        activeSelected.currentLocation.lat,
        activeSelected.currentLocation.lng,
        selectedConfig.centerCoordinates.lat,
        selectedConfig.centerCoordinates.lng
      )
    : 0;

  const isActiveBreached = selectedConfig 
    ? (activeDistanceToCenter > selectedConfig.geofenceRadiusKm && selectedConfig.geofenceEnabled)
    : false;

  // Center coordinate
  const defaultCenter = activeSelected ? {
    lat: activeSelected.currentLocation.lat,
    lng: activeSelected.currentLocation.lng,
  } : { lat: 28.5562, lng: 77.1000 };

  const handleChirp = (veh: VehicleGpsTelemetry) => {
    setChirpFeedback(`Chirp transmitted to ${veh.licensePlate}! Horn sounded 2x & hazards pulsed.`);
    setTimeout(() => setChirpFeedback(null), 3500);
  };


  return (
    <div className="relative w-full h-[580px] lg:h-[680px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
      
      {/* Top Floating Map Header Info & Controls */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 text-white shadow-lg flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black tracking-wide uppercase text-emerald-400">Live GPS Constellation</span>
        </div>
        <span className="text-slate-500">|</span>
        <span className="text-xs font-semibold text-slate-300">
          Tracking <strong className="text-white font-black">{displayedVehicles.length}</strong> active vehicles
        </span>

        {/* Geofence Boundary Visibility Toggle */}
        <button
          onClick={() => setShowGeofencePerimeter(!showGeofencePerimeter)}
          className={`ml-2 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
            showGeofencePerimeter 
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Toggle Geofence Perimeter Overlay"
        >
          <Crosshair className="w-3.5 h-3.5 text-sky-400" />
          Geofence Boundary: {showGeofencePerimeter ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Chirp Notification Toast */}
      {chirpFeedback && (
        <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Volume2 className="w-4 h-4" />
          {chirpFeedback}
        </div>
      )}

      {/* Main Google Map Provider */}
      <APIProvider apiKey={apiKey} libraries={['marker']}>
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={defaultCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
          internalUsageAttributionIds={['gmp_git_agentskills_v1']}
        >
          <MapRecenterController 
            targetCoords={activeSelected ? { 
              lat: activeSelected.currentLocation.lat, 
              lng: activeSelected.currentLocation.lng 
            } : null} 
          />

          {/* Render Geofence Boundary Circle for Selected Vehicle */}
          {showGeofencePerimeter && selectedConfig && selectedConfig.geofenceEnabled && (
            <GeofenceCircle
              center={selectedConfig.centerCoordinates}
              radiusKm={selectedConfig.geofenceRadiusKm}
              isBreached={isActiveBreached}
              zoneName={selectedConfig.geofenceZoneName}
            />
          )}

          {/* Render markers for each fleet vehicle with Running Car Animation */}
          {displayedVehicles.map(veh => {
            const isSelected = veh.vehicleId === selectedVehicleId;
            const vehConfig = theftPreventionService.getConfig(veh.vehicleId);
            const dist = vehConfig ? calculateDistanceKm(
              veh.currentLocation.lat,
              veh.currentLocation.lng,
              vehConfig.centerCoordinates.lat,
              vehConfig.centerCoordinates.lng
            ) : 0;
            const isBreached = vehConfig ? (dist > vehConfig.geofenceRadiusKm && vehConfig.geofenceEnabled) : false;

            return (
              <AdvancedMarker
                key={veh.vehicleId}
                position={{ lat: veh.currentLocation.lat, lng: veh.currentLocation.lng }}
                onClick={() => {
                  onSelectVehicle(veh.vehicleId);
                  setSelectedMarkerVehicle(veh);
                }}
                title={`${veh.vehicleName} (${veh.licensePlate}) - ${veh.currentLocation.speedKmh} km/h`}
              >
                <RunningCarMarker
                  telemetry={veh}
                  isSelected={isSelected}
                  isBreached={isBreached}
                />
              </AdvancedMarker>
            );
          })}


          {/* Info Window for Selected Marker */}
          {selectedMarkerVehicle && (
            <InfoWindow
              position={{
                lat: selectedMarkerVehicle.currentLocation.lat,
                lng: selectedMarkerVehicle.currentLocation.lng
              }}
              onCloseClick={() => setSelectedMarkerVehicle(null)}
            >
              <div className="p-3 text-slate-900 max-w-xs space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={selectedMarkerVehicle.imageUrl} 
                    alt="" 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                      {selectedMarkerVehicle.vehicleName}
                    </h4>
                    <p className="text-[11px] font-mono font-bold text-amber-600">
                      {selectedMarkerVehicle.licensePlate}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedMarkerVehicle.status === 'RENTED' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedMarkerVehicle.status === 'RENTED' ? 'ACTIVE RENTAL' : 'AVAILABLE'}
                    </span>
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="p-2 rounded-xl bg-slate-100 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live Speed:</span>
                    <strong className="text-slate-900">{selectedMarkerVehicle.currentLocation.speedKmh} km/h</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Street:</span>
                    <span className="text-slate-800 truncate max-w-[170px]" title={selectedMarkerVehicle.currentLocation.address}>
                      {selectedMarkerVehicle.currentLocation.address}
                    </span>
                  </div>
                  {selectedMarkerVehicle.activeRental && (
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Renter:</span>
                      <strong className="text-amber-700">{selectedMarkerVehicle.activeRental.renterName}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleChirp(selectedMarkerVehicle)}
                    className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    Chirp Horn
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${selectedMarkerVehicle.currentLocation.lat},${selectedMarkerVehicle.currentLocation.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px]"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

        </Map>
      </APIProvider>

      {/* Bottom Floating Telemetry HUD of Focused Vehicle */}
      {activeSelected && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <img 
              src={activeSelected.imageUrl} 
              alt="" 
              className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">{activeSelected.vehicleName}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  activeSelected.status === 'RENTED' 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {activeSelected.status === 'RENTED' ? 'Rented (In-Motion)' : 'Available at Hub'}
                </span>
              </div>
              <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                {activeSelected.licensePlate} • VIN: {activeSelected.vin.slice(0, 8)}...
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[280px] sm:max-w-md">{activeSelected.currentLocation.address}</span>
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="px-3.5 py-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Speed</span>
              <span className="font-mono text-lg font-black text-amber-400">
                {activeSelected.currentLocation.speedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
            </div>

            <div className="px-3.5 py-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Heading</span>
              <span className="font-mono text-lg font-black text-white flex items-center justify-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                {activeSelected.currentLocation.heading}°
              </span>
            </div>

            <div className="px-3.5 py-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Satellites</span>
              <span className="font-mono text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                14 SV
              </span>
            </div>

            {/* Geofence Status HUD Metric */}
            {selectedConfig && (
              <div className={`px-3.5 py-2 rounded-2xl border text-center ${
                isActiveBreached 
                  ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse' 
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-1">
                  <Crosshair className="w-3 h-3 text-sky-400" />
                  Geofence
                </span>
                <span className={`font-mono text-sm font-black ${isActiveBreached ? 'text-red-400' : 'text-sky-400'}`}>
                  {activeDistanceToCenter} <span className="text-[10px] font-normal text-slate-400">/ {selectedConfig.geofenceRadiusKm} km</span>
                </span>
                {isActiveBreached && (
                  <span className="text-[9px] font-black uppercase text-red-400 block tracking-tight">
                    BREACHED (+{(activeDistanceToCenter - selectedConfig.geofenceRadiusKm).toFixed(1)} km)
                  </span>
                )}
              </div>
            )}

            <button
              onClick={() => handleChirp(activeSelected)}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95 shrink-0"
            >
              <Volume2 className="w-4 h-4" />
              Locate (Chirp)
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

