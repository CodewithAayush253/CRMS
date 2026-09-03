import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Wrench, 
  RotateCcw,
  Sliders,
  DollarSign,
  MapPin,
  X
} from 'lucide-react';
import { Vehicle, VehicleCategory, VehicleStatus, FuelType, TransmissionType } from '../../types';
import { formatINR } from '../../utils/currency';

interface FleetManagementProps {
  vehicles: Vehicle[];
  onAddVehicle: (newVehicle: Vehicle) => void;
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
}

export const FleetManagement: React.FC<FleetManagementProps> = ({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2024);
  const [category, setCategory] = useState<VehicleCategory>('Sedan');
  const [transmission, setTransmission] = useState<TransmissionType>('Automatic');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [seats, setSeats] = useState(5);
  const [luggageCapacity, setLuggageCapacity] = useState(3);
  const [dailyRate, setDailyRate] = useState(75);
  const [securityDeposit, setSecurityDeposit] = useState(200);
  const [status, setStatus] = useState<VehicleStatus>('AVAILABLE');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [location, setLocation] = useState('Downtown Hub (Central)');
  const [imageUrl, setImageUrl] = useState('');
  const [horsepower, setHorsepower] = useState(250);
  const [fuelEfficiency, setFuelEfficiency] = useState('32 MPG');

  const openAddModal = () => {
    setEditingVehicle(null);
    setMake('');
    setModel('');
    setYear(2024);
    setCategory('Sedan');
    setTransmission('Automatic');
    setFuelType('Petrol');
    setSeats(5);
    setLuggageCapacity(3);
    setDailyRate(75);
    setSecurityDeposit(200);
    setStatus('AVAILABLE');
    setLicensePlate(`CR-${Math.floor(100 + Math.random() * 900)}-NY`);
    setVin(`1HGCR${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    setLocation('Downtown Hub (Central)');
    setImageUrl('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80');
    setHorsepower(220);
    setFuelEfficiency('34 MPG');
    setIsModalOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setMake(veh.make);
    setModel(veh.model);
    setYear(veh.year);
    setCategory(veh.category);
    setTransmission(veh.transmission);
    setFuelType(veh.fuelType);
    setSeats(veh.seats);
    setLuggageCapacity(veh.luggageCapacity);
    setDailyRate(veh.dailyRate);
    setSecurityDeposit(veh.securityDeposit);
    setStatus(veh.status);
    setLicensePlate(veh.licensePlate);
    setVin(veh.vin);
    setLocation(veh.location);
    setImageUrl(veh.imageUrl);
    setHorsepower(veh.horsepower);
    setFuelEfficiency(veh.fuelEfficiency);
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingVehicle) {
      // Update
      const updated: Vehicle = {
        ...editingVehicle,
        make,
        model,
        year,
        category,
        transmission,
        fuelType,
        seats,
        luggageCapacity,
        dailyRate,
        securityDeposit,
        status,
        licensePlate,
        vin,
        location,
        imageUrl,
        horsepower,
        fuelEfficiency,
      };
      onUpdateVehicle(updated);
    } else {
      // Create new
      const created: Vehicle = {
        id: `veh-${Date.now()}`,
        make,
        model,
        year,
        category,
        transmission,
        fuelType,
        seats,
        luggageCapacity,
        dailyRate,
        securityDeposit,
        status,
        licensePlate,
        vin,
        location,
        imageUrl,
        horsepower,
        fuelEfficiency,
        mileage: 1200,
        rating: 5.0,
        reviewCount: 1,
        features: ['Standard Safety Suite', 'Bluetooth Audio', 'Air Conditioning', 'Cruise Control'],
      };
      onAddVehicle(created);
    }

    setIsModalOpen(false);
  };

  // Quick toggle status directly from list
  const handleQuickStatusChange = (vehicle: Vehicle, newStatus: VehicleStatus) => {
    onUpdateVehicle({
      ...vehicle,
      status: newStatus,
    });
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterCategory !== 'ALL' && v.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Add Button Bento Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Fleet Inventory & Vehicle Registry</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage car specifications, rate structures, availability states, and service scheduling locks.
          </p>
        </div>

        <button
          id="add-vehicle-btn"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle to Fleet
        </button>
      </div>

      {/* Filter Bar Bento Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by make, model, or plate number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Luxury">Luxury</option>
              <option value="Electric">Electric</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Category & Specs</th>
                <th className="p-4">Daily Rate / Deposit</th>
                <th className="p-4">Location Hub</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Vehicle Details */}
                  <td className="p-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.model}
                        className="w-16 h-11 object-cover rounded-xl shrink-0 border border-slate-100 shadow-xs"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700 border border-slate-200">
                            {vehicle.licensePlate}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{vehicle.vin.substring(0, 10)}...</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Specs */}
                  <td className="p-4">
                    <span className="font-bold text-slate-800">{vehicle.category}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{vehicle.seats} seats • {vehicle.fuelType} • {vehicle.transmission}</p>
                  </td>

                  {/* Rates */}
                  <td className="p-4">
                    <span className="font-extrabold text-slate-900 text-sm">{formatINR(vehicle.dailyRate)}/day</span>
                    <p className="text-[11px] text-slate-400">Deposit: {formatINR(vehicle.securityDeposit)}</p>
                  </td>

                  {/* Location */}
                  <td className="p-4 text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {vehicle.location}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="p-4">
                    <select
                      value={vehicle.status}
                      onChange={(e) => handleQuickStatusChange(vehicle, e.target.value as VehicleStatus)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-hidden ${
                        vehicle.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : vehicle.status === 'RENTED'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RENTED">RENTED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Vehicle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${vehicle.make} ${vehicle.model} from fleet?`)) {
                            onDeleteVehicle(vehicle.id);
                          }
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT VEHICLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-6">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingVehicle ? 'Edit Vehicle Specifications' : 'Register New Fleet Vehicle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Make / Brand</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Tesla, BMW, Audi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Model Y, 330i, Q5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Model Year</label>
                  <input
                    type="number"
                    min="2018"
                    max="2026"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Electric">Electric</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Powertrain</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">License Plate</label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">VIN (17 chars)</label>
                  <input
                    type="text"
                    required
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Daily Rental Rate (INR ₹)</label>
                  <input
                    type="number"
                    min="1000"
                    max="50000"
                    step="100"
                    required
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Security Deposit (INR ₹)</label>
                  <input
                    type="number"
                    min="5000"
                    max="100000"
                    step="500"
                    required
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Station / Hub Location (Manually Filled)</label>
                  <input
                    type="text"
                    required
                    list="fleet-location-presets"
                    placeholder="e.g. Terminal 3 Airport, New Delhi or Indiranagar, Bengaluru"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  <datalist id="fleet-location-presets">
                    <option value="Terminal 3, IGI Airport, New Delhi" />
                    <option value="Kempegowda International Airport (BLR), Bengaluru" />
                    <option value="Chhatrapati Shivaji Maharaj T2, Mumbai" />
                    <option value="Connaught Place Central Hub, New Delhi" />
                    <option value="MG Road / Indiranagar, Bengaluru" />
                    <option value="Bandra Kurla Complex (BKC), Mumbai" />
                    <option value="Doorstep Delivery Fleet Depot" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="RENTED">RENTED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vehicle Image URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-slate-600">Sample Photo Preview:</span>
                <img src={imageUrl} alt="preview" className="w-16 h-10 object-cover rounded-md" />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 -mx-6 -mb-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md"
                >
                  {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
