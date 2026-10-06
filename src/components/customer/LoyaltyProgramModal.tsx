import React from 'react';
import { 
  X, 
  Award, 
  Crown, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Coins, 
  Clock, 
  CreditCard 
} from 'lucide-react';
import { Customer } from '../../types';
import { 
  getLoyaltyTier, 
  getTierProgression, 
  LOYALTY_TIERS 
} from '../../services/loyaltyService';
import { formatINR } from '../../utils/currency';

interface LoyaltyProgramModalProps {
  isOpen: boolean;
  currentUser: Customer;
  onClose: () => void;
  onStartBooking?: () => void;
}

export const LoyaltyProgramModal: React.FC<LoyaltyProgramModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onStartBooking,
}) => {
  if (!isOpen) return null;

  const points = currentUser.loyaltyPoints || 0;
  const currentTier = getLoyaltyTier(points);
  const progression = getTierProgression(points);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-in">
        
        {/* Header with Tier Gradient */}
        <div className={`bg-gradient-to-r ${currentTier.cardGradient} p-6 sm:p-7 text-white relative`}>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-bold tracking-wider uppercase mb-2 backdrop-blur-xs">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Velocity Rewards Club</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {currentTier.label}
              </h2>
              <p className="text-xs text-slate-200 mt-1 max-w-sm">
                Member since {currentUser.memberSince} • Automatic rewards on every road trip.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Points Counter Badge */}
          <div className="mt-5 p-4 rounded-2xl bg-black/25 border border-white/10 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 font-black">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] text-slate-300 block font-medium">Available Loyalty Balance</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{points.toLocaleString()}</span>
                  <span className="text-xs font-bold text-amber-300">Points</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-300 block font-medium">Instant Cash Value</span>
              <span className="text-lg font-black text-emerald-400">
                {formatINR(points)}
              </span>
              <span className="text-[10px] text-slate-300 block">1 Pt = ₹1 Direct Credit</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          
          {/* Tier Progress Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Tier Progress: {currentTier.label}
              </span>
              {progression.nextTier ? (
                <span className="text-slate-500 text-[11px]">
                  {progression.pointsToNextTier} points to <strong>{progression.nextTier.label}</strong>
                </span>
              ) : (
                <span className="text-purple-600 text-[11px] font-bold">
                  Top Tier Achieved! 🎉
                </span>
              )}
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
              <span>Silver (0 pts)</span>
              <span>Gold (500 pts)</span>
              <span>Platinum Elite (1,500 pts)</span>
            </div>
          </div>

          {/* Current Tier Privileges */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Your Active Tier Privileges ({currentTier.label})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {currentTier.perks.map((perk, idx) => (
                <div key={idx} className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-950 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How Loyalty Program Works */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              How You Earn & Redeem Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  1. Earn on Trips
                </span>
                <p className="text-[11px] text-slate-500">
                  Earn points automatically with every booking ({currentTier.multiplier}x multiplier on your tier).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  2. 1 Point = ₹1 Off
                </span>
                <p className="text-[11px] text-slate-500">
                  Redeem your points directly at payment checkout for instant cash deductions!
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-purple-600" />
                  3. Stack with Coupons
                </span>
                <p className="text-[11px] text-slate-500">
                  Combine your loyalty points with promo discount coupons for maximum rental savings!
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Close
            </button>

            {onStartBooking && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartBooking();
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
              >
                <span>Browse Fleet & Redeem Points</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
