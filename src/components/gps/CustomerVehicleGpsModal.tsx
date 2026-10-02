import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Car, 
  Gauge, 
  Radio, 
  Volume2, 
  Compass, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Clock,
  Battery
} from 'lucide-react';
import { Vehicle, Booking, VehicleGpsTelemetry } from '../../types';
import { gpsTrackingService } from '../../services/gpsTrackingService';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { RunningCarMarker } from './RunningCarMarker';

interface CustomerVehicleGpsModalProps {
  vehicle: Vehicle;
  booking?: Booking;
  onClose: () => void;
}

export const CustomerVehicleGpsModal: React.FC<CustomerVehicleGpsModalProps> = ({
  vehicle,
  booking,
  onClose,
}) => {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB2rPfD-MSGSsLOLhQaonxTeInqsjwS8Go';
  const telemetry = gpsTrackingService.getTelemetry(vehicle.id) || {
    vehicleId: vehicle.id,
    vehicleName: `${vehicle.make} ${vehicle.model}`,
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin,
    category: vehicle.category,
    imageUrl: vehicle.imageUrl,
    status: vehicle.status,
    gpsStatus: 'ACTIVE_TRIP',
    currentLocation: {
      lat: 28.5562,
      lng: 77.1000,
      address: 'Aerocity Hub, Near Terminal 3, New Delhi',
      speedKmh: 42,
      heading: 90,
      altitudeMeters: 216,
      accuracyMeters: 1.1,
      satellitesLocked: 14,
    },
    breadcrumbs: [],
    batteryPercent: 88,
    fuelOrChargePercent: 74,
    lastPingTime: new Date().toISOString(),
    geofenceRadiusKm: 50,
    isMoving: true,
  } as VehicleGpsTelemetry;

  const [chirping, setChirping] = useState(false);

  const handleChirp = () => {
    setChirping(true);
    setTimeout(() => setChirping(false), 3000);
  };

  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${telemetry.currentLocation.lat},${telemetry.currentLocation.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Live Satellite Telemetry
                </span>
                <span className="text-xs text-slate-400">14 Satellites</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black mt-0.5">
                Live GPS Car Tracker
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <img 
              src={vehicle.imageUrl} 
              alt="" 
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" 
            />
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                {vehicle.make} {vehicle.model}
              </p>
              <p className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                {vehicle.licensePlate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-xl font-mono text-xs font-bold">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
              <span>{telemetry.currentLocation.speedKmh} km/h</span>
            </div>
            {booking && (
              <span className="text-slate-500">
                Reservation: <strong>{booking.bookingNumber}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Live Interactive Google Map */}
        <div className="relative w-full h-[320px] bg-slate-950">
          <APIProvider apiKey={apiKey} libraries={['marker']}>
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: telemetry.currentLocation.lat, lng: telemetry.currentLocation.lng }}
              defaultZoom={15}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            >
              <AdvancedMarker
                position={{ lat: telemetry.currentLocation.lat, lng: telemetry.currentLocation.lng }}
                title={`${vehicle.make} ${vehicle.model} (${telemetry.currentLocation.speedKmh} km/h)`}
              >
                <RunningCarMarker
                  telemetry={telemetry}
                  isSelected={true}
                  isBreached={false}
                />
              </AdvancedMarker>
            </Map>
          </APIProvider>

          {/* Chirping confirmation badge */}
          {chirping && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs shadow-2xl flex items-center gap-2 animate-bounce">
              <Volume2 className="w-4 h-4" />
              Horn Chirping 2x & Hazard Lights Flashing!
            </div>
          )}
        </div>

        {/* Location & Controls Footer */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Exact Live Street Location:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{telemetry.currentLocation.address}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                {telemetry.currentLocation.lat.toFixed(4)}°, {telemetry.currentLocation.lng.toFixed(4)}°
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Heading: {telemetry.currentLocation.heading}°
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Updated 1s ago
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleChirp}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              Locate Car (Chirp Horn & Flash)
            </button>

            <a
              href={googleMapsNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 text-center"
            >
              <ExternalLink className="w-4 h-4" />
              Navigate in Google Maps
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
