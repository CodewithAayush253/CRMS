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
  AlertCircle
} from 'lucide-react';
import { Vehicle, VehicleCategory, Booking, VehicleReview, Customer } from '../../types';
import { calculateRentalDays } from '../../services/pricingEngine';
import { formatINR } from '../../utils/currency';

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
}

const CATEGORIES: (VehicleCategory | 'All')[] = [
  'All',
  'Sedan',
  'SUV',
  'Luxury',
  'Electric',
  'Sports',
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'All'>('All');
  const [selectedTransmission, setSelectedTransmission] = useState<'All' | 'Automatic' | 'Manual'>('All');
  const [selectedFuel, setSelectedFuel] = useState<'All' | 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  const rentalDays = calculateRentalDays(pickupDate, returnDate);

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
      {/* Account Required Notice (If not logged in) */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">Customer Account Required Before Performing Tasks</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  Step 1
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                As per rental policies, every customer must create an account in the customer panel first with a verified driving license before booking vehicles, submitting reviews, or processing returns.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onRequestAuth('CUSTOMER_SIGNUP', 'book vehicles and manage rentals')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Customer Account
            </button>
            <button
              onClick={() => onRequestAuth('CUSTOMER_LOGIN', 'access your customer portal')}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner with Booking Filter Bar & Manually Filled Locations */}
      <div className="relative bg-slate-900 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-sm border border-slate-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 opacity-15 hidden lg:block pointer-events-none">
          <Car className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Live Fleet Telemetry • Real-Time Availability Updates</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Certified Fleet for Work, Leisure & Expeditions
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl">
            Customizable manual pickup & drop locations, dynamic Strategy pricing with automatic weekly discounts, verified customer reviews, and instant zero-deductible insurance.
          </p>

          {/* Bento Date & Manual Location Widget */}
          <div className="mt-6 bg-slate-950/85 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-800/90 space-y-3.5 text-xs">
            {/* Top Row: Dates & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">Pickup Date</label>
                <div className="flex items-center gap-2.5 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-700 text-white">
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
                <label className="block text-slate-400 font-medium mb-1.5">Return Date</label>
                <div className="flex items-center gap-2.5 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-700 text-white">
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
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 text-center flex flex-col justify-center h-full">
                  <div className="text-slate-400 text-[11px]">
                    Duration: <strong className="text-amber-400 font-bold text-xs">{rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}</strong>
                  </div>
                  {rentalDays >= 7 ? (
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">15% Weekly Discount Included</span>
                  ) : (
                    <span className="text-[10px] text-slate-500 mt-0.5">Daily rate calculation</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Manual Customizable Pickup & Drop Locations */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Manually Filled Pickup Location */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Pickup Location (Manually Filled)
                  </label>
                  <span className="text-[10px] text-slate-400">Custom Address / Hub</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="catalog-pickup-datalist"
                    value={pickupLocation}
                    onChange={(e) => onPickupLocationChange(e.target.value)}
                    placeholder="e.g. Terminal 3 Airport, Connaught Place, MG Road, or Home Delivery"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['IGI T3 Airport', 'BLR Airport', 'Doorstep Delivery', 'Central Hub'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onPickupLocationChange(preset === 'Doorstep Delivery' ? 'Doorstep Hotel / Residence Delivery' : preset)}
                      className="text-[10px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-md border border-slate-800 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manually Filled Return Location */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    Drop / Return Location (Manually Filled)
                  </label>
                  <button
                    type="button"
                    onClick={() => onReturnLocationChange(pickupLocation)}
                    className="text-[10px] font-semibold text-amber-400 hover:underline bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                  >
                    Same as Pickup
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="catalog-return-datalist"
                    value={returnLocation}
                    onChange={(e) => onReturnLocationChange(e.target.value)}
                    placeholder="e.g. Return address, airport hub, or drop point"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <Navigation className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Same as Pickup', 'Airport Terminal', 'One-Way Drop Center'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (preset === 'Same as Pickup') onReturnLocationChange(pickupLocation);
                        else if (preset === 'Airport Terminal') onReturnLocationChange('Airport Return Bay 4');
                        else onReturnLocationChange('One-Way Inter-City Drop Center');
                      }}
                      className="text-[10px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded-md border border-slate-800 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Bento Box */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by make, model (e.g. Tesla, BMW, Audi, Thar, Creta, EV)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}

            <label className="flex items-center gap-1.5 ml-auto text-xs text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="font-semibold">Available Only</span>
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
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-slate-50 text-slate-800 font-medium"
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
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-slate-50 text-slate-800 font-medium"
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
            <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              {formatINR(maxPrice)}/day
            </span>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live Telemetry: Showing <strong className="text-slate-900">{filteredVehicles.length}</strong> vehicle models</span>
          </div>
          <span>Pick-up: <strong className="text-slate-900">{pickupDate}</strong> to <strong className="text-slate-900">{returnDate}</strong></span>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Vehicles Match Your Current Filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try increasing your maximum price slider, adjusting powertrain filters, or viewing all categories.
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
              Reset All Filters
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
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
                >
                  {/* Vehicle Image with Badges */}
                  <div className="relative h-50 bg-slate-950 overflow-hidden">
                    <img
                      src={vehicle.imageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500 text-slate-950 shadow-xs">
                        {vehicle.category}
                      </span>
                      {vehicle.fuelType === 'Electric' && (
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                          <Zap className="w-2.5 h-2.5" />
                          EV
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1.5 ${
                          isAvailable
                            ? 'bg-emerald-600 text-white'
                            : isClash
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isAvailable && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                          </span>
                        )}
                        {isAvailable ? 'AVAILABLE' : isClash ? 'BOOKED ON DATES' : vehicle.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <p className="text-[11px] text-amber-400 font-semibold tracking-wide uppercase">{vehicle.year} {vehicle.make}</p>
                        <h3 className="text-lg font-extrabold leading-snug">{vehicle.model}</h3>
                        
                        {/* Star Rating Badge on Card */}
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 mt-0.5">
                          <span className="flex items-center gap-0.5 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {ratingData.avg}
                          </span>
                          <span className="text-[11px] text-slate-300">({ratingData.count} reviews)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-400 tracking-tight">
                          {formatINR(vehicle.dailyRate)}
                          <span className="text-[11px] font-normal text-slate-300">/day</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content Bento Compartments */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Key Specs Pills Compartment */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                      <div className="flex flex-col items-center justify-center text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                        <span>{vehicle.seats} Seats</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-slate-700 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                        <span>{vehicle.luggageCapacity} Bags</span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-slate-700 font-medium">
                        <Fuel className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                        <span>{vehicle.fuelEfficiency}</span>
                      </div>
                    </div>

                    {/* Features snippet */}
                    <div className="flex flex-wrap gap-1.5">
                      {vehicle.features.slice(0, 3).map((feat, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 font-medium text-slate-700 border border-slate-200/60">
                          {feat}
                        </span>
                      ))}
                      {vehicle.features.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-500 font-medium">
                          +{vehicle.features.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Pricing summary for chosen dates in INR */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Est. Base ({rentalDays}d):</span>
                        <p className="font-extrabold text-slate-900 text-sm">{formatINR(estTotal)}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                        Deposit: {formatINR(vehicle.securityDeposit)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onSelectVehicle(vehicle)}
                        className="px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors"
                      >
                        Specs & Reviews
                      </button>

                      <button
                        id={`catalog-book-btn-${vehicle.id}`}
                        disabled={!isAvailable}
                        onClick={() => {
                          if (!currentUser) {
                            onRequestAuth('CUSTOMER_SIGNUP', `book the ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
                          } else {
                            onBookVehicle(vehicle);
                          }
                        }}
                        className={`px-3 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-xs ${
                          isAvailable
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? (currentUser ? 'Book Vehicle' : 'Create Account & Book') : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
