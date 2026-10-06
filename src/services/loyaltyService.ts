import { LoyaltyTierInfo, LoyaltyTierName } from '../types';

export const LOYALTY_TIERS: Record<LoyaltyTierName, LoyaltyTierInfo> = {
  SILVER: {
    tier: 'SILVER',
    label: 'Silver Club',
    minPoints: 0,
    maxPoints: 499,
    multiplier: 1.0,
    extraDiscountPercent: 0,
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
    cardGradient: 'from-slate-700 via-slate-800 to-slate-900',
    perks: [
      'Earn 1 point per ₹100 spent',
      '1 Point = ₹1 INR instant checkout credit',
      'Flexible booking cancellations',
      'Digital MoRTH verified profile'
    ],
  },
  GOLD: {
    tier: 'GOLD',
    label: 'Gold Prestige',
    minPoints: 500,
    maxPoints: 1499,
    multiplier: 1.5,
    extraDiscountPercent: 5,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    cardGradient: 'from-amber-600 via-yellow-600 to-amber-800',
    perks: [
      '1.5x Points Accelerator (1.5 pts per ₹100)',
      'Complimentary GPS unit on every booking',
      '5% automatic tier discount on rental charges',
      'Priority vehicle handoff at airport hubs'
    ],
  },
  PLATINUM: {
    tier: 'PLATINUM',
    label: 'Platinum Elite',
    minPoints: 1500,
    maxPoints: undefined,
    multiplier: 2.0,
    extraDiscountPercent: 10,
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    cardGradient: 'from-indigo-900 via-purple-900 to-slate-950',
    perks: [
      '2.0x Points Booster (2 pts per ₹100)',
      'Free Additional Driver & Roadside Assistance',
      '10% VIP tier savings on luxury fleet',
      '50% Security Deposit waiver benefit',
      'Dedicated 24/7 Concierge Support'
    ],
  },
};

/**
 * Resolves current customer loyalty tier based on active points
 */
export function getLoyaltyTier(points: number = 0): LoyaltyTierInfo {
  if (points >= 1500) return LOYALTY_TIERS.PLATINUM;
  if (points >= 500) return LOYALTY_TIERS.GOLD;
  return LOYALTY_TIERS.SILVER;
}

/**
 * Calculates next tier progression
 */
export function getTierProgression(points: number = 0): {
  currentTier: LoyaltyTierInfo;
  nextTier: LoyaltyTierInfo | null;
  pointsToNextTier: number;
  progressPercent: number;
} {
  const currentTier = getLoyaltyTier(points);
  
  if (currentTier.tier === 'PLATINUM') {
    return {
      currentTier,
      nextTier: null,
      pointsToNextTier: 0,
      progressPercent: 100,
    };
  }

  const nextTier = currentTier.tier === 'SILVER' ? LOYALTY_TIERS.GOLD : LOYALTY_TIERS.PLATINUM;
  const target = nextTier.minPoints;
  const base = currentTier.minPoints;
  const pointsToNext = Math.max(0, target - points);
  const progressPercent = Math.min(100, Math.round(((points - base) / (target - base)) * 100));

  return {
    currentTier,
    nextTier,
    pointsToNextTier: pointsToNext,
    progressPercent,
  };
}

/**
 * Calculates points earned on completing a booking
 * Rule: 1 point per ₹100 spent * tier multiplier
 */
export function calculatePointsEarned(totalAmount: number, currentPoints: number = 0): number {
  const tier = getLoyaltyTier(currentPoints);
  const basePoints = Math.floor(totalAmount / 100);
  return Math.round(basePoints * tier.multiplier);
}

/**
 * Converts points into direct INR discount credit (1 point = ₹1 INR)
 */
export function calculateLoyaltyDiscount(
  pointsToRedeem: number,
  availablePoints: number,
  maxAllowedDiscount: number
): { valid: boolean; discountAmount: number; pointsRedeemed: number; message?: string } {
  if (pointsToRedeem <= 0) {
    return { valid: true, discountAmount: 0, pointsRedeemed: 0 };
  }

  if (pointsToRedeem > availablePoints) {
    return {
      valid: false,
      discountAmount: 0,
      pointsRedeemed: 0,
      message: `You only have ${availablePoints} points available.`,
    };
  }

  // 1 Point = 1 INR
  const cappedPoints = Math.min(pointsToRedeem, availablePoints, Math.floor(maxAllowedDiscount));

  return {
    valid: true,
    discountAmount: cappedPoints,
    pointsRedeemed: cappedPoints,
  };
}
