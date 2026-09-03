import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Navigation, 
  MapPin,
  UserCheck, 
  Baby, 
  LifeBuoy, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  Percent,
  Receipt,
  FileCheck
} from 'lucide-react';
import { Vehicle, Customer, Booking, PaymentTransaction, InsuranceType, AddOnOptions } from '../../types';
import { calculateRentalDays, calculateRentalPrice, INSURANCE_RATES, ADD_ON_DAILY_RATES } from '../../services/pricingEngine';
import { formatINR } from '../../utils/currency';

interface BookingModalProps {
  vehicle: Vehicle | null;
  currentUser: Customer;
  initialPickupDate: string;
  initialReturnDate: string;
  initialPickupLocation?: string;
  initialReturnLocation?: string;
  onClose: () => void;
  onBookingSuccess: (newBooking: Booking, newPayment: PaymentTransaction) => void;
  onOpenInvoice: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  vehicle,
  currentUser,
  initialPickupDate,
  initialReturnDate,
  initialPickupLocation,
  initialReturnLocation,
  onClose,
  onBookingSuccess,
  onOpenInvoice,
}) => {
  if (!vehicle) return null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [pickupLocation, setPickupLocation] = useState(initialPickupLocation || vehicle.location || 'Terminal 3, IGI Airport, New Delhi');
  const [returnLocation, setReturnLocation] = useState(initialReturnLocation || vehicle.location || 'Terminal 3, IGI Airport, New Delhi');
  
  // Insurance & Addons
  const [insuranceType, setInsuranceType] = useState<InsuranceType>('BASIC');
  const [addOns, setAddOns] = useState<AddOnOptions>({
    gps: false,
    childSeat: false,
    extraDriver: false,
    roadsideAssistance: true,
  });

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI'>('CREDIT_CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 9012');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('382');
  const [cardName, setCardName] = useState(currentUser.name);
  const [upiId, setUpiId] = useState('alex.rivera@oksbi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const rentalDays = calculateRentalDays(pickupDate, returnDate);
  const priceCalc = calculateRentalPrice(
    vehicle.dailyRate,
    rentalDays,
    insuranceType,
    addOns,
    vehicle.securityDeposit
  );

  const handleToggleAddOn = (key: keyof AddOnOptions) => {
    setAddOns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const bookingNumber = `CRMS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const txnId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const newBooking: Booking = {
        id: `book-${Date.now()}`,
        bookingNumber,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        vehicleCategory: vehicle.category,
        vehicleImage: vehicle.imageUrl,
        licensePlate: vehicle.licensePlate,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        pickupDate,
        returnDate,
        pickupLocation,
        returnLocation,
        status: 'CONFIRMED',
        rentalDays,
        dailyRate: vehicle.dailyRate,
        basePrice: priceCalc.basePrice,
        discountAmount: priceCalc.discountAmount,
        discountLabel: priceCalc.discountStrategy,
        insuranceType,
        insuranceCost: priceCalc.insuranceTotal,
        addOns,
        addOnsCost: priceCalc.addOnsTotal,
        taxes: priceCalc.taxes,
        securityDeposit: priceCalc.securityDeposit,
        totalAmount: priceCalc.totalAmount,
        paymentStatus: 'PAID',
        paymentMethod: `${paymentMethod === 'CREDIT_CARD' ? 'Visa / Mastercard' : paymentMethod === 'DEBIT_CARD' ? 'RuPay / Debit' : 'UPI Instant'}${paymentMethod !== 'UPI' ? ' (•••• 9012)' : ` (${upiId})`}`,
        transactionId: txnId,
        createdAt: new Date().toISOString(),
      };

      const newPayment: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        transactionId: txnId,
        bookingId: newBooking.id,
        bookingNumber,
        customerName: currentUser.name,
        amount: priceCalc.totalAmount,
        method: paymentMethod,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        cardLast4: paymentMethod !== 'UPI' ? '9012' : undefined,
        type: 'RENTAL_PAYMENT',
      };

      setIsProcessing(false);
      setCompletedBooking(newBooking);
      onBookingSuccess(newBooking, newPayment);
      setStep(4);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div 
        id="crms-booking-modal"
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 my-6"
      >
        {/* Header with Progress Steps */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-xs">
                {step}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">Car Rental Reservation Wizard</h2>
                <p className="text-xs text-slate-400">
                  {vehicle.year} {vehicle.make} {vehicle.model} • {formatINR(vehicle.dailyRate)}/day
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className={`text-center pb-1 border-b-2 transition-colors ${step >= 1 ? 'border-amber-400 text-amber-400 font-semibold' : 'border-slate-800 text-slate-500'}`}>
              1. Dates & Hub
            </div>
            <div className={`text-center pb-1 border-b-2 transition-colors ${step >= 2 ? 'border-amber-400 text-amber-400 font-semibold' : 'border-slate-800 text-slate-500'}`}>
              2. Protection & Extras
            </div>
            <div className={`text-center pb-1 border-b-2 transition-colors ${step >= 3 ? 'border-amber-400 text-amber-400 font-semibold' : 'border-slate-800 text-slate-500'}`}>
              3. Pricing & Pay
            </div>
            <div className={`text-center pb-1 border-b-2 transition-colors ${step >= 4 ? 'border-amber-400 text-amber-400 font-semibold' : 'border-slate-800 text-slate-500'}`}>
              4. Confirmed
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[62vh] overflow-y-auto">
          {/* STEP 1: Dates & Locations */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img src={vehicle.imageUrl} alt={vehicle.model} className="w-20 h-14 object-cover rounded-xl" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{vehicle.make} {vehicle.model}</h3>
                  <p className="text-xs text-slate-500">Plate: <span className="font-mono font-semibold text-slate-700">{vehicle.licensePlate}</span> • {vehicle.seats} seats • {vehicle.transmission}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Manual Pickup Location */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        Custom Pickup Location (Manually Filled)
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        list="modal-pickup-suggestions"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder="Type address, airport terminal, hotel, or station..."
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <datalist id="modal-pickup-suggestions">
                      <option value="Terminal 3, IGI Airport, New Delhi" />
                      <option value="Kempegowda International Airport (BLR), Bengaluru" />
                      <option value="Chhatrapati Shivaji Maharaj T2, Mumbai" />
                      <option value="Connaught Place Central Hub, New Delhi" />
                      <option value="MG Road / Indiranagar, Bengaluru" />
                      <option value="Bandra Kurla Complex (BKC), Mumbai" />
                      <option value="Doorstep Hotel / Residence Delivery" />
                    </datalist>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['IGI Airport T3', 'BLR Airport', 'Doorstep Delivery', 'City Hub'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPickupLocation(preset === 'Doorstep Delivery' ? 'Doorstep Hotel / Residence Delivery' : preset)}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 rounded-md transition-colors"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Return / Drop Location */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        Custom Drop / Return Location (Manually Filled)
                      </label>
                      <button
                        type="button"
                        onClick={() => setReturnLocation(pickupLocation)}
                        className="text-[10px] font-semibold text-amber-700 hover:underline bg-amber-50 px-2 py-0.5 rounded"
                      >
                        Same as Pickup
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        list="modal-return-suggestions"
                        value={returnLocation}
                        onChange={(e) => setReturnLocation(e.target.value)}
                        placeholder="Type return address, hub, or airport..."
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                      />
                      <Navigation className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <datalist id="modal-return-suggestions">
                      <option value="Terminal 3, IGI Airport, New Delhi" />
                      <option value="Kempegowda International Airport (BLR), Bengaluru" />
                      <option value="Chhatrapati Shivaji Maharaj T2, Mumbai" />
                      <option value="Connaught Place Central Hub, New Delhi" />
                      <option value="MG Road / Indiranagar, Bengaluru" />
                      <option value="Bandra Kurla Complex (BKC), Mumbai" />
                      <option value="Express One-Way City Drop" />
                    </datalist>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['Same as Pickup', 'Airport Terminal', 'One-Way Drop'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (preset === 'Same as Pickup') setReturnLocation(pickupLocation);
                            else if (preset === 'Airport Terminal') setReturnLocation('Airport Return Bay 4');
                            else setReturnLocation('One-Way Inter-City Drop Center');
                          }}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <span>Total Duration: <strong>{rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}</strong></span>
                {rentalDays >= 7 && (
                  <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-[11px]">
                    🎉 15% Weekly Discount Applies!
                  </span>
                )}
                {rentalDays >= 3 && rentalDays < 7 && (
                  <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-[11px]">
                    ✨ 5% Multi-Day Discount Applies!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Protection & Add-ons */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Select Protection Plan (Per Day)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInsuranceType('BASIC')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      insuranceType === 'BASIC'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Basic Liability</div>
                    <div className="text-amber-600 font-bold mt-1">{formatINR(INSURANCE_RATES.BASIC)}/day</div>
                    <p className="text-[11px] text-slate-500 mt-1">State minimum third-party motor insurance.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInsuranceType('COLLISION_WAIVER')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      insuranceType === 'COLLISION_WAIVER'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900">CDW & Theft</div>
                    <div className="text-amber-600 font-bold mt-1">{formatINR(INSURANCE_RATES.COLLISION_WAIVER)}/day</div>
                    <p className="text-[11px] text-slate-500 mt-1">Covers collision damages & vehicle theft protection.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInsuranceType('PREMIUM')}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                      insuranceType === 'PREMIUM'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900">Premium Zero-Excess</div>
                    <div className="text-amber-600 font-bold mt-1">{formatINR(INSURANCE_RATES.PREMIUM)}/day</div>
                    <p className="text-[11px] text-slate-500 mt-1">Zero deductible, windshield, tires & personal luggage.</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Add-on Accessories & Services
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={addOns.gps}
                        onChange={() => handleToggleAddOn('gps')}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <Navigation className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">GPS Satellite Navigation Unit</span>
                        <p className="text-[11px] text-slate-500">Live traffic updates & offline maps</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">+{formatINR(ADD_ON_DAILY_RATES.gps)}/day</span>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={addOns.childSeat}
                        onChange={() => handleToggleAddOn('childSeat')}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <Baby className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">Child Safety Seat (All Ages)</span>
                        <p className="text-[11px] text-slate-500">Sanitized booster / infant safety seat</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">+{formatINR(ADD_ON_DAILY_RATES.childSeat)}/day</span>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={addOns.extraDriver}
                        onChange={() => handleToggleAddOn('extraDriver')}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <UserCheck className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">Additional Registered Driver</span>
                        <p className="text-[11px] text-slate-500">Authorize a secondary driver on the rental contract</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">+{formatINR(ADD_ON_DAILY_RATES.extraDriver)}/day</span>
                  </label>

                  <label className="flex items-center justify-between p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={addOns.roadsideAssistance}
                        onChange={() => handleToggleAddOn('roadsideAssistance')}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <LifeBuoy className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">24/7 Roadside Assistance Plus</span>
                        <p className="text-[11px] text-slate-500">Towing, battery jump, lockout and flat tire rescue</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">+{formatINR(ADD_ON_DAILY_RATES.roadsideAssistance)}/day</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing Engine Breakdown & Payment */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Itemized Price Calculation */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">Java Strategy Price Calculation</span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {priceCalc.discountStrategy}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Base Rate: {formatINR(vehicle.dailyRate)}/day × {rentalDays} days</span>
                  <span>{formatINR(priceCalc.basePrice)}</span>
                </div>

                {priceCalc.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Duration Discount ({priceCalc.discountPercent}% off):</span>
                    <span>-{formatINR(priceCalc.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Protection Plan ({insuranceType}):</span>
                  <span>{formatINR(priceCalc.insuranceTotal)}</span>
                </div>

                {priceCalc.addOnsTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Add-ons & Equipment:</span>
                    <span>{formatINR(priceCalc.addOnsTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Goods & Services Tax (GST 18%):</span>
                  <span>{formatINR(priceCalc.taxes)}</span>
                </div>

                <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-200">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-mono font-medium text-slate-800">{formatINR(priceCalc.securityDeposit)}</span>
                </div>

                <div className="flex justify-between items-center pt-1 text-sm font-black text-slate-900">
                  <span>Total Amount Due (including deposit):</span>
                  <span className="text-base text-amber-600 font-black">{formatINR(priceCalc.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Card Simulation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Payment Gateway (INR ₹)
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>JWT 256-bit Encrypted</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'CREDIT_CARD' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DEBIT_CARD')}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'DEBIT_CARD' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Debit Card / RuPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'UPI' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    UPI / Google Pay
                  </button>
                </div>

                {paymentMethod !== 'UPI' ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-0.5 font-medium">Cardholder Full Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-slate-600 mb-0.5 font-medium">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Exp / CVV</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-1/2 px-2 py-2 border border-slate-300 rounded-xl text-center font-mono text-xs"
                          />
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            maxLength={4}
                            className="w-1/2 px-2 py-2 border border-slate-300 rounded-xl text-center font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <label className="block text-slate-700 font-medium">Virtual Payment Address (UPI ID / VPA)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-slate-500">Supports Google Pay, PhonePe, Paytm, and BHIM UPI.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Completed Confirmation */}
          {step === 4 && completedBooking && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Booking Confirmed & Paid!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Confirmation #{completedBooking.bookingNumber} • Transaction #{completedBooking.transactionId}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rented Vehicle:</span>
                  <span className="font-semibold text-slate-900">{completedBooking.vehicleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Date:</span>
                  <span className="font-semibold text-slate-900">{completedBooking.pickupDate} ({completedBooking.pickupLocation})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Date:</span>
                  <span className="font-semibold text-slate-900">{completedBooking.returnDate} ({completedBooking.returnLocation})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Charged:</span>
                  <span className="font-bold text-amber-600">{formatINR(completedBooking.totalAmount)} (Paid)</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  id="view-invoice-receipt-btn"
                  onClick={() => {
                    onClose();
                    onOpenInvoice(completedBooking);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition-colors"
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  View Invoice & Receipt
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Steps 1-3) */}
        {step < 4 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => (prev - 1) as any)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step === 3 ? (
                <button
                  id="confirm-pay-booking-btn"
                  disabled={isProcessing}
                  onClick={handleProcessPayment}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Authorizing UPI / Card...</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Pay {formatINR(priceCalc.totalAmount)} & Confirm
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(prev => (prev + 1) as any)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl shadow-xs transition-all hover:scale-[1.02]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
