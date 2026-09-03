import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Car, 
  UserCheck, 
  DollarSign,
  Calendar,
  X
} from 'lucide-react';
import { Vehicle, MaintenanceRecord, MaintenanceType, MaintenancePriority } from '../../types';
import { formatINR } from '../../utils/currency';

interface MaintenanceManagementProps {
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceRecord[];
  onAddMaintenance: (record: MaintenanceRecord) => void;
  onCompleteMaintenance: (recordId: string, vehicleId: string, actualCost: number) => void;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  vehicles,
  maintenanceLogs,
  onAddMaintenance,
  onCompleteMaintenance,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [serviceType, setServiceType] = useState<MaintenanceType>('OIL_CHANGE');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedCost, setEstimatedCost] = useState(4500);
  const [technician, setTechnician] = useState('Dave Reynolds (Lead ASE)');
  const [description, setDescription] = useState('');

  // Complete service modal state
  const [completingRecord, setCompletingRecord] = useState<MaintenanceRecord | null>(null);
  const [actualCostInput, setActualCostInput] = useState(4500);

  const handleScheduleService = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    const newRecord: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      serviceType,
      status: 'IN_PROGRESS',
      priority,
      startDate,
      cost: estimatedCost,
      description: description || `Standard ${serviceType.replace('_', ' ').toLowerCase()} procedure and safety check.`,
      technician,
    };

    onAddMaintenance(newRecord);
    setIsModalOpen(false);
    setDescription('');
  };

  const handleConfirmCompletion = () => {
    if (!completingRecord) return;
    onCompleteMaintenance(completingRecord.id, completingRecord.vehicleId, actualCostInput);
    setCompletingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bento Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Vehicle Maintenance & Fleet Health</h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated service logs, oil & brake interval scheduling, and automatic rental calendar locking.
          </p>
        </div>

        <button
          id="schedule-service-btn"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          Schedule Fleet Service
        </button>
      </div>

      {/* Maintenance Logs Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assigned Technician</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Vehicle */}
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-sm">{log.vehicleName}</p>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700 border border-slate-200">
                      {log.licensePlate}
                    </span>
                  </td>

                  {/* Service Type & Desc */}
                  <td className="p-4">
                    <span className="font-bold text-slate-800">{log.serviceType.replace('_', ' ')}</span>
                    <p className="text-[11px] text-slate-500 max-w-xs truncate mt-0.5">{log.description}</p>
                  </td>

                  {/* Priority */}
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      log.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : log.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {log.priority}
                    </span>
                  </td>

                  {/* Technician & Date */}
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{log.technician}</p>
                    <p className="text-[11px] text-slate-400">Date: {log.startDate}</p>
                  </td>

                  {/* Cost */}
                  <td className="p-4">
                    <span className="font-extrabold text-slate-900 text-sm">{formatINR(log.cost)}</span>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      log.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : log.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {log.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-4 text-right">
                    {log.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          setCompletingRecord(log);
                          setActualCostInput(log.cost);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-xs shadow-xs"
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Certified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-6">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Schedule Fleet Maintenance</h3>
                <p className="text-xs text-slate-400">Locks vehicle out of rental availability during service</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleScheduleService} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.licensePlate}) - Status: {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="OIL_CHANGE">Oil & Filter Change</option>
                    <option value="BRAKE_INSPECTION">Brake Pads & Rotor Check</option>
                    <option value="TIRE_ROTATION">Tire Rotation & Balance</option>
                    <option value="ENGINE_DIAGNOSTIC">Engine Diagnostics</option>
                    <option value="ANNUAL_SERVICE">Annual Multi-Point Service</option>
                    <option value="CLEANING_DETAILING">Deep Sanitization & Detail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Urgency Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="LOW">Low (Preventative)</option>
                    <option value="MEDIUM">Medium (Scheduled)</option>
                    <option value="HIGH">High (Immediate Repair)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estimated Cost (INR ₹)</label>
                  <input
                    type="number"
                    min="500"
                    max="200000"
                    step="100"
                    required
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Service Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead Mechanic / Technician</label>
                <input
                  type="text"
                  required
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Inspection Notes / Symptoms</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 15,000 mile scheduled service; check brake squeak..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                ⚠️ Notice: Scheduling this service will automatically set this vehicle to <strong>MAINTENANCE</strong> status, preventing double bookings on customer portals.
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
                  Schedule & Lock Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE SERVICE MODAL */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-xs shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">Sign Off & Complete Service</h3>
            <p className="text-slate-600">
              Certify that {completingRecord.vehicleName} has passed inspection and is ready to return to the active rental fleet.
            </p>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Final Actual Invoiced Cost (INR ₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={actualCostInput}
                onChange={(e) => setActualCostInput(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCompletingRecord(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
              >
                Certify & Release to Fleet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
