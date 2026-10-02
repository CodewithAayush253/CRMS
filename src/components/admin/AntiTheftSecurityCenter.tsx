import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Radio, 
  MapPin, 
  KeyRound, 
  AlertTriangle, 
  Zap, 
  Car, 
  Terminal, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Sliders, 
  Layers, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Crosshair, 
  HelpCircle,
  ExternalLink,
  Download,
  Flame,
  ArrowRight,
  Bell,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Vehicle, VehicleSecurityConfig, TheftSecurityAlert, ImmobilizerState, GeofenceNotification } from '../../types';
import { theftPreventionService } from '../../services/theftPreventionService';
import { geofenceAlertService } from '../../services/geofenceAlertService';
import { GeofenceNotificationCenter } from './GeofenceNotificationCenter';

interface AntiTheftSecurityCenterProps {
  vehicles: Vehicle[];
  onOpenVehicleDetails?: (vehicle: Vehicle) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AntiTheftSecurityCenter: React.FC<AntiTheftSecurityCenterProps> = ({
  vehicles,
  onOpenVehicleDetails,
  onNavigateTab
}) => {
  const [configs, setConfigs] = useState<VehicleSecurityConfig[]>([]);
  const [alerts, setAlerts] = useState<TheftSecurityAlert[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh-1');
  const [activeTab, setActiveTab] = useState<'FLEET_ROSTER' | 'GEOFENCE_NOTIFICATIONS' | 'ATTACK_SIMULATOR' | 'ALERTS_FEED' | 'ARCHITECTURE_GUIDE'>('FLEET_ROSTER');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Geofence automated notification state
  const [geofenceNotifs, setGeofenceNotifs] = useState<GeofenceNotification[]>([]);
  const [breachedCount, setBreachedCount] = useState<number>(0);
  const [audioMuted, setAudioMuted] = useState<boolean>(geofenceAlertService.isAudioMuted());
  
  // Police report modal state
  const [policeReportVehicle, setPoliceReportVehicle] = useState<{ vehicle: Vehicle; config: VehicleSecurityConfig } | null>(null);

  // Simulation feedback state
  const [simulationResult, setSimulationResult] = useState<{ title: string; mitigation: string; alert: TheftSecurityAlert } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Confirmation dialog for remote kill switch
  const [confirmKillModal, setConfirmKillModal] = useState<{ vehicle: Vehicle; config: VehicleSecurityConfig } | null>(null);

  // PIN display reveal toggle
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const refreshData = () => {
    // Ensure all fleet vehicles have a config
    vehicles.forEach(v => theftPreventionService.getConfig(v.id));
    setConfigs(theftPreventionService.getAllConfigs());
    setAlerts(theftPreventionService.getAllAlerts());
    setGeofenceNotifs(geofenceAlertService.getNotifications());
    setBreachedCount(geofenceAlertService.getSurveillanceStatuses().filter(s => s.isBreached).length);
    setAudioMuted(geofenceAlertService.isAudioMuted());
  };

  useEffect(() => {
    refreshData();
    const unsub = geofenceAlertService.subscribe(() => {
      refreshData();
    });
    return () => {
      unsub();
    };
  }, [vehicles]);


  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const selectedConfig = theftPreventionService.getConfig(selectedVehicle?.id || 'veh-1');

  // Stats calculation
  const totalVehicles = configs.length || vehicles.length;
  const armedCount = configs.filter(c => c.immobilizerStatus === 'ARMED').length;
  const lockedOutCount = configs.filter(c => c.immobilizerStatus === 'EMERGENCY_LOCKOUT' || c.immobilizerStatus === 'PENDING_SAFE_SHUTDOWN').length;
  const pinProtectedCount = configs.filter(c => c.pinToDriveEnabled).length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length;
  const overallSecurityIndex = Math.round(
    100 - (configs.reduce((acc, curr) => acc + curr.theftRiskScore, 0) / Math.max(1, configs.length))
  );

  const togglePinReveal = (vehId: string) => {
    setRevealedPins(prev => ({ ...prev, [vehId]: !prev[vehId] }));
  };

  const handleTogglePinToDrive = (vehId: string) => {
    const current = theftPreventionService.getConfig(vehId);
    theftPreventionService.updateConfig(vehId, { pinToDriveEnabled: !current.pinToDriveEnabled });
    refreshData();
  };

  const handleToggleGeofence = (vehId: string) => {
    const current = theftPreventionService.getConfig(vehId);
    theftPreventionService.updateConfig(vehId, { geofenceEnabled: !current.geofenceEnabled });
    refreshData();
  };

  const handleToggleCanProtection = (vehId: string) => {
    const current = theftPreventionService.getConfig(vehId);
    theftPreventionService.updateConfig(vehId, { canBusRelayProtection: !current.canBusRelayProtection });
    refreshData();
  };

  const handleToggleJammer = (vehId: string) => {
    const current = theftPreventionService.getConfig(vehId);
    theftPreventionService.updateConfig(vehId, { jammerDetection: !current.jammerDetection });
    refreshData();
  };

  const handleExecuteKillSwitch = (vehicle: Vehicle, config: VehicleSecurityConfig) => {
    theftPreventionService.triggerImmobilizer(vehicle.id, `${vehicle.make} ${vehicle.model}`, vehicle.licensePlate);
    setConfirmKillModal(null);
    refreshData();
  };

  const handleDisarm = (vehicle: Vehicle) => {
    theftPreventionService.disarmImmobilizer(vehicle.id, `${vehicle.make} ${vehicle.model}`, vehicle.licensePlate);
    refreshData();
  };

  const handleActivateSVR = (vehicle: Vehicle) => {
    theftPreventionService.activateStolenVehicleRecovery(vehicle.id, `${vehicle.make} ${vehicle.model}`, vehicle.licensePlate);
    refreshData();
  };

  const handleRunSimulation = (attackType: 'RELAY_ATTACK' | 'GEOFENCE_ESCAPE' | 'FLATBED_TOW' | 'RF_JAMMER' | 'BRUTE_PIN') => {
    if (!selectedVehicle) return;
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      const result = theftPreventionService.simulateAttack(
        selectedVehicle.id,
        `${selectedVehicle.make} ${selectedVehicle.model}`,
        selectedVehicle.licensePlate,
        attackType
      );
      setSimulationResult(result);
      setIsSimulating(false);
      refreshData();
    }, 600);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Active Cyber Defense
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Live Telematics Bus Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Software-Based Car Theft Prevention Hub
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
              Real-time cryptographic engine immobilizers, dynamic geofence tripwires, CAN-bus relay attack mitigation, PIN-to-Drive authentication, and automated Stolen Vehicle Recovery (SVR) protocols.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                theftPreventionService.resetAllToDemo();
                refreshData();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo Telematics
            </button>
            <button
              onClick={() => setActiveTab('ATTACK_SIMULATOR')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              Run Attack Simulator
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Security Score</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">{overallSecurityIndex}%</span>
              <span className="text-[10px] text-emerald-500 font-bold uppercase">Optimal</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Fleet threat posture</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Safe Kill Switch</span>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{armedCount + lockedOutCount}</span>
              <span className="text-[10px] text-slate-400">/ {totalVehicles}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Immobilizers armed</p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>PIN-to-Drive</span>
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{pinProtectedCount}</span>
              <span className="text-[10px] text-indigo-400 font-bold">Protected</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">MFA ignition enabled</p>
          </div>

          <button
            onClick={() => setActiveTab('GEOFENCE_NOTIFICATIONS')}
            className={`p-4 rounded-2xl border backdrop-blur-sm text-left transition-all ${
              breachedCount > 0 
                ? 'bg-red-950/60 border-red-500 shadow-lg shadow-red-500/20' 
                : 'bg-slate-900/60 border-slate-800 hover:border-sky-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Geofence Tripwires</span>
              <Crosshair className={`w-3.5 h-3.5 ${breachedCount > 0 ? 'text-red-400 animate-spin' : 'text-teal-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${breachedCount > 0 ? 'text-red-400' : 'text-white'}`}>
                {configs.filter(c => c.geofenceEnabled).length}
              </span>
              <span className={`text-[10px] font-bold ${breachedCount > 0 ? 'text-red-400 uppercase animate-pulse' : 'text-teal-400'}`}>
                {breachedCount > 0 ? `${breachedCount} BREACHED` : '100% Enforced'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {breachedCount > 0 ? 'Click to inspect alerts' : 'Virtual corridor alarms'}
            </p>
          </button>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>Critical Incidents</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${criticalAlertsCount > 0 ? 'text-red-400 animate-bounce' : 'text-slate-500'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${criticalAlertsCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {criticalAlertsCount}
              </span>
              <span className="text-[10px] text-slate-400">Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Breaches or attacks</p>
          </div>
        </div>
      </div>

      {/* Automated Geofence Emergency Banner (When Breach is Active or Unacknowledged Alerts Exist) */}
      {(breachedCount > 0 || geofenceNotifs.some(n => !n.acknowledged)) && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950 via-rose-950 to-red-900 border-2 border-red-500 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                  AUTOMATED NOTIFICATION SYSTEM
                </span>
                <span className="text-xs text-red-200 font-mono font-bold">
                  {breachedCount} vehicle(s) outside GPS geofence boundary
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                Admin Alert: Real-time boundary breach detected!
              </h3>
              <p className="text-xs text-red-200/90 mt-0.5">
                Continuous telematics telemetry watchdog flagged vehicles moving outside their pre-defined boundary.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('GEOFENCE_NOTIFICATIONS')}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-red-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Open Geofence Watchdog
            </button>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('admin-gps')}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-red-800/80 hover:bg-red-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-red-600"
              >
                <Car className="w-3.5 h-3.5" />
                Track on GPS Radar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('FLEET_ROSTER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'FLEET_ROSTER'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            Fleet Security Roster ({vehicles.length})
          </button>

          {/* New Geofence Watchdog & Alerts Subtab */}
          <button
            onClick={() => setActiveTab('GEOFENCE_NOTIFICATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'GEOFENCE_NOTIFICATIONS'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Geofence Watchdog & Alerts
            {(breachedCount > 0 || geofenceNotifs.some(n => !n.acknowledged)) && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                {breachedCount || geofenceNotifs.filter(n => !n.acknowledged).length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('ATTACK_SIMULATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ATTACK_SIMULATOR'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            Attack Simulation Lab
          </button>

          <button
            onClick={() => setActiveTab('ALERTS_FEED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ALERTS_FEED'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Incident Log & Threat Feeds
            {criticalAlertsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                {criticalAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ARCHITECTURE_GUIDE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ARCHITECTURE_GUIDE'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            Software Anti-Theft Architecture
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Failsafe Cryptographic Telematics Layer v3.4</span>
        </div>
      </div>


      {/* TAB 1: FLEET SECURITY ROSTER */}
      {activeTab === 'FLEET_ROSTER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const config = theftPreventionService.getConfig(vehicle.id);
              const isPinned = revealedPins[vehicle.id];
              const isLockedOut = config.immobilizerStatus === 'EMERGENCY_LOCKOUT' || config.immobilizerStatus === 'PENDING_SAFE_SHUTDOWN';
              const isArmed = config.immobilizerStatus === 'ARMED';

              return (
                <div 
                  key={vehicle.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                    config.policeIncidentActive
                      ? 'bg-red-950/20 border-red-500/50 shadow-xl shadow-red-500/10'
                      : isLockedOut
                      ? 'bg-amber-950/15 border-amber-500/40 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Top Bar with Thumbnail & Name */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={vehicle.imageUrl} 
                          alt={vehicle.model}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-inner shrink-0" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                              {vehicle.make} {vehicle.model}
                            </h3>
                          </div>
                          <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            {vehicle.licensePlate}
                          </p>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            VIN: {vehicle.vin.slice(0, 10)}...
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {config.policeIncidentActive ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse flex items-center gap-1 shadow-sm">
                            <Flame className="w-3 h-3" />
                            SVR ACTIVE
                          </span>
                        ) : isLockedOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                            <Lock className="w-3 h-3" />
                            KILL SWITCH ON
                          </span>
                        ) : isArmed ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            ARMED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            DISARMED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Telematics Coordinates & Speed */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[200px]" title={config.currentCoordinates.address}>
                            {config.currentCoordinates.address}
                          </span>
                        </span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          config.currentCoordinates.speedKmh > 0 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {config.currentCoordinates.speedKmh} km/h
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Risk Threat Index:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                config.theftRiskScore > 60 ? 'bg-red-500' : config.theftRiskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, config.theftRiskScore))}%` }}
                            />
                          </div>
                          <span className="font-bold">{config.theftRiskScore}/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Toggles Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      {/* PIN-to-Drive */}
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                            <KeyRound className="w-3 h-3 text-indigo-500" />
                            PIN-to-Drive
                          </span>
                          <button
                            onClick={() => handleTogglePinToDrive(vehicle.id)}
                            className={`w-7 h-4 rounded-full transition-colors relative ${config.pinToDriveEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${config.pinToDriveEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Code:</span>
                          <span className="font-mono font-bold tracking-widest text-slate-900 dark:text-white">
                            {isPinned ? config.pinCode : '••••'}
                          </span>
                          <button 
                            onClick={() => togglePinReveal(vehicle.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Reveal PIN"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Geofence Perimeter */}
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                            <Crosshair className="w-3 h-3 text-teal-500" />
                            Geofencing
                          </span>
                          <button
                            onClick={() => handleToggleGeofence(vehicle.id)}
                            className={`w-7 h-4 rounded-full transition-colors relative ${config.geofenceEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${config.geofenceEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {config.geofenceRadiusKm} km radius
                        </p>
                      </div>

                      {/* CAN-Bus Relay Mitigator */}
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                            <Radio className="w-3 h-3 text-amber-500" />
                            Anti-Relay ToF
                          </span>
                          <button
                            onClick={() => handleToggleCanProtection(vehicle.id)}
                            className={`w-7 h-4 rounded-full transition-colors relative ${config.canBusRelayProtection ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${config.canBusRelayProtection ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          ToF latency check
                        </p>
                      </div>

                      {/* Jammer Deadman Sensor */}
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                            <WifiOff className="w-3 h-3 text-red-500" />
                            Jammer Failsafe
                          </span>
                          <button
                            onClick={() => handleToggleJammer(vehicle.id)}
                            className={`w-7 h-4 rounded-full transition-colors relative ${config.jammerDetection ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`block w-3 h-3 rounded-full bg-white transition-transform ${config.jammerDetection ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          Deadman offline lock
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {isLockedOut ? (
                      <button
                        onClick={() => handleDisarm(vehicle)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Disarm Kill Switch
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmKillModal({ vehicle, config })}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-red-600 dark:hover:bg-red-600 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 group"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                        Safe Kill Switch
                      </button>
                    )}

                    <button
                      onClick={() => handleActivateSVR(vehicle)}
                      title="Activate 1-Click Stolen Vehicle Recovery Protocol"
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        config.policeIncidentActive 
                          ? 'bg-red-600 text-white border-red-500' 
                          : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/40'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setPoliceReportVehicle({ vehicle, config })}
                      title="Generate Law Enforcement SVR Dossier"
                      className="p-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: GEOFENCE WATCHDOG & AUTOMATED NOTIFICATIONS */}
      {activeTab === 'GEOFENCE_NOTIFICATIONS' && (
        <GeofenceNotificationCenter
          vehicles={vehicles}
          onOpenVehicleGps={(vehId) => {
            if (onNavigateTab) {
              onNavigateTab('admin-gps');
            }
          }}
          onOpenPoliceReport={(veh) => {
            const cfg = theftPreventionService.getConfig(veh.id);
            setPoliceReportVehicle({ vehicle: veh, config: cfg });
          }}
        />
      )}

      {/* TAB 2: ATTACK SIMULATION LAB */}
      {activeTab === 'ATTACK_SIMULATOR' && (
        <div className="space-y-6">
          <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Automotive Cyber-Physical Sandbox
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Live Anti-Theft Defense Simulator
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Test how Velocity CRMS algorithms intercept real-world automotive attack vectors in real-time. Choose a target vehicle and launch an adversary attack scenario to observe the software response.
              </p>
            </div>

            {/* Target Vehicle Selector */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Vehicle:</span>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.licensePlate})
                  </option>
                ))}
              </select>

              {selectedVehicle && (
                <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Current Speed:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedConfig.currentCoordinates.speedKmh} km/h</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">State:</span>
                  <span className="font-bold text-emerald-400">{selectedConfig.immobilizerStatus}</span>
                </div>
              )}
            </div>

            {/* 5 Attack Vector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              
              {/* 1. CAN-Bus Keyless Relay Attack */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Radio className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      RF Attack
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base mt-3">CAN-Bus Relay Spoofing</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Thief uses bidirectional amplifiers outside renter's home to extend key fob signal into car cabin.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 font-mono border border-slate-800/80">
                    <span className="text-emerald-400">Defense:</span> Software Time-of-Flight (ToF) nanosecond latency check rejects out-of-range roundtrip.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('RELAY_ATTACK')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Simulate Relay Attack
                </button>
              </div>

              {/* 2. Geofence Boundary Escape */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Crosshair className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                      Border Breach
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base mt-3">Geofence Boundary Escape</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Vehicle driven past authorized metro operating perimeter toward border toll plaza at 74 km/h.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 font-mono border border-slate-800/80">
                    <span className="text-emerald-400">Defense:</span> Telematics GPS polygon triggers automated safe throttle-down and dispatches police alert.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('GEOFENCE_ESCAPE')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Simulate Perimeter Escape
                </button>
              </div>

              {/* 3. Flatbed Tow Heist */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Activity className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      Physical Heist
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base mt-3">Flatbed Tow Heist (Engine OFF)</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Car is winched onto a flatbed tow truck while parked with ignition OFF and transported.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 font-mono border border-slate-800/80">
                    <span className="text-emerald-400">Defense:</span> 6-axis IMU accelerometer senses kinetic speed + tilt without ignition; activates SVR beacon.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('FLATBED_TOW')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Simulate Flatbed Tow
                </button>
              </div>

              {/* 4. RF Jammer Deadman */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-red-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <WifiOff className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      Signal Blocker
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base mt-3">Cellular/GPS RF Jammer</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Thieves deploy 1.5 GHz military-style jammer to sever tracking communication with cloud servers.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 font-mono border border-slate-800/80">
                    <span className="text-emerald-400">Defense:</span> Autonomous Deadman switch senses sudden noise-floor saturation and locks starter relay locally.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('RF_JAMMER')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Simulate RF Jammer
                </button>
              </div>

              {/* 5. PIN-to-Drive Brute-Force */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <KeyRound className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] uppercase font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      MFA Bypass
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base mt-3">PIN-to-Drive Guessing</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Intruder attempts multiple rapid code combinations on the in-cabin infotainment touchscreen.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 font-mono border border-slate-800/80">
                    <span className="text-emerald-400">Defense:</span> Exponential backoff lock and renter push verification stops unauthorized startup.
                  </div>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation('BRUTE_PIN')}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Simulate PIN Attack
                </button>
              </div>

            </div>

            {/* Simulation Results Feed */}
            {simulationResult && (
              <div className="mt-8 p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white animate-fade-in shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                        Mitigation Successful
                      </span>
                      <h4 className="font-extrabold text-white text-base">{simulationResult.title}</h4>
                    </div>
                    <p className="text-sm text-slate-300 font-medium">
                      {simulationResult.mitigation}
                    </p>
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
                      <p><span className="text-slate-500">Incident ID:</span> {simulationResult.alert.id}</p>
                      <p><span className="text-slate-500">Action:</span> {simulationResult.alert.actionTaken}</p>
                      <p><span className="text-slate-500">Vehicle:</span> {simulationResult.alert.vehicleName} ({simulationResult.alert.licensePlate})</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALERTS & INCIDENT LOG */}
      {activeTab === 'ALERTS_FEED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Severity:</span>
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filterSeverity === sev
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                alerts.forEach(a => theftPreventionService.resolveAlert(a.id));
                refreshData();
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark All As Resolved
            </button>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">No Security Incidents Detected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  All telematics nodes are reporting nominal operating status and verified GPS coordinates.
                </p>
              </div>
            ) : (
              filteredAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    alert.severity === 'CRITICAL' && !alert.resolved
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900/50'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`p-2.5 rounded-xl ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-500 text-white'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {alert.title}
                          </h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            alert.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                            alert.severity === 'WARNING' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300' :
                            'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {alert.vehicleName} • <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{alert.licensePlate}</span> • {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {!alert.resolved && (
                      <button
                        onClick={() => {
                          theftPreventionService.resolveAlert(alert.id);
                          refreshData();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-emerald-600 text-xs font-bold transition-all shrink-0"
                      >
                        Acknowledge & Resolve
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-200">Mitigation:</strong> {alert.actionTaken}
                    </span>
                    <span className="text-slate-500">
                      Location: {alert.location}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ARCHITECTURE GUIDE */}
      {activeTab === 'ARCHITECTURE_GUIDE' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Engineering Specification
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                Software-Based Car Theft Prevention: Core Pillars
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Modern automotive security has transitioned from physical steering locks and mechanical keys to end-to-end cryptographic software architectures. Here is how modern connected vehicle systems protect against modern vehicle theft vectors:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Pillar 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                  1
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Safe Remote Engine Immobilizer (Digital Kill Switch)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Rather than abrupt engine cutoff which risks dangerous highway steering loss, modern software implements a <strong>two-stage safe interlock</strong>. If the vehicle is in motion, software initiates progressive throttle reduction and illuminates hazard lights, before disengaging starter relays permanently once speed reaches 0 km/h.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
                  2
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Dynamic Geofencing & Polygonal Corridor Tripwires
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Software establishes mathematical coordinate boundaries around authorized metropolitan zones or rental boundaries. The moment high-precision GNSS telemetry crosses unauthorized boundaries, the cloud telematics engine transmits an alarm to dispatch and automatically primes the starter lockout.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  3
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  PIN-to-Drive & Two-Factor (MFA) Ignition Authorization
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Over 85% of luxury car thefts occur via copied key fobs or CAN-bus injection. PIN-to-Drive requires the driver to input an authenticated 4-digit code on the touchscreen or authenticate via biometric smartphone app before the transmission unlocks from Park (P).
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
                  4
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  CAN-Bus Time-of-Flight (ToF) & Jammer Deadman Failsafes
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Keyless relay attacks rely on extending signals over distance. Ultra-Wideband (UWB) Time-of-Flight computes signal speed of light delays to detect distance anomalies. Additionally, if thieves use RF jammers to silence cellular tracking, an autonomous onboard deadman algorithm isolates starter relays offline.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REMOTE KILL SWITCH MODAL */}
      {confirmKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-900 dark:text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">Confirm Remote Kill Switch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You are about to transmit a cryptographic powertrain disable command to:
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono">
                <p className="font-bold text-slate-900 dark:text-white">{confirmKillModal.vehicle.make} {confirmKillModal.vehicle.model}</p>
                <p className="text-slate-500">Plate: {confirmKillModal.vehicle.licensePlate} • Current Speed: {confirmKillModal.config.currentCoordinates.speedKmh} km/h</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <strong>Highway Safety Rule Active:</strong>
              <p>
                If vehicle is traveling above 0 km/h, the system engages progressive throttle governing and hazard flashers, locking the starter relay permanently once standstill is confirmed.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmKillModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteKillSwitch(confirmKillModal.vehicle, confirmKillModal.config)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all shadow-lg shadow-red-600/20"
              >
                Execute Kill Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POLICE INCIDENT SVR DOSSIER MODAL */}
      {policeReportVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-white space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                    Official Law Enforcement SVR Dispatch
                  </span>
                  <h3 className="text-lg font-black mt-1">Stolen Vehicle Incident Dossier</h3>
                </div>
              </div>
              <button 
                onClick={() => setPoliceReportVehicle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">INCIDENT ID:</span>
                <span className="font-bold text-indigo-500">SVR-POLICE-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VEHICLE:</span>
                <span className="font-bold">{policeReportVehicle.vehicle.year} {policeReportVehicle.vehicle.make} {policeReportVehicle.vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VIN:</span>
                <span className="font-bold">{policeReportVehicle.vehicle.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LICENSE PLATE:</span>
                <span className="font-bold text-amber-500">{policeReportVehicle.vehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LAST TELEMETRY GPS:</span>
                <span className="font-bold">{policeReportVehicle.config.currentCoordinates.lat.toFixed(4)}° N, {policeReportVehicle.config.currentCoordinates.lng.toFixed(4)}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">REGISTERED LOCATION:</span>
                <span className="font-bold text-right">{policeReportVehicle.config.currentCoordinates.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LIVE SPEED:</span>
                <span className="font-bold">{policeReportVehicle.config.currentCoordinates.speedKmh} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IMMOBILIZER STATE:</span>
                <span className="font-bold text-red-500">{policeReportVehicle.config.immobilizerStatus}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-bold">Live Police Tracking Stream Active:</p>
              <p className="font-mono text-[11px] mt-1 break-all text-slate-500 dark:text-slate-400">
                https://telematics.velocitycrms.internal/svr/stream?token=auth_{policeReportVehicle.vehicle.id}_{Date.now()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  alert('Police SVR PDF Dossier and GPS telematics stream token copied for emergency dispatch.');
                  setPoliceReportVehicle(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Law Enforcement PDF
              </button>
              <button
                onClick={() => setPoliceReportVehicle(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
