import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Car, 
  User, 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  Receipt,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { formatINR } from '../../utils/currency';

interface BookingsManagementProps {
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus) => void;
  onOpenInvoice: (booking: Booking) => void;
  onTriggerReturn: (booking: Booking) => void;
}

export const BookingsManagement: React.FC<BookingsManagementProps> = ({
  bookings,
  onUpdateBookingStatus,
  onOpenInvoice,
  onTriggerReturn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bento Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Reservations & Rental Agreements</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor client check-outs, execute vehicle handovers, enforce late penalties, and review transaction records.
          </p>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-1 bg-slate-100/90 p-1.5 rounded-2xl text-xs border border-slate-200/60">
          {['ALL', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar Bento Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reservation #, customer name, vehicle, or license plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap bg-slate-100 px-3 py-1.5 rounded-xl">
          Showing {filteredBookings.length} records
        </span>
      </div>

      {/* Bookings Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Booking # & Customer</th>
                <th className="p-4">Vehicle Model</th>
                <th className="p-4">Schedule Dates</th>
                <th className="p-4">Financial Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Booking ID & Customer */}
                  <td className="p-4">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{booking.bookingNumber}</span>
                    <p className="font-bold text-slate-900 mt-1">{booking.customerName}</p>
                    <p className="text-[11px] text-slate-400">{booking.customerEmail}</p>
                  </td>

                  {/* Vehicle */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={booking.vehicleImage} alt="" className="w-14 h-9 object-cover rounded-xl shrink-0 border border-slate-100 shadow-xs" />
                      <div>
                        <p className="font-bold text-slate-900">{booking.vehicleName}</p>
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                          {booking.licensePlate}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="text-slate-800 font-semibold">{booking.pickupDate} → {booking.returnDate}</p>
                      <p className="text-[11px] text-slate-400">{booking.rentalDays} days @ {formatINR(booking.dailyRate)}/day</p>
                    </div>
                  </td>

                  {/* Financial Total */}
                  <td className="p-4">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatINR(booking.finalPaidAmount || booking.totalAmount)}
                    </span>
                    <p className="text-[10px] text-emerald-600 font-semibold">{booking.paymentStatus}</p>
                    {booking.lateFee !== undefined && booking.lateFee > 0 && (
                      <p className="text-[10px] text-amber-600 font-medium">Includes {formatINR(booking.lateFee)} late fee</p>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        booking.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : booking.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : booking.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Handover: Confirm -> Active */}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => onUpdateBookingStatus(booking.id, 'ACTIVE')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-xs shadow-xs"
                          title="Vehicle Handover: Mark as Picked Up / Active"
                        >
                          Dispatch / Pick Up
                        </button>
                      )}

                      {/* Return: Active -> Completed */}
                      {booking.status === 'ACTIVE' && (
                        <button
                          onClick={() => onTriggerReturn(booking)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors text-xs shadow-xs"
                          title="Process Return & Late Fee Inspection"
                        >
                          Process Return
                        </button>
                      )}

                      {/* Cancel action */}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => onUpdateBookingStatus(booking.id, 'CANCELLED')}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold"
                          title="Cancel Reservation"
                        >
                          Cancel
                        </button>
                      )}

                      {/* View Invoice */}
                      <button
                        onClick={() => onOpenInvoice(booking)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                        title="View Tax Invoice & Receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
