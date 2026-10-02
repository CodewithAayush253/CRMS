import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  MapPin, 
  Lock, 
  Eye, 
  Radio, 
  AlertCircle, 
  Smartphone, 
  Zap, 
  CheckCircle2, 
  Car, 
  X,
  PhoneCall
} from 'lucide-react';
import { Vehicle, VehicleSecurityConfig } from '../../types';
import { theftPreventionService } from '../../services/theftPreventionService';

interface CustomerSecurityShieldModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  bookingNumber?: string;
}

export const CustomerSecurityShieldModal: React.FC<CustomerSecurityShieldModalProps> = ({
  vehicle,
  onClose,
  bookingNumber,
}) => {
  const config = theftPreventionService.getConfig(vehicle.id);
  const [showPin, setShowPin] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const handleTriggerSOS = () => {
    setSosSent(true);
    theftPreventionService.addAlert({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      severity: 'WARNING',
      type: 'SAFE_IMMOBILIZER_EXECUTED',
      title: 'Customer Emergency SOS Request',
      description: `Renter initiated emergency safety check for vehicle ${vehicle.licensePlate}. Renter contact alerted.`,
      actionTaken: '24/7 Security Concierge dispatch pinged; vehicle status monitored.',
      location: config.currentCoordinates.address,
      speedKmh: config.currentCoordinates.speedKmh,
      resolved: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-white space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Velocity Cyber-Shield Active
              </span>
              <h3 className="text-xl font-black mt-1">Vehicle Theft Prevention</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Preview Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <img 
            src={vehicle.imageUrl} 
            alt={vehicle.model} 
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {vehicle.make} {vehicle.model}
            </h4>
            <p className="text-xs font-mono font-bold text-amber-500">
              {vehicle.licensePlate}
            </p>
            {bookingNumber && (
              <p className="text-[11px] text-slate-500">
                Reservation: {bookingNumber}
              </p>
            )}
          </div>
        </div>

        {/* PIN-to-Drive Showcase for Customer */}
        {config.pinToDriveEnabled && (
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Your Secret PIN-to-Drive Code:
              </span>
              <button
                onClick={() => setShowPin(!showPin)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPin ? 'Hide' : 'Reveal'}
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900">
              <span className="font-mono text-2xl font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                {showPin ? config.pinCode : '• • • •'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px] text-right">
                Enter on the dashboard screen before shifting out of Park (P).
              </span>
            </div>
          </div>
        )}

        {/* Protection Features List */}
        <div className="space-y-2.5 text-xs">
          <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Software Defenses Running On This Car:
          </h5>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">CAN-Bus Anti-Relay Spoofing Protection:</strong>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Rejects amplified wireless key fob cloning attacks using speed-of-light Time-of-Flight verification.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Dynamic Geofence Perimeter:</strong>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Protected within <strong>{config.geofenceZoneName}</strong> ({config.geofenceRadiusKm} km). Out-of-bounds driving triggers automated advisory.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Safe Remote Starter Immobilizer:</strong>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                In case of attempted theft or carjacking, dispatch can safely lock out the ignition without causing highway hazard.
              </p>
            </div>
          </div>
        </div>

        {/* SOS / Assistance Button */}
        <div className="pt-2 flex items-center gap-3">
          {sosSent ? (
            <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Safety Concierge Alerted! We'll call your phone shortly.
            </div>
          ) : (
            <button
              onClick={handleTriggerSOS}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              Report Security Concern / SOS
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
