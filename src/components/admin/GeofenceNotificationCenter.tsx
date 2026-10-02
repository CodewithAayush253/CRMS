import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  AlertTriangle, 
  Bell, 
  BellOff, 
  ShieldAlert, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Gauge, 
  Zap, 
  RotateCcw, 
  Lock, 
  Unlock, 
  ExternalLink, 
  CheckCircle2, 
  Sliders, 
  Radio, 
  Car,
  Compass,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Vehicle, GeofenceNotification, GeofenceSurveillanceStatus } from '../../types';
import { geofenceAlertService, calculateDistanceKm, playGeofenceSirenChime } from '../../services/geofenceAlertService';
import { theftPreventionService } from '../../services/theftPreventionService';

interface GeofenceNotificationCenterProps {
  vehicles: Vehicle[];
  onOpenVehicleGps?: (vehicleId: string) => void;
  onOpenPoliceReport?: (vehicle: Vehicle) => void;
}

export const GeofenceNotificationCenter: React.FC<GeofenceNotificationCenterProps> = ({
  vehicles,
  onOpenVehicleGps,
  onOpenPoliceReport
}) => {
  const [surveillanceList, setSurveillanceList] = useState<GeofenceSurveillanceStatus[]>([]);
  const [notifications, setNotifications] = useState<GeofenceNotification[]>([]);
  const [audioMuted, setAudioMuted] = useState(geofenceAlertService.isAudioMuted());
  const [autoKillEnabled, setAutoKillEnabled] = useState(geofenceAlertService.isAutoImmobilizeEnabled());
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [customRadiusInput, setCustomRadiusInput] = useState<number>(50);
  const [filterBreachOnly, setFilterBreachOnly] = useState(false);

  const refreshState = () => {
    setSurveillanceList(geofenceAlertService.getSurveillanceStatuses());
    setNotifications(geofenceAlertService.getNotifications());
    setAudioMuted(geofenceAlertService.isAudioMuted());
    setAutoKillEnabled(geofenceAlertService.isAutoImmobilizeEnabled());
  };

  useEffect(() => {
    refreshState();
    const unsub = geofenceAlertService.subscribe(() => {
      refreshState();
    });
    return () => {
      unsub();
    };
  }, [vehicles]);

  const breachedCount = surveillanceList.filter(s => s.isBreached).length;
  const unreadNotifsCount = notifications.filter(n => !n.acknowledged).length;

  const handleToggleAudio = () => {
    const next = geofenceAlertService.toggleAudioMute();
    setAudioMuted(next);
  };

  const handleToggleAutoKill = () => {
    const next = geofenceAlertService.toggleAutoImmobilize();
    setAutoKillEnabled(next);
  };

  const handleSimulateBreach = (vehicleId: string) => {
    geofenceAlertService.simulateBreach(vehicleId);
    refreshState();
  };

  const handleReturnToZone = (vehicleId: string) => {
    geofenceAlertService.returnVehicleToSafeBoundary(vehicleId);
    refreshState();
  };

  const handleUpdateRadius = (vehicleId: string, radiusKm: number) => {
    geofenceAlertService.updateVehicleGeofenceBoundary(vehicleId, radiusKm);
    setEditingVehicleId(null);
    refreshState();
  };

  const handleToggleVehicleGeofence = (vehicleId: string) => {
    const current = theftPreventionService.getConfig(vehicleId);
    theftPreventionService.updateConfig(vehicleId, { geofenceEnabled: !current.geofenceEnabled });
    geofenceAlertService.evaluateFleetGeofences();
    refreshState();
  };

  const handleSafeImmobilize = (vehicleId: string, vehicleName: string, licensePlate: string) => {
    theftPreventionService.triggerImmobilizer(vehicleId, vehicleName, licensePlate);
    refreshState();
  };

  const filteredSurveillance = filterBreachOnly 
    ? surveillanceList.filter(s => s.isBreached)
    : surveillanceList;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Control Bar & Notification Watchdog Settings */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Crosshair className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                  Automated GPS Geofence Surveillance
                </span>
                {breachedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">
                    {breachedCount} Perimeter Breach{breachedCount > 1 ? 'es' : ''} Active
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Automated Admin Boundary Alert System
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl font-normal">
            Continuous background telemetry watchdog computes vehicle Euclidean & Great-Circle distance against pre-defined perimeter boundaries. Instantly sounds alerts, sends in-app notifications, and auto-primes cryptographic kill switches.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* Audio Chime Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              audioMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
            }`}
            title="Toggle siren sound for perimeter breaches"
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>Siren Audio: {audioMuted ? 'Muted' : 'Active (Dual-Tone)'}</span>
          </button>

          {/* Test Sound Button */}
          {!audioMuted && (
            <button
              onClick={() => playGeofenceSirenChime()}
              className="px-2.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
              title="Test Siren Chime"
            >
              Test Chime
            </button>
          )}

          {/* Auto Safe-Kill Switch Toggle */}
          <button
            onClick={handleToggleAutoKill}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              autoKillEnabled
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Automatically queue safe remote immobilization when a vehicle breaches geofence boundary"
          >
            <Lock className="w-4 h-4" />
            <span>Auto-Immobilize on Breach: {autoKillEnabled ? 'ARMED' : 'STANDBY'}</span>
          </button>

          {/* Acknowledge All */}
          {unreadNotifsCount > 0 && (
            <button
              onClick={() => geofenceAlertService.acknowledgeAll()}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Acknowledge All ({unreadNotifsCount})
            </button>
          )}

        </div>
      </div>

      {/* 2. Active Breach Emergency Notice (If any vehicle is breached) */}
      {breachedCount > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-red-950 via-rose-950 to-red-900 border-2 border-red-500 text-white shadow-2xl animate-pulse">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                    CRITICAL PERIMETER BREACH
                  </span>
                  <span className="text-xs text-red-200 font-mono font-bold">
                    {breachedCount} vehicle{breachedCount > 1 ? 's' : ''} outside permitted zones
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Active Automated Admin Geofence Alarm Triggered!
                </h3>
                <p className="text-xs text-red-200 mt-0.5">
                  Vehicles have crossed the geofence perimeter. Safe engine shutdown staged and telematics tracking interval switched to 1 second.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setFilterBreachOnly(!filterBreachOnly)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-red-950 font-black text-xs transition-all shadow-md"
              >
                {filterBreachOnly ? 'Show All Fleet Vehicles' : 'Filter Breached Vehicles Only'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Fleet Geofence Surveillance Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Fleet Geofence Surveillance Watchdog
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {surveillanceList.length} Vehicles Monitored
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilterBreachOnly(false)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                !filterBreachOnly
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Vehicles ({surveillanceList.length})
            </button>
            <button
              onClick={() => setFilterBreachOnly(true)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filterBreachOnly
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Breached Only ({breachedCount})
            </button>
          </div>
        </div>

        {/* Vehicles Grid / Table */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredSurveillance.map(status => {
            const vehicle = vehicles.find(v => v.id === status.vehicleId);
            const isEditing = editingVehicleId === status.vehicleId;
            const config = theftPreventionService.getConfig(status.vehicleId);

            return (
              <div 
                key={status.vehicleId}
                className={`p-5 transition-all ${
                  status.isBreached 
                    ? 'bg-red-50/70 dark:bg-red-950/20' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* Vehicle Identity */}
                  <div className="flex items-center gap-3.5 min-w-[240px]">
                    {vehicle?.imageUrl ? (
                      <img 
                        src={vehicle.imageUrl} 
                        alt="" 
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Car className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                          {status.vehicleName}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          status.isBreached
                            ? 'bg-red-600 text-white animate-pulse'
                            : status.usagePercentage > 75
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {status.isBreached ? 'BREACHED' : status.usagePercentage > 75 ? 'PERIMETER ALERT' : 'SAFE INSIDE'}
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {status.licensePlate}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[200px]" title={status.currentCoordinates.address}>
                          {status.currentCoordinates.address}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Geofence Boundary Metrics & Progress Bar */}
                  <div className="flex-1 max-w-md w-full space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-sky-500" />
                        {status.zoneName}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {status.currentDistanceKm} km / {status.radiusKm} km limit
                      </span>
                    </div>

                    {/* Perimeter Usage Bar */}
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          status.isBreached 
                            ? 'bg-red-600' 
                            : status.usagePercentage > 75 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, status.usagePercentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Perimeter Consumed: <strong>{status.usagePercentage}%</strong></span>
                      {status.isBreached ? (
                        <span className="font-black text-red-600 dark:text-red-400">
                          +{status.excessDistanceKm} km outside authorized boundary!
                        </span>
                      ) : (
                        <span>Speed: <strong className="font-mono">{status.currentCoordinates.speedKmh} km/h</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Config & Interactive Controls */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    
                    {/* Geofence Toggle */}
                    <button
                      onClick={() => handleToggleVehicleGeofence(status.vehicleId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        status.enabled 
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                      }`}
                      title="Enable or disable geofencing for this car"
                    >
                      Geofence: {status.enabled ? 'ON' : 'OFF'}
                    </button>

                    {/* Radius Editor Trigger */}
                    <button
                      onClick={() => {
                        setEditingVehicleId(isEditing ? null : status.vehicleId);
                        setCustomRadiusInput(status.radiusKm);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Adjust Radius
                    </button>

                    {/* Simulation / Return Action */}
                    {status.isBreached ? (
                      <button
                        onClick={() => handleReturnToZone(status.vehicleId)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        title="Return car inside boundary"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Return to Safe Zone
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSimulateBreach(status.vehicleId)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        title="Simulate vehicle moving outside boundary to test the automated notification system"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Simulate Breach
                      </button>
                    )}

                    {/* Safe Kill Switch if Breached */}
                    {status.isBreached && config.immobilizerStatus !== 'EMERGENCY_LOCKOUT' && (
                      <button
                        onClick={() => handleSafeImmobilize(status.vehicleId, status.vehicleName, status.licensePlate)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Safe Immobilize
                      </button>
                    )}

                    {/* GPS Radar Link */}
                    {onOpenVehicleGps && (
                      <button
                        onClick={() => onOpenVehicleGps(status.vehicleId)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-all"
                        title="View on Live GPS Constellation"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                  </div>

                </div>

                {/* Inline Radius Config Sub-drawer */}
                {isEditing && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 animate-fade-in flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Configure Pre-defined GPS Geofence Boundary Radius
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Select a standard perimeter corridor or enter a custom radius in kilometers.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[15, 30, 45, 60, 80, 100].map(rad => (
                        <button
                          key={rad}
                          onClick={() => handleUpdateRadius(status.vehicleId, rad)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            status.radiusKm === rad
                              ? 'bg-sky-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {rad} km
                        </button>
                      ))}

                      <div className="flex items-center gap-1.5 ml-2">
                        <input
                          type="number"
                          min={5}
                          max={300}
                          value={customRadiusInput}
                          onChange={(e) => setCustomRadiusInput(Number(e.target.value))}
                          className="w-20 px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleUpdateRadius(status.vehicleId, customRadiusInput)}
                          className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Automated Notification History Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Automated Admin Notification Feed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log of all automated geofence boundary alert events and dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => geofenceAlertService.clearAll()}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear Log
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No geofence breach notifications logged. All vehicles are safely inside their designated boundaries.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all ${
                  !notif.acknowledged 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 shadow-xs' 
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-xl bg-red-600 text-white shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {notif.vehicleName}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {notif.licensePlate}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                          Boundary Breach (+{notif.excessKm} km)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Vehicle detected at <strong>{notif.currentAddress}</strong>, travelling at <strong>{notif.speedKmh} km/h</strong>. Distance from {notif.zoneName} center is <strong>{notif.distanceKm} km</strong> (Authorized: {notif.maxRadiusKm} km).
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </span>
                        {notif.autoImmobilizeTriggered && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Auto-Immobilizer Primed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.acknowledged ? (
                      <button
                        onClick={() => geofenceAlertService.acknowledgeNotification(notif.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
