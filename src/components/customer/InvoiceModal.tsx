import React from 'react';
import { X, Printer, Car, ShieldCheck, CheckCircle2, Download } from 'lucide-react';
import { Booking } from '../../types';
import { formatINR } from '../../utils/currency';

interface InvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div 
        id="crms-printable-invoice"
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 my-6 print:shadow-none print:border-none print:my-0"
      >
        {/* Top Control Bar (hidden in print) */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-sm tracking-tight">GST Tax Invoice & Rental Agreement</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg font-mono font-medium border border-slate-700">
              #{booking.bookingNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div className="p-8 space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Velocity<span className="text-amber-500">CRMS</span> India
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Enterprise Fleet Operations & Mobility Pvt Ltd</p>
              <p className="text-[11px] text-slate-500">MG Road, Aerocity Hub, New Delhi - 110037</p>
              <p className="text-[11px] text-slate-500">GSTIN: 07AAACG0182C1Z4 • PAN: AAACG0182C</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs uppercase mb-1">
                {booking.paymentStatus === 'PAID' ? 'PAID & CERTIFIED' : booking.paymentStatus}
              </span>
              <p className="font-mono text-sm font-bold text-slate-900">INV-{booking.bookingNumber}</p>
              <p className="text-[11px] text-slate-500">Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
              <p className="text-[11px] text-slate-500">Txn: {booking.transactionId || 'TXN-90218842'}</p>
            </div>
          </div>

          {/* Customer & Vehicle 2-Column Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rented By</p>
              <p className="font-bold text-slate-900 text-sm">{booking.customerName}</p>
              <p className="text-slate-600">{booking.customerEmail}</p>
              <p className="text-slate-500 text-[11px] mt-1">Authorized Driving License Verified</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Vehicle Details</p>
              <p className="font-bold text-slate-900 text-sm">{booking.vehicleName}</p>
              <p className="text-slate-600">Category: {booking.vehicleCategory}</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">Plate: {booking.licensePlate}</p>
            </div>
          </div>

          {/* Trip Dates */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-2xl p-3.5">
            <div>
              <span className="text-slate-400 text-[11px]">Pick-up Schedule</span>
              <p className="font-bold text-slate-900 text-sm">{booking.pickupDate}</p>
              <p className="text-slate-500 text-[11px]">{booking.pickupLocation}</p>
            </div>

            <div>
              <span className="text-slate-400 text-[11px]">Return Schedule</span>
              <p className="font-bold text-slate-900 text-sm">{booking.returnDate}</p>
              <p className="text-slate-500 text-[11px]">{booking.returnLocation}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Itemized Breakdown (INR ₹)</p>
            <table className="w-full border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 text-left">
                <tr>
                  <th className="p-2.5 font-semibold">Description</th>
                  <th className="p-2.5 font-semibold text-center">Rate / Duration</th>
                  <th className="p-2.5 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5">
                    <span className="font-medium text-slate-900">Vehicle Rental Base Charge</span>
                    <p className="text-[10px] text-slate-500">{booking.vehicleName}</p>
                  </td>
                  <td className="p-2.5 text-center">{formatINR(booking.dailyRate)} × {booking.rentalDays}d</td>
                  <td className="p-2.5 text-right font-medium">{formatINR(booking.dailyRate * booking.rentalDays)}</td>
                </tr>

                {booking.discountAmount > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/40">
                    <td className="p-2.5">
                      <span className="font-semibold">{booking.discountLabel || 'Duration Discount Savings'}</span>
                    </td>
                    <td className="p-2.5 text-center">Special Offer</td>
                    <td className="p-2.5 text-right font-semibold">-{formatINR(booking.discountAmount)}</td>
                  </tr>
                )}

                {booking.insuranceCost > 0 && (
                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-900">Protection Plan: {booking.insuranceType}</span>
                    </td>
                    <td className="p-2.5 text-center">{booking.rentalDays} days</td>
                    <td className="p-2.5 text-right font-medium">{formatINR(booking.insuranceCost)}</td>
                  </tr>
                )}

                {booking.addOnsCost > 0 && (
                  <tr>
                    <td className="p-2.5">
                      <span className="font-medium text-slate-900">Add-ons & Accessories</span>
                      <p className="text-[10px] text-slate-500">
                        {[
                          booking.addOns?.gps && 'GPS Unit',
                          booking.addOns?.childSeat && 'Child Seat',
                          booking.addOns?.extraDriver && 'Extra Driver',
                          booking.addOns?.roadsideAssistance && 'Roadside Support'
                        ].filter(Boolean).join(', ')}
                      </p>
                    </td>
                    <td className="p-2.5 text-center">{booking.rentalDays} days</td>
                    <td className="p-2.5 text-right font-medium">{formatINR(booking.addOnsCost)}</td>
                  </tr>
                )}

                <tr>
                  <td className="p-2.5 text-slate-600">Goods & Services Tax (GST 18%)</td>
                  <td className="p-2.5 text-center">Standard SGST+CGST</td>
                  <td className="p-2.5 text-right font-medium">{formatINR(booking.taxes)}</td>
                </tr>

                <tr>
                  <td className="p-2.5 text-slate-600">Refundable Security Deposit (Pre-auth held)</td>
                  <td className="p-2.5 text-center">Refundable</td>
                  <td className="p-2.5 text-right font-medium">{formatINR(booking.securityDeposit)}</td>
                </tr>

                {/* Late fee adjustment if applicable */}
                {booking.lateFee !== undefined && booking.lateFee > 0 && (
                  <tr className="bg-amber-50 text-amber-900 font-semibold">
                    <td className="p-2.5">
                      <span>Late Return Surcharge ({booking.hoursLate} hrs delay)</span>
                    </td>
                    <td className="p-2.5 text-center">Penalty Policy</td>
                    <td className="p-2.5 text-right">+{formatINR(booking.lateFee)}</td>
                  </tr>
                )}

                {booking.fuelFee !== undefined && booking.fuelFee > 0 && (
                  <tr className="bg-amber-50 text-amber-900 font-semibold">
                    <td className="p-2.5">
                      <span>Refueling Charge (Tank returned deficient)</span>
                    </td>
                    <td className="p-2.5 text-center">Fuel Service</td>
                    <td className="p-2.5 text-right">+{formatINR(booking.fuelFee)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Total Settled:</span>
                <span className="text-base text-amber-600 font-extrabold">
                  {formatINR(booking.finalPaidAmount || booking.totalAmount)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 text-right">
                Paid via {booking.paymentMethod || 'UPI / Card'}
              </p>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-600">Legal Agreement & Vehicle Return Mandate:</p>
            <p>
              Vehicle must be returned with the same fuel level as dispatched. Late returns exceeding the 1-hour grace period are billed at 1.5x regular daily rate. Security deposit will be refunded automatically to original payment method within 3 working days following inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
