import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  MapPin, 
  Navigation, 
  Car, 
  Gauge, 
  Search, 
  Filter, 
  RefreshCw, 
  Volume2, 
  Eye, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  Zap,
  Clock,
  Battery,
  Fuel,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Vehicle, Booking, VehicleGpsTelemetry } from '../../types';
import { gpsTrackingService } from '../../services/gpsTrackingService';
import { FleetGpsMap } from './FleetGpsMap';
import { calculateDistanceKm } from '../../services/geofenceAlertService';
import { theftPreventionService } from '../../services/theftPreventionService';

interface FleetGpsTrackingCenterProps {
  vehicles: Vehicle[];
  bookings: Booking[];
  onOpenVehicleDetails?: (vehicle: Vehicle) => void;
}

export const FleetGpsTrackingCenter: React.FC<FleetGpsTrackingCenterProps> = ({
  vehicles,
  bookings,
  onOpenVehicleDetails,
}) => {
  const [telemetryList, setTelemetryList] = useState<VehicleGpsTelemetry[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'RENTED' | 'MOVING' | 'PARKED'>('RENTED');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSimulate, setAutoSimulate] = useState(true);

  // Initialize service with current vehicles and bookings
  useEffect(() => {
    gpsTrackingService.initialize(vehicles, bookings);
    const unsubscribe = gpsTrackingService.subscribe((list) => {
      setTelemetryList([...list]);
    });
    return () => {
      unsubscribe();
    };
  }, [vehicles, bookings]);

  // Default select first rented vehicle
  useEffect(() => {
    if (!selectedVehicleId && telemetryList.length > 0) {
      const rented = telemetryList.find(t => t.status === 'RENTED' || !!t.activeRental);
      setSelectedVehicleId(rented?.vehicleId || telemetryList[0].vehicleId);
    }
  }, [telemetryList, selectedVehicleId]);

  // Derived stats
  const totalFleetCount = telemetryList.length;
  const rentedVehicles = telemetryList.filter(t => t.status === 'RENTED' || !!t.activeRental);
  const movingVehicles = telemetryList.filter(t => t.isMoving && t.currentLocation.speedKmh > 0);
  const parkedVehicles = telemetryList.filter(t => t.currentLocation.speedKmh === 0);

  const avgFleetSpeed = movingVehicles.length > 0
    ? Math.round(movingVehicles.reduce((acc, curr) => acc + curr.currentLocation.speedKmh, 0) / movingVehicles.length)
    : 0;

  // Filtered vehicles
  const filteredList = telemetryList.filter(v => {
    if (filterMode === 'RENTED' && v.status !== 'RENTED' && !v.activeRental) return false;
    if (filterMode === 'MOVING' && (!v.isMoving || v.currentLocation.speedKmh === 0)) return false;
    if (filterMode === 'PARKED' && v.currentLocation.speedKmh > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.vehicleName.toLowerCase().includes(q);
      const matchPlate = v.licensePlate.toLowerCase().includes(q);
      const matchRenter = v.activeRental?.renterName.toLowerCase().includes(q);
      const matchAddress = v.currentLocation.address.toLowerCase().includes(q);
      return matchName || matchPlate || matchRenter || matchAddress;
    }
    return true;
  });

  const selectedTelemetry = telemetryList.find(t => t.vehicleId === selectedVehicleId) || telemetryList[0];

  const handleForcePing = () => {
    gpsTrackingService.simulationStep();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                GPS Telematics Online
              </span>
              <span className="text-xs text-slate-400 font-medium">
                GNSS Satellites: <strong className="text-white">14 Locked (GPS + NavIC)</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Fleet GPS Real-Time Tracking Center
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
              Live multi-vehicle satellite telemetry tracking all rented cars on urban expressways, corridor speeds, heading bearings, and trip breadcrumb routes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleForcePing}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Force GPS Ping
            </button>
            <button
              onClick={() => setFilterMode('RENTED')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 active:scale-95"
            >
              <Car className="w-4 h-4" />
              Focus Rented Cars ({rentedVehicles.length})
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>All Tracked Cars</span>
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{totalFleetCount}</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">100% GPS Equipped</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full fleet satellite sync</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Active Rented Trips</span>
              <Car className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">{rentedVehicles.length}</span>
              <span className="text-[10px] text-slate-400 font-bold">On the road</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Customer live reservations</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Vehicles in Motion</span>
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{movingVehicles.length}</span>
              <span className="text-[10px] text-indigo-400 font-bold">Moving</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Avg speed: {avgFleetSpeed} km/h</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Parked at Hubs</span>
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{parkedVehicles.length}</span>
              <span className="text-[10px] text-teal-400 font-bold">Available</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ready for pickup</p>
          </div>
        </div>
      </div>

      {/* Filter Mode & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'RENTED', label: 'Rented Cars (Live Tracking)', count: rentedVehicles.length },
            { id: 'ALL', label: 'All Fleet Units', count: totalFleetCount },
            { id: 'MOVING', label: 'In-Motion', count: movingVehicles.length },
            { id: 'PARKED', label: 'Parked at Hub', count: parkedVehicles.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMode === tab.id
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/10 dark:bg-white/10">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search car, plate, renter, street..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Split Grid: Left Roster, Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Vehicle Telematics Cards List */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[680px] overflow-y-auto pr-1">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between px-1">
            <span>SHOWING {filteredList.length} VEHICLES</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live 3.5s Telemetry Pings
            </span>
          </div>

          {filteredList.map((tel) => {
            const isSelected = tel.vehicleId === selectedVehicleId;
            const isRented = tel.status === 'RENTED' || !!tel.activeRental;
            const isMoving = tel.isMoving && tel.currentLocation.speedKmh > 0;
            const vehConfig = theftPreventionService.getConfig(tel.vehicleId);
            const dist = vehConfig ? calculateDistanceKm(
              tel.currentLocation.lat,
              tel.currentLocation.lng,
              vehConfig.centerCoordinates.lat,
              vehConfig.centerCoordinates.lng
            ) : 0;
            const isBreached = vehConfig ? (dist > vehConfig.geofenceRadiusKm && vehConfig.geofenceEnabled) : false;

            return (
              <div
                key={tel.vehicleId}
                onClick={() => setSelectedVehicleId(tel.vehicleId)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isBreached
                    ? 'bg-red-50/70 dark:bg-red-950/20 border-red-500 shadow-md ring-1 ring-red-500'
                    : isSelected
                    ? 'bg-amber-50/60 dark:bg-slate-800/90 border-amber-500 dark:border-amber-400 shadow-md ring-1 ring-amber-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left status colored accent bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  isBreached ? 'bg-red-600' : isRented ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={tel.imageUrl} 
                      alt="" 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {tel.vehicleName}
                        </h4>
                      </div>
                      <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {tel.licensePlate}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {tel.category}
                        </span>
                        {isBreached && (
                          <span className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.2 rounded border border-red-300 dark:border-red-800 animate-pulse">
                            Geofence Breach
                          </span>
                        )}
                        {isMoving && !isBreached && (
                          <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                            Running
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Speed Badge */}
                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1 font-mono text-sm font-black px-2.5 py-1 rounded-xl shadow-xs ${
                      isBreached
                        ? 'bg-red-600 text-white animate-bounce'
                        : isMoving 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Gauge className="w-3.5 h-3.5" />
                      {tel.currentLocation.speedKmh} km/h
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1 uppercase font-bold">
                      {isBreached ? 'Out of Bounds' : isMoving ? 'In Transit (Running)' : 'Parked'}
                    </span>
                  </div>
                </div>

                {/* Location address */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{tel.currentLocation.address}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {tel.currentLocation.lat.toFixed(3)}°, {tel.currentLocation.lng.toFixed(3)}°
                  </span>
                </div>

                {/* Active Renter Dossier (if rented) */}
                {tel.activeRental && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Car className="w-3 h-3 text-amber-600" />
                        Renter: {tel.activeRental.renterName}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {tel.activeRental.bookingNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                      <span>Trip: {tel.activeRental.pickupLocation.split(',')[0]} → {tel.activeRental.returnLocation.split(',')[0]}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">ETA: ~{tel.activeRental.destinationEtaMinutes}m</span>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3 h-3 text-indigo-400" />
                      {tel.currentLocation.heading}° Heading
                    </span>
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-emerald-400" />
                      {tel.batteryPercent}%
                    </span>
                  </div>

                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                    Center on Radar →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Google Maps Interactive Component */}
        <div className="lg:col-span-7">
          <FleetGpsMap
            telemetryList={telemetryList}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={(vehId) => setSelectedVehicleId(vehId)}
            showRentedOnly={filterMode === 'RENTED'}
          />
        </div>

      </div>

    </div>
  );
};
