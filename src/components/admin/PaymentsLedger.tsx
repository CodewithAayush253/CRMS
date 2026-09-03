import React, { useState } from 'react';
import { 
  DollarSign, 
  Search, 
  CheckCircle2, 
  RotateCcw, 
  CreditCard, 
  ArrowDownRight, 
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { PaymentTransaction, Booking } from '../../types';
import { formatINR } from '../../utils/currency';

interface PaymentsLedgerProps {
  payments: PaymentTransaction[];
  bookings: Booking[];
  onOpenInvoiceForBookingNumber: (bookingNumber: string) => void;
}

export const PaymentsLedger: React.FC<PaymentsLedgerProps> = ({
  payments,
  bookings,
  onOpenInvoiceForBookingNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const totalSuccessful = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter(p => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bento Box */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Payments & Financial Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of rental charges, security deposit holds, refunds, and late fee settlements.
          </p>
        </div>

        {/* Quick KPI counters */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50/80 border border-emerald-200 px-4 py-2 rounded-2xl text-xs">
            <span className="text-emerald-700 block text-[10px] font-semibold">Total Processed</span>
            <span className="text-lg font-black text-emerald-800">{formatINR(totalSuccessful)}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs">
            <span className="text-slate-500 block text-[10px] font-semibold">Total Transactions</span>
            <span className="text-lg font-black text-slate-800">{payments.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar Bento Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by transaction #, reservation #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 font-medium"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="UPI">UPI / Instant</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Reservation #</th>
                <th className="p-4">Payer / Customer</th>
                <th className="p-4">Method & Card</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900 bg-slate-50/50">{p.transactionId}</td>
                  <td className="p-4">
                    <button
                      onClick={() => onOpenInvoiceForBookingNumber(p.bookingNumber)}
                      className="font-mono text-amber-600 hover:text-amber-700 underline font-semibold flex items-center gap-1"
                    >
                      {p.bookingNumber}
                    </button>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{p.customerName}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{p.method.replace('_', ' ')}</span>
                      {p.cardLast4 && <span className="font-mono text-slate-400 text-[11px]">(•••• {p.cardLast4})</span>}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 font-medium">
                    {new Date(p.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-extrabold text-slate-900 text-sm">
                    {formatINR(p.amount)}
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
