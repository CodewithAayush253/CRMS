import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Briefcase, 
  Fuel, 
  Gauge, 
  CheckCircle2, 
  MapPin, 
  Star, 
  Shield, 
  Calendar,
  Zap,
  MessageSquare,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Vehicle, VehicleReview } from '../../types';
import { formatINR } from '../../utils/currency';

interface CarDetailsModalProps {
  vehicle: Vehicle | null;
  reviews?: VehicleReview[];
  onClose: () => void;
  onBookNow: (vehicle: Vehicle) => void;
  pickupDate: string;
  returnDate: string;
}

export const CarDetailsModal: React.FC<CarDetailsModalProps> = ({
  vehicle,
  reviews = [],
  onClose,
  onBookNow,
  pickupDate,
  returnDate,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REVIEWS'>('OVERVIEW');
  if (!vehicle) return null;

  const isAvailable = vehicle.status === 'AVAILABLE';

  // Filter approved reviews for this vehicle
  const vehicleReviews = reviews.filter(
    r => r.vehicleId === vehicle.id && r.status === 'APPROVED'
  );

  const averageRating = vehicleReviews.length > 0
    ? (vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length).toFixed(1)
    : vehicle.rating.toFixed(1);

  const reviewCount = vehicleReviews.length > 0 ? vehicleReviews.length : vehicle.reviewCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div 
        id={`car-details-modal-${vehicle.id}`}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 my-8"
      >
        {/* Header Image & Close */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden">
          <img 
            src={vehicle.imageUrl} 
            alt={`${vehicle.make} ${vehicle.model}`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on Image */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-xs">
              {vehicle.category}
            </span>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs ${
              isAvailable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {vehicle.status}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-400 font-bold">{vehicle.year} {vehicle.make}</p>
              <h2 className="text-2xl font-extrabold leading-tight">{vehicle.model}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  {averageRating} ({reviewCount} reviews)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {vehicle.location}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-amber-400">
                {formatINR(vehicle.dailyRate)}
                <span className="text-xs font-normal text-slate-300">/day</span>
              </div>
              <p className="text-[11px] text-slate-400">Deposit: {formatINR(vehicle.securityDeposit)}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation in Modal */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3 text-xs font-bold tracking-tight border-b-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vehicle Specifications
          </button>
          <button
            onClick={() => setActiveTab('REVIEWS')}
            className={`pb-3 text-xs font-bold tracking-tight border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'REVIEWS'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Customer Reviews</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {reviewCount}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[55vh] overflow-y-auto">
          {activeTab === 'OVERVIEW' ? (
            <>
              {/* Key Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-[11px]">Passengers</p>
                    <p className="font-bold text-slate-900">{vehicle.seats} Seats</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-[11px]">Luggage</p>
                    <p className="font-bold text-slate-900">{vehicle.luggageCapacity} Bags</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-[11px]">Fuel / Range</p>
                    <p className="font-bold text-slate-900">{vehicle.fuelEfficiency}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium text-[11px]">Powertrain</p>
                    <p className="font-bold text-slate-900">{vehicle.horsepower} HP ({vehicle.transmission})</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Tech Specifications */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Vehicle Specs & Identifiers</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">License Plate:</span>
                    <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{vehicle.licensePlate}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">VIN Number:</span>
                    <span className="font-mono text-slate-700">{vehicle.vin}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Current Odometer:</span>
                    <span className="font-medium text-slate-800">{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Fuel Powertrain:</span>
                    <span className="font-medium text-slate-800">{vehicle.fuelType}</span>
                  </div>
                </div>
              </div>

              {/* Included Features */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Vehicle Amenities & Safety</h3>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies & Assurance */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">CRMS Rental Guarantees</p>
                  <p className="text-amber-800/90 mt-0.5">
                    Free cancellation up to 48 hours before pickup. Multi-point sanitized inspection certified before every handoff. 24/7 roadside assistance included across India.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* REVIEWS TAB */
            <div className="space-y-4">
              {/* Overall Rating Box */}
              <div className="flex items-center justify-between p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-extrabold text-amber-900">{averageRating}</div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${Number(averageRating) >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">Based on {reviewCount} verified completed trips</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Renters
                </span>
              </div>

              {/* List of reviews */}
              {vehicleReviews.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No public reviews have been submitted for this vehicle yet. Be the first to rent and leave feedback!
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleReviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{rev.customerName}</span>
                            <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${rev.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.title && (
                        <h4 className="font-bold text-slate-900 text-xs">&ldquo;{rev.title}&rdquo;</h4>
                      )}
                      <p className="text-slate-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            <span>Selected Dates: </span>
            <span className="font-semibold text-slate-900">{pickupDate} to {returnDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              id={`book-now-modal-btn-${vehicle.id}`}
              disabled={!isAvailable}
              onClick={() => {
                onClose();
                onBookNow(vehicle);
              }}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                isAvailable 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isAvailable ? 'Proceed to Book' : 'Currently Unavailable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
