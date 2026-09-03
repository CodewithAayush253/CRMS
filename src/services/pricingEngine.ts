import { InsuranceType, AddOnOptions, PriceCalculationResult } from '../types';

export const INSURANCE_RATES: Record<InsuranceType, number> = {
  BASIC: 599, // ₹599/day (Third party liability)
  PREMIUM: 1499, // ₹1,499/day (Comprehensive zero-deductible)
  COLLISION_WAIVER: 899, // ₹899/day (CDW & Theft protection)
};

export const ADD_ON_DAILY_RATES = {
  gps: 249, // ₹249/day
  childSeat: 349, // ₹349/day
  extraDriver: 499, // ₹499/day
  roadsideAssistance: 199, // ₹199/day
};

export const TAX_RATE = 0.18; // 18% GST (Standard Indian Car Rental Tax)

/**
 * Calculates rental duration in days between pickup and drop-off dates.
 */
export function calculateRentalDays(pickupDate: string, returnDate: string): number {
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Strategy Pattern implementation for car rental pricing.
 * Matches Spring Boot Java PricingStrategy implementations.
 */
export function calculateRentalPrice(
  dailyRate: number,
  rentalDays: number,
  insuranceType: InsuranceType,
  addOns: AddOnOptions,
  securityDeposit: number
): PriceCalculationResult {
  const basePrice = dailyRate * rentalDays;

  // Strategy logic
  let discountPercent = 0;
  let discountStrategy = 'Standard Rate';

  if (rentalDays >= 14) {
    discountPercent = 0.20; // 20% for 2+ weeks
    discountStrategy = 'Long-Term Explorer (20% Off)';
  } else if (rentalDays >= 7) {
    discountPercent = 0.15; // 15% weekly discount
    discountStrategy = 'Weekly Special (15% Off)';
  } else if (rentalDays >= 3) {
    discountPercent = 0.05; // 5% multi-day discount
    discountStrategy = 'Multi-Day Advantage (5% Off)';
  }

  const discountAmount = Math.round(basePrice * discountPercent * 100) / 100;
  const discountedBase = basePrice - discountAmount;

  // Insurance cost
  const insuranceDaily = INSURANCE_RATES[insuranceType] || 0;
  const insuranceTotal = insuranceDaily * rentalDays;

  // Add-ons cost
  let addOnsDaily = 0;
  if (addOns.gps) addOnsDaily += ADD_ON_DAILY_RATES.gps;
  if (addOns.childSeat) addOnsDaily += ADD_ON_DAILY_RATES.childSeat;
  if (addOns.extraDriver) addOnsDaily += ADD_ON_DAILY_RATES.extraDriver;
  if (addOns.roadsideAssistance) addOnsDaily += ADD_ON_DAILY_RATES.roadsideAssistance;
  const addOnsTotal = addOnsDaily * rentalDays;

  // Subtotal before tax
  const subtotal = discountedBase + insuranceTotal + addOnsTotal;
  const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + taxes + securityDeposit) * 100) / 100;

  return {
    days: rentalDays,
    dailyRate,
    basePrice,
    discountPercent: discountPercent * 100,
    discountAmount,
    discountStrategy,
    insuranceRate: insuranceDaily,
    insuranceTotal,
    addOnsTotal,
    taxes,
    securityDeposit,
    subtotal,
    totalAmount,
  };
}

/**
 * Calculates late return penalty charges.
 * Core CRMS business requirement: late return charges calculation.
 */
export function calculateLateReturnCharges(
  dailyRate: number,
  hoursLate: number,
  fuelMissingPercent: number = 0
): {
  gracePeriodApplied: boolean;
  lateFee: number;
  fuelFee: number;
  penaltyDescription: string;
  totalAdditionalCharge: number;
} {
  // Grace period: up to 1 hour late has no late penalty
  if (hoursLate <= 1) {
    const fuelFee = fuelMissingPercent > 0 ? Math.round(fuelMissingPercent * 45) : 0;
    return {
      gracePeriodApplied: true,
      lateFee: 0,
      fuelFee,
      penaltyDescription: 'Returned within 1-hour grace period. No late fee assessed.',
      totalAdditionalCharge: fuelFee,
    };
  }

  let lateFee = 0;
  let penaltyDescription = '';

  if (hoursLate <= 5) {
    // Hourly rate penalty: 1.5x regular hourly cost
    const hourlyPenaltyRate = (dailyRate / 8) * 1.5;
    lateFee = Math.round(hourlyPenaltyRate * hoursLate * 100) / 100;
    penaltyDescription = `${hoursLate} hours late @ ₹${hourlyPenaltyRate.toFixed(0)}/hr (1.5x hourly rate penalty)`;
  } else {
    // Multi-hour / multi-day late penalty: 1.5x daily rate per each 24h period or part thereof
    const daysLate = Math.ceil(hoursLate / 24);
    const dailyPenaltyRate = dailyRate * 1.5;
    lateFee = Math.round(daysLate * dailyPenaltyRate * 100) / 100;
    penaltyDescription = `${daysLate} day(s) late equivalent @ ₹${dailyPenaltyRate.toFixed(0)}/day (1.5x daily surcharge)`;
  }

  // Refueling penalty fee: ₹1,500 estimated based on % missing fuel
  const fuelFee = fuelMissingPercent > 0 ? Math.round(fuelMissingPercent * 1500) : 0;

  return {
    gracePeriodApplied: false,
    lateFee,
    fuelFee,
    penaltyDescription,
    totalAdditionalCharge: Math.round((lateFee + fuelFee) * 100) / 100,
  };
}

/**
 * Calculates cancellation refund policy.
 * Cancellation > 48 hours: 100% refund
 * Cancellation 24-48 hours: 80% refund (20% administrative fee)
 * Cancellation < 24 hours: 50% refund
 */
export function calculateCancellationRefund(
  totalPaid: number,
  pickupDate: string
): {
  refundPercentage: number;
  refundAmount: number;
  feeAmount: number;
  policyNote: string;
} {
  const now = new Date().getTime();
  const pickupTime = new Date(pickupDate).getTime();
  const hoursUntilPickup = (pickupTime - now) / (1000 * 60 * 60);

  let refundPercentage = 100;
  let policyNote = 'Full 100% refund applied (Cancelled >48 hours prior to pickup)';

  if (hoursUntilPickup < 24) {
    refundPercentage = 50;
    policyNote = '50% late cancellation refund applied (Cancelled <24 hours prior to pickup)';
  } else if (hoursUntilPickup < 48) {
    refundPercentage = 80;
    policyNote = '80% refund applied (Cancelled between 24-48 hours prior to pickup)';
  }

  const refundAmount = Math.round((totalPaid * (refundPercentage / 100)) * 100) / 100;
  const feeAmount = Math.round((totalPaid - refundAmount) * 100) / 100;

  return {
    refundPercentage,
    refundAmount,
    feeAmount,
    policyNote,
  };
}
