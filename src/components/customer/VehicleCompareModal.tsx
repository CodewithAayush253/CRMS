import React from 'react';
import { 
  X, 
  Car, 
  Zap, 
  Fuel, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  Gauge
} from 'lucide-react';
import { Vehicle, Customer } from '../../types';
import { formatINR } from '../../utils/currency';

interface VehicleCompareModalProps {
  vehicle1: Vehicle;
  vehicle2: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onRemoveVehicle: (id: string) => void;
  onBook: (vehicle: Vehicle) => void;
  currentUser: Customer | null;
  onRequestAuth: (mode: 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN', task: string) => void;
  rentalDays: number;
}

export const VehicleCompareModal: React.FC<VehicleCompareModalProps> = ({
  vehicle1,
  vehicle2,
  isOpen,
  onClose,
  onRemoveVehicle,
  onBook,
  currentUser,
  onRequestAuth,
  rentalDays,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Side-by-Side Vehicle Comparison</h2>
              <p className="text-xs text-slate-500">Comparing specifications, daily rates, and features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[vehicle1, vehicle2].map((vehicle, idx) => {
              if (!vehicle) {
                return (
                  <div key={idx} className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                    <Car className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-400">Select another vehicle from the catalog to compare</p>
                  </div>
                );
              }

              const estTotal = vehicle.dailyRate * rentalDays;

              return (
                <div key={vehicle.id} className="bg-slate-50/80 rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between shadow-xs relative group">
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveVehicle(vehicle.id)}
                    className="absolute top-4 right-4 z-10 w-7 h-7 bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full shadow-xs border border-slate-200 flex items-center justify-center transition-colors text-xs font-bold"
                    title="Remove from comparison"
                  >
                    ×
                  </button>

                  <div>
                    {/* Vehicle image & Title */}
                    <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-950 mb-4 shadow-xs">
                      <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 uppercase tracking-wide">
                          {vehicle.category}
                        </span>
                        <h3 className="text-base font-extrabold mt-1">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                        <p className="text-[11px] text-amber-300 font-medium">{vehicle.location}</p>
                      </div>
                    </div>

                    {/* Highlight Specs Table */}
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Daily Rate (Price)</span>
                        <span className="font-black text-amber-600 text-sm">{formatINR(vehicle.dailyRate)} <span className="text-[10px] font-normal text-slate-500">/day</span></span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Est. Total ({rentalDays} days)</span>
                        <span className="font-extrabold text-slate-900">{formatINR(estTotal)}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Powertrain / Fuel</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          {vehicle.fuelType === 'Electric' ? <Zap className="w-3.5 h-3.5 text-emerald-500" /> : <Fuel className="w-3.5 h-3.5 text-amber-500" />}
                          {vehicle.fuelType} ({vehicle.fuelEfficiency})
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Transmission</span>
                        <span className="font-bold text-slate-900">{vehicle.transmission}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Capacity</span>
                        <span className="font-bold text-slate-900 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {vehicle.seats} Seats</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {vehicle.luggageCapacity} Bags</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Engine / Power</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-amber-500" />
                          {vehicle.horsepower} HP
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Security Deposit</span>
                        <span className="font-bold text-slate-900">{formatINR(vehicle.securityDeposit)}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                        <span className="text-slate-500 font-medium">Rating & Reviews</span>
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {vehicle.rating.toFixed(1)} ({vehicle.reviewCount} reviews)
                        </span>
                      </div>

                      {/* Features list */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200/60 space-y-1.5">
                        <span className="text-slate-500 font-medium block">Key Features</span>
                        <div className="flex flex-wrap gap-1">
                          {vehicle.features.map((feat, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200/60">
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-3 border-t border-slate-200/80">
                    <button
                      onClick={() => {
                        onClose();
                        onBook(vehicle);
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>Book This Vehicle</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>Comparing up to 2 vehicles side-by-side</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors text-xs"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
};
