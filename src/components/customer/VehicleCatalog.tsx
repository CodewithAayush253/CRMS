import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Sparkles, 
  Car, 
  Users, 
  Briefcase, 
  Fuel, 
  Zap, 
  ShieldAlert, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Star,
  CheckCircle2,
  Radio,
  MapPin,
  Navigation,
  UserPlus,
  LogIn,
  AlertCircle,
  GitCompare,
  ShieldCheck
} from 'lucide-react';
import { Vehicle, VehicleCategory, Booking, VehicleReview, Customer } from '../../types';
import { calculateRentalDays } from '../../services/pricingEngine';
import { formatINR } from '../../utils/currency';
import { VehicleCompareModal } from './VehicleCompareModal';

interface VehicleCatalogProps {
  vehicles: Vehicle[];
  existingBookings: Booking[];
  reviews?: VehicleReview[];
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  onPickupDateChange: (date: string) => void;
  onReturnDateChange: (date: string) => void;
  onPickupLocationChange: (loc: string) => void;
  onReturnLocationChange: (loc: string) => void;
  currentUser: Customer | null;
  onRequestAuth: (mode: 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN', task: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBookVehicle: (vehicle: Vehicle) => void;
  onOpenVerificationModal?: () => void;
}

const CATEGORIES: (VehicleCategory | 'All')[] = [
  'All',
  'Sedan',
  'SUV',
  'Luxury',
  'Electric',
  'Sports',
  'Van',
  'Hatchback',
  'Coupe',
];

export const VehicleCatalog: React.FC<VehicleCatalogProps> = ({
  vehicles,
  existingBookings,
  reviews = [],
  pickupDate,
  returnDate,
  pickupLocation,
  returnLocation,
  onPickupDateChange,
  onReturnDateChange,
  onPickupLocationChange,
  onReturnLocationChange,
  currentUser,
  onRequestAuth,
  onSelectVehicle,
  onBookVehicle,
  onOpenVerificationModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'All'>('All');
  const [selectedTransmission, setSelectedTransmission] = useState<'All' | 'Automatic' | 'Manual'>('All');
  const [selectedFuel, setSelectedFuel] = useState<'All' | 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  const rentalDays = calculateRentalDays(pickupDate, returnDate);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const toggleCompare = (vehicleId: string) => {
    if (compareIds.includes(vehicleId)) {
      setCompareIds(compareIds.filter(id => id !== vehicleId));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], vehicleId]);
      } else {
        setCompareIds([...compareIds, vehicleId]);
      }
    }
  };

  // Check real-time date clash for bookings
  const isVehicleBookedForDates = (vehicleId: string): boolean => {
    return existingBookings.some(b => {
      if (b.vehicleId !== vehicleId) return false;
      if (b.status !== 'CONFIRMED' && b.status !== 'ACTIVE') return false;

      const p1 = new Date(pickupDate).getTime();
      const r1 = new Date(returnDate).getTime();
      const p2 = new Date(b.pickupDate).getTime();
      const r2 = new Date(b.returnDate).getTime();

      // Overlap condition
      return Math.max(p1, p2) <= Math.min(r1, r2);
    });
  };

  // Compute rating map for quick lookup
  const vehicleRatingMap = useMemo(() => {
    const map: Record<string, { avg: string; count: number }> = {};

    vehicles.forEach(v => {
      const vReviews = reviews.filter(r => r.vehicleId === v.id && r.status === 'APPROVED');
      if (vReviews.length > 0) {
        const avg = (vReviews.reduce((sum, r) => sum + r.rating, 0) / vReviews.length).toFixed(1);
        map[v.id] = { avg, count: vReviews.length };
      } else {
        map[v.id] = { avg: v.rating.toFixed(1), count: v.reviewCount };
      }
    });

    return map;
  }, [vehicles, reviews]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Search text
      const matchesSearch = 
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== 'All' && v.category !== selectedCategory) return false;

      // Transmission
      if (selectedTransmission !== 'All' && v.transmission !== selectedTransmission) return false;

      // Fuel
      if (selectedFuel !== 'All' && v.fuelType !== selectedFuel) return false;

      // Price
      if (v.dailyRate > maxPrice) return false;

      // Availability
      if (onlyAvailable) {
        if (v.status !== 'AVAILABLE') return false;
        if (isVehicleBookedForDates(v.id)) return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, selectedCategory, selectedTransmission, selectedFuel, maxPrice, onlyAvailable, pickupDate, returnDate, existingBookings]);

  return (
    <div className="space-y-6">
      {/* Verification Notice Banner if Customer is Unverified */}
      {currentUser && currentUser.role === 'ROLE_CUSTOMER' && (!currentUser.profileCompleted || currentUser.dlVerificationStatus !== 'VERIFIED') && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/20 border border-amber-400/40 rounded-2xl p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <span>Identity & Driving Licence Verification Required</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  MoRTH Compliance
                </span>
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                To prevent fraudulent rentals, Indian transport regulations require a verified profile and automated Parivahan Sarathi LMV Driving Licence verification before vehicle reservation.
              </p>
            </div>
          </div>
          {onOpenVerificationModal && (
            <button
              type="button"
              onClick={onOpenVerificationModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Verify Profile & DL Now</span>
            </button>
          )}
        </div>
      )}

      {/* Header & Date/Location Selection Engine */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xs">
        <div className="max-w-3xl mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Available Vehicle Fleet
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Select your rental duration, choose custom pickup and drop locations, and browse our verified fleet with transparent pricing and full insurance options.
          </p>
        </div>

        {/* Date & Location Inputs */}
        <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
          {/* Top Row: Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pick-up Date</label>
              <div className="flex items-center gap-2.5 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-700 text-white">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => onPickupDateChange(e.target.value)}
                  className="bg-transparent w-full text-white text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Return Date</label>
              <div className="flex items-center gap-2.5 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-700 text-white">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="date"
                  value={returnDate}
                  min={pickupDate}
                  onChange={(e) => onReturnDateChange(e.target.value)}
                  className="bg-transparent w-full text-white text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-center flex flex-col justify-center h-full">
                <div className="text-slate-300 text-xs">
                  Duration: <strong className="text-amber-400 font-bold">{rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}</strong>
                </div>
                {rentalDays >= 7 ? (
                  <span className="text-[10px] text-emerald-400 font-medium mt-0.5">15% Weekly Discount Included</span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-0.5">Standard daily billing</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Customizable Pickup & Drop Locations */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Pick-up Location
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => onPickupLocationChange(`Current Location (GPS: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}) - New Delhi Hub`),
                        () => onPickupLocationChange('Connaught Place Central Hub, New Delhi (GPS Detected)')
                      );
                    } else {
                      onPickupLocationChange('Connaught Place Central Hub, New Delhi');
                    }
                  }}
                  className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3 animate-pulse text-amber-400" />
                  Use Current Location
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  list="catalog-pickup-datalist"
                  value={pickupLocation}
                  onChange={(e) => onPickupLocationChange(e.target.value)}
                  placeholder="e.g. Airport Terminal 3, Central Hub, or Hotel Delivery"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <datalist id="catalog-pickup-datalist">
                <option value="Terminal 3, IGI Airport, New Delhi" />
                <option value="Kempegowda International Airport (BLR), Bengaluru" />
                <option value="Chhatrapati Shivaji Maharaj T2, Mumbai" />
                <option value="Connaught Place Central Hub, New Delhi" />
                <option value="Indiranagar 100ft Road, Bengaluru" />
                <option value="Bandra Kurla Complex (BKC), Mumbai" />
                <option value="Doorstep Hotel / Residence Delivery" />
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  Drop-off Location
                </label>
                <button
                  type="button"
                  onClick={() => onReturnLocationChange(pickupLocation)}
                  className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Same as Pick-up
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  list="catalog-return-datalist"
                  value={returnLocation}
                  onChange={(e) => onReturnLocationChange(e.target.value)}
                  placeholder="e.g. Return address or airport bay"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <datalist id="catalog-return-datalist">
                <option value="Terminal 3, IGI Airport, New Delhi" />
                <option value="Kempegowda International Airport (BLR), Bengaluru" />
                <option value="Chhatrapati Shivaji Maharaj T2, Mumbai" />
                <option value="Connaught Place Central Hub, New Delhi" />
                <option value="Indiranagar 100ft Road, Bengaluru" />
                <option value="Bandra Kurla Complex (BKC), Mumbai" />
                <option value="Express One-Way City Drop Center" />
              </datalist>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by make, model (e.g. Creta, Fortuner, BMW, Nexon, Thar)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}

            <label className="flex items-center gap-1.5 ml-auto text-xs text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="font-medium">Available Only</span>
            </label>
          </div>
        </div>

        {/* Secondary Specs Filter Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Transmission:</span>
              <select
                value={selectedTransmission}
                onChange={(e) => setSelectedTransmission(e.target.value as any)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-slate-50 text-slate-800 font-medium focus:outline-hidden focus:border-amber-400"
              >
                <option value="All">All Types</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Powertrain:</span>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value as any)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-slate-50 text-slate-800 font-medium focus:outline-hidden focus:border-amber-400"
              >
                <option value="All">All Powertrains</option>
                <option value="Electric">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>
          </div>

          {/* Price Range Slider in INR */}
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500">Max Daily Rate:</span>
            <input
              type="range"
              min="2000"
              max="25000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-amber-500 w-28 sm:w-36 cursor-pointer"
            />
            <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono tabular-nums">
              {formatINR(maxPrice)}/day
            </span>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900">{filteredVehicles.length}</strong> vehicle models</span>
          <span>Pick-up: <strong className="text-slate-900">{pickupDate}</strong> to <strong className="text-slate-900">{returnDate}</strong></span>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Vehicles Match Your Current Filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your maximum price slider, clearing powertrain filters, or choosing all categories.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedTransmission('All');
                setSelectedFuel('All');
                setMaxPrice(25000);
                setOnlyAvailable(false);
              }}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map((vehicle) => {
              const isClash = isVehicleBookedForDates(vehicle.id);
              const isAvailable = vehicle.status === 'AVAILABLE' && !isClash;
              const estTotal = vehicle.dailyRate * rentalDays;
              const ratingData = vehicleRatingMap[vehicle.id] || { avg: vehicle.rating.toFixed(1), count: vehicle.reviewCount };

              return (
                <div
                  key={vehicle.id}
                  id={`vehicle-card-${vehicle.id}`}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col"
                >
                  {/* Vehicle Image */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img
                      src={vehicle.imageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white border border-slate-700">
                        {vehicle.category}
                      </span>
                      {vehicle.fuelType === 'Electric' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          EV
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${
                          isAvailable
                            ? 'bg-emerald-600 text-white'
                            : isClash
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isAvailable ? 'Available' : isClash ? 'Booked on Dates' : vehicle.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <div>
                        <p className="text-[11px] text-amber-400 font-semibold uppercase">{vehicle.year} {vehicle.make}</p>
                        <h3 className="text-base font-bold leading-tight">{vehicle.model}</h3>
                        
                        <div className="flex items-center gap-1 text-xs text-amber-300 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-xs text-white">{ratingData.avg}</span>
                          <span className="text-[11px] text-slate-300">({ratingData.count})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-amber-400 tracking-tight font-mono tabular-nums">
                          {formatINR(vehicle.dailyRate)}
                          <span className="text-[10px] font-normal text-slate-300">/day</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                    
                    {/* Unboxed Metadata Line with Typographic Separators */}
                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
                      <span>{vehicle.seats} Seats</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{vehicle.luggageCapacity} Bags</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{vehicle.fuelEfficiency}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{vehicle.transmission}</span>
                    </div>

                    {/* Features row */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Anti-Theft Active
                      </span>
                      {vehicle.features.slice(0, 2).map((feat, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {feat}
                        </span>
                      ))}
                      {vehicle.features.length > 2 && (
                        <span className="text-[10px] text-slate-400 font-medium ml-0.5">
                          +{vehicle.features.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Pricing summary for chosen dates */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Trip Total ({rentalDays}d):</span>
                        <p className="font-bold text-slate-900 text-sm font-mono tabular-nums">{formatINR(estTotal)}</p>
                      </div>
                      <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono tabular-nums">
                        Deposit: {formatINR(vehicle.securityDeposit)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onSelectVehicle(vehicle)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Specs & Reviews
                        </button>

                        <button
                          onClick={() => toggleCompare(vehicle.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border flex items-center justify-center gap-1.5 ${
                            compareIds.includes(vehicle.id)
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          {compareIds.includes(vehicle.id) ? 'Comparing' : 'Compare'}
                        </button>
                      </div>

                      <button
                        id={`catalog-book-btn-${vehicle.id}`}
                        disabled={!isAvailable}
                        onClick={() => onBookVehicle(vehicle)}
                        className={`w-full py-2 text-xs font-bold rounded-lg transition-colors shadow-xs ${
                          isAvailable
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? 'Book Vehicle' : 'Unavailable for Selected Dates'}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Comparison Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 text-white backdrop-blur-xl px-6 py-3.5 rounded-3xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-bounce-short">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Comparing {compareIds.length} of 2 vehicles</p>
              <p className="text-[10px] text-slate-400">Select two cars to compare specs side-by-side</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {compareIds.length === 2 ? (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
              >
                Compare Side-by-Side →
              </button>
            ) : (
              <span className="text-xs text-amber-300 italic px-2">Select 1 more</span>
            )}
            <button
              onClick={() => setCompareIds([])}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs transition-colors border border-slate-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Comparison Modal */}
      {isCompareModalOpen && compareIds.length === 2 && (
        <VehicleCompareModal
          vehicle1={vehicles.find(v => v.id === compareIds[0])!}
          vehicle2={vehicles.find(v => v.id === compareIds[1])!}
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveVehicle={(id) => {
            const next = compareIds.filter(vId => vId !== id);
            setCompareIds(next);
            if (next.length < 2) setIsCompareModalOpen(false);
          }}
          onBook={(v) => onBookVehicle(v)}
          currentUser={currentUser}
          onRequestAuth={onRequestAuth}
          rentalDays={rentalDays}
        />
      )}
    </div>
  );
};
