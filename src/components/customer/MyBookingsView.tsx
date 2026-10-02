import React, { useState } from 'react';
import { 
  Calendar, 
  Car, 
  MapPin, 
  Receipt, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Fuel, 
  DollarSign,
  XCircle,
  FileText,
  Star,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Booking, Customer, VehicleReview, Vehicle } from '../../types';
import { calculateLateReturnCharges, calculateCancellationRefund } from '../../services/pricingEngine';
import { formatINR } from '../../utils/currency';
import { CustomerVehicleGpsModal } from '../gps/CustomerVehicleGpsModal';
import { Navigation } from 'lucide-react';

interface MyBookingsViewProps {
  bookings: Booking[];
  currentUser: Customer | null;
  vehicles?: Vehicle[];
  reviews?: VehicleReview[];
  onOpenInvoice: (booking: Booking) => void;
  onOpenReviewModal?: (booking: Booking, existingReview?: VehicleReview) => void;
  onProcessReturn: (
    bookingId: string, 
    hoursLate: number, 
    lateFee: number, 
    fuelFee: number, 
    penaltyNote: string
  ) => void;
  onCancelBooking: (bookingId: string, refundAmount: number, feeAmount: number, reason: string) => void;
  onOpenAuthModal?: (mode: 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN', task?: string) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  currentUser,
  vehicles = [],
  reviews = [],
  onOpenInvoice,
  onOpenReviewModal,
  onProcessReturn,
  onCancelBooking,
  onOpenAuthModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Return Modal state
  const [returningBooking, setReturningBooking] = useState<Booking | null>(null);
  const [simulatedHoursLate, setSimulatedHoursLate] = useState<number>(0);
  const [fuelTankPercent, setFuelTankPercent] = useState<number>(100);

  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');

  // Live GPS tracking modal state
  const [gpsTrackingBooking, setGpsTrackingBooking] = useState<Booking | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto border border-slate-200/90 shadow-sm space-y-4 my-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
          <UserPlus className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Customer Account Required</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          You must create an account in the customer panel first before viewing your reservations, tracking vehicle returns, or downloading official tax invoices.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuthModal?.('CUSTOMER_SIGNUP', 'view your reservations')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Create Customer Account
          </button>
          <button
            onClick={() => onOpenAuthModal?.('CUSTOMER_LOGIN', 'access your bookings')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Filter user bookings
  const userBookings = bookings.filter(b => b.customerId === currentUser.id);
  const displayedBookings = userBookings.filter(b => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  // Calculate simulated late return charges
  const lateCalculation = returningBooking 
    ? calculateLateReturnCharges(
        returningBooking.dailyRate, 
        simulatedHoursLate, 
        Math.max(0, (100 - fuelTankPercent) / 100)
      )
    : null;

  // Calculate cancellation refund
  const cancelCalculation = cancellingBooking
    ? calculateCancellationRefund(cancellingBooking.totalAmount, cancellingBooking.pickupDate)
    : null;

  return (
    <div className="space-y-6">
      {/* Header & Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Reservations & Rental History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track active rentals, access tax invoices, and complete vehicle returns.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs border border-slate-200/80">
          {(['ALL', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === status
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {displayedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Reservations in this Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no reservations matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => {
            const isActive = booking.status === 'ACTIVE';
            const isConfirmed = booking.status === 'CONFIRMED';
            const isCompleted = booking.status === 'COMPLETED';
            const isCancelled = booking.status === 'CANCELLED';

            // Find existing review by this customer for this booking or vehicle
            const existingReview = reviews.find(
              r => (r.bookingId === booking.id || (r.vehicleId === booking.vehicleId && r.customerId === currentUser.id))
            );

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="p-5 flex flex-col md:flex-row gap-5">
                  {/* Vehicle Thumbnail */}
                  <div className="relative w-full md:w-52 h-36 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                    <img
                      src={booking.vehicleImage}
                      alt={booking.vehicleName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white border border-slate-700">
                        {booking.vehicleCategory}
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{booking.vehicleName}</h3>
                          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {booking.licensePlate}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCompleted
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Reservation #{booking.bookingNumber} · Booked on {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Dates & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Pick-up:</span>
                        <div className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{booking.pickupDate}</span>
                          <span className="text-slate-400">({booking.pickupLocation})</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[11px] block">Scheduled Return:</span>
                        <div className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{booking.returnDate}</span>
                          <span className="text-slate-400">({booking.returnLocation})</span>
                        </div>
                      </div>
                    </div>

                    {/* Late fee adjustments if completed */}
                    {booking.lateFee !== undefined && booking.lateFee > 0 && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Late Return Adjustment ({booking.hoursLate} hrs): <strong>+{formatINR(booking.lateFee)}</strong></span>
                        </div>
                        {booking.fuelFee && booking.fuelFee > 0 && (
                          <span>Fuel Charge: <strong>+{formatINR(booking.fuelFee)}</strong></span>
                        )}
                      </div>
                    )}

                    {/* Financial summary & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500">Total Settled (incl. deposit):</span>
                        <span className="text-sm font-bold text-slate-900 ml-1.5 font-mono tabular-nums">
                          {formatINR(booking.finalPaidAmount || booking.totalAmount)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium ml-2">
                          ({booking.paymentStatus})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Live GPS Tracking Button for Active/Confirmed rentals */}
                        {(isActive || isConfirmed) && (
                          <button
                            id={`gps-track-btn-${booking.id}`}
                            onClick={() => setGpsTrackingBooking(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                          >
                            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                            GPS Tracking
                          </button>
                        )}

                        {/* Rating & Review Button for Completed Bookings */}
                        {isCompleted && onOpenReviewModal && (
                          <button
                            id={`review-booking-btn-${booking.id}`}
                            onClick={() => onOpenReviewModal(booking, existingReview)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {existingReview ? `Your Review (${existingReview.rating}★)` : 'Rate & Review'}
                          </button>
                        )}

                        {/* Invoice Button */}
                        <button
                          onClick={() => onOpenInvoice(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          Invoice
                        </button>

                        {/* Cancellation Button (if confirmed) */}
                        {isConfirmed && (
                          <button
                            onClick={() => setCancellingBooking(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}

                        {/* Return Vehicle Button (if active) */}
                        {isActive && (
                          <button
                            id={`return-car-btn-${booking.id}`}
                            onClick={() => {
                              setReturningBooking(booking);
                              setSimulatedHoursLate(0);
                              setFuelTankPercent(100);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Return Vehicle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RETURN CAR MODAL (with late fee calculator in INR) */}
      {returningBooking && lateCalculation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-6">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Vehicle Check-In & Return Inspection</h3>
                <p className="text-xs text-slate-400">
                  {returningBooking.vehicleName} • #{returningBooking.bookingNumber}
                </p>
              </div>
              <button
                onClick={() => setReturningBooking(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Return Condition Simulator */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Interactive Late Return Charges Engine</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  Adjust the sliders below to test how the CRMS calculateLateReturnCharges() business rules compute grace periods, hourly penalties, or multi-day surcharges in INR!
                </p>

                {/* Slider for Hours Late */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-800 mb-1">
                    <span>Return Punctuality (Hours Delayed):</span>
                    <span className="font-mono text-amber-600 font-bold">
                      {simulatedHoursLate === 0 ? 'On Time (0 hrs)' : `${simulatedHoursLate} Hours Late`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    step="1"
                    value={simulatedHoursLate}
                    onChange={(e) => setSimulatedHoursLate(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>0h (Grace period)</span>
                    <span>5h (1.5x hourly)</span>
                    <span>24h (1.5x daily)</span>
                    <span>48h (2 days)</span>
                  </div>
                </div>

                {/* Slider for Fuel Tank Percentage */}
                <div>
                  <div className="flex justify-between font-semibold text-slate-800 mb-1">
                    <span>Fuel Tank Return Level:</span>
                    <span className="font-mono text-slate-800 font-bold">{fuelTankPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="10"
                    value={fuelTankPercent}
                    onChange={(e) => setFuelTankPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>20% (Empty)</span>
                    <span>50% (Half)</span>
                    <span>100% (Full Tank)</span>
                  </div>
                </div>
              </div>

              {/* Penalty Calculation Result */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Return Penalty Assessment:</span>
                  <span className={lateCalculation.lateFee > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {lateCalculation.gracePeriodApplied ? 'Grace Period Applied (No Fee)' : 'Penalty Due'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Late Fee Assessment:</span>
                  <span className="font-bold text-slate-900">{formatINR(lateCalculation.lateFee)}</span>
                </div>
                <p className="text-[11px] text-slate-500 italic">{lateCalculation.penaltyDescription}</p>

                {lateCalculation.fuelFee > 0 && (
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                    <span>Missing Fuel Tank Surcharge:</span>
                    <span className="font-bold text-slate-900">{formatINR(lateCalculation.fuelFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Additional Fee to Settle:</span>
                  <span className="text-base text-amber-600">{formatINR(lateCalculation.totalAdditionalCharge)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setReturningBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                id="confirm-vehicle-return-btn"
                onClick={() => {
                  onProcessReturn(
                    returningBooking.id,
                    simulatedHoursLate,
                    lateCalculation.lateFee,
                    lateCalculation.fuelFee,
                    lateCalculation.penaltyDescription
                  );
                  setReturningBooking(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all"
              >
                Confirm Return & Settle Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL BOOKING MODAL (with refund policy calculator in INR) */}
      {cancellingBooking && cancelCalculation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-6">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Cancel Reservation</h3>
                <p className="text-xs text-slate-400">
                  Booking #{cancellingBooking.bookingNumber} • {cancellingBooking.vehicleName}
                </p>
              </div>
              <button onClick={() => setCancellingBooking(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-rose-900 space-y-1">
                <p className="font-bold">Automated Refund Policy</p>
                <p className="text-[11px] text-rose-800">{cancelCalculation.policyNote}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Originally Paid Amount:</span>
                  <span className="font-semibold text-slate-900">{formatINR(cancellingBooking.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cancellation Administrative Fee:</span>
                  <span className="font-semibold text-rose-600">-{formatINR(cancelCalculation.feeAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Eligible Refund to Original Account:</span>
                  <span className="text-base text-emerald-600 font-black">{formatINR(cancelCalculation.refundAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Change of travel plans">Change of travel plans</option>
                  <option value="Found alternative transportation">Found alternative transportation</option>
                  <option value="Booking date error">Booking date error</option>
                  <option value="Personal emergency">Personal emergency</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Keep Booking
              </button>
              <button
                id="confirm-cancellation-btn"
                onClick={() => {
                  onCancelBooking(
                    cancellingBooking.id, 
                    cancelCalculation.refundAmount, 
                    cancelCalculation.feeAmount, 
                    cancelReason
                  );
                  setCancellingBooking(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all"
              >
                Confirm Cancellation & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER LIVE GPS MODAL */}
      {gpsTrackingBooking && (
        <CustomerVehicleGpsModal
          vehicle={
            (vehicles && vehicles.find(v => v.id === gpsTrackingBooking.vehicleId)) || {
              id: gpsTrackingBooking.vehicleId,
              vin: '1HGCR2F83HA108291',
              make: gpsTrackingBooking.vehicleName.split(' ')[0],
              model: gpsTrackingBooking.vehicleName.split(' ').slice(1).join(' '),
              year: 2024,
              category: gpsTrackingBooking.vehicleCategory,
              transmission: 'Automatic',
              fuelType: 'Petrol',
              seats: 5,
              luggageCapacity: 3,
              dailyRate: gpsTrackingBooking.dailyRate,
              securityDeposit: gpsTrackingBooking.securityDeposit,
              status: gpsTrackingBooking.status === 'ACTIVE' ? 'RENTED' : 'AVAILABLE',
              mileage: 14200,
              licensePlate: gpsTrackingBooking.licensePlate,
              features: ['Live GPS Tracking', 'Anti-Theft Shield', 'PIN-to-Drive'],
              imageUrl: gpsTrackingBooking.vehicleImage,
              rating: 4.9,
              reviewCount: 24,
              location: gpsTrackingBooking.pickupLocation,
              horsepower: 240,
              fuelEfficiency: '16 km/l',
            }
          }
          booking={gpsTrackingBooking}
          onClose={() => setGpsTrackingBooking(null)}
        />
      )}
    </div>
  );
};
