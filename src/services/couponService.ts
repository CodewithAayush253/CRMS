import { DiscountCoupon, VehicleCategory } from '../types';

export const AVAILABLE_COUPONS: DiscountCoupon[] = [
  {
    code: 'VELOCITY10',
    title: 'Velocity Welcome 10%',
    description: 'Get 10% instant discount on base rental charges across all vehicles.',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minSubtotal: 2000,
    maxDiscount: 2500,
    applicableCategory: 'ALL',
    badge: 'Popular',
    expiresAt: '2026-12-31',
  },
  {
    code: 'FIRSTDRIVE',
    title: 'First Drive ₹500 Off',
    description: 'Flat ₹500 discount on your car reservation. Minimum order ₹2,500.',
    discountType: 'FLAT_INR',
    discountValue: 500,
    minSubtotal: 2500,
    applicableCategory: 'ALL',
    badge: 'New User',
    expiresAt: '2026-12-31',
  },
  {
    code: 'FESTIVE25',
    title: 'Grand Festive 25% Off',
    description: 'Enjoy 25% discount for road trips of 3 days or more (Capped at ₹4,000).',
    discountType: 'PERCENTAGE',
    discountValue: 25,
    minDays: 3,
    minSubtotal: 4000,
    maxDiscount: 4000,
    applicableCategory: 'ALL',
    badge: 'Holiday Special',
    expiresAt: '2026-11-30',
  },
  {
    code: 'WEEKEND15',
    title: 'Weekend Escape 15%',
    description: '15% discount for 2+ days getaway rentals.',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minDays: 2,
    minSubtotal: 3000,
    maxDiscount: 2000,
    applicableCategory: 'ALL',
    badge: 'Weekend',
    expiresAt: '2026-12-31',
  },
  {
    code: 'VIP1000',
    title: 'Luxury & SUV Elite ₹1,000',
    description: 'Flat ₹1,000 discount reserved exclusively for Luxury & SUV category vehicles.',
    discountType: 'FLAT_INR',
    discountValue: 1000,
    minSubtotal: 5000,
    applicableCategory: 'Luxury',
    badge: 'VIP Elite',
    expiresAt: '2026-12-31',
  },
];

export interface CouponValidationResult {
  success: boolean;
  discountAmount: number;
  coupon?: DiscountCoupon;
  message: string;
}

/**
 * Validates a coupon code against current rental parameters and returns calculated discount in INR.
 */
export function validateAndCalculateCoupon(
  code: string,
  baseAndAddonsSubtotal: number,
  rentalDays: number,
  category: VehicleCategory
): CouponValidationResult {
  if (!code || !code.trim()) {
    return {
      success: false,
      discountAmount: 0,
      message: 'Please enter a coupon code.',
    };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = AVAILABLE_COUPONS.find(c => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return {
      success: false,
      discountAmount: 0,
      message: `Coupon code "${cleanCode}" is invalid or has expired.`,
    };
  }

  // Min Days Validation
  if (coupon.minDays && rentalDays < coupon.minDays) {
    return {
      success: false,
      discountAmount: 0,
      message: `Coupon "${coupon.code}" requires a minimum rental period of ${coupon.minDays} days (Current: ${rentalDays} days).`,
    };
  }

  // Min Subtotal Validation
  if (coupon.minSubtotal && baseAndAddonsSubtotal < coupon.minSubtotal) {
    return {
      success: false,
      discountAmount: 0,
      message: `Coupon "${coupon.code}" requires a minimum booking subtotal of ₹${coupon.minSubtotal.toLocaleString('en-IN')}.`,
    };
  }

  // Category Validation
  if (coupon.applicableCategory && coupon.applicableCategory !== 'ALL' && coupon.applicableCategory !== category) {
    return {
      success: false,
      discountAmount: 0,
      message: `Coupon "${coupon.code}" is valid only for ${coupon.applicableCategory} category vehicles (Selected: ${category}).`,
    };
  }

  // Calculate discount amount
  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = Math.round((baseAndAddonsSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'FLAT_INR') {
    discount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed 80% of subtotal
  discount = Math.min(discount, Math.round(baseAndAddonsSubtotal * 0.8));

  return {
    success: true,
    discountAmount: Math.max(0, discount),
    coupon,
    message: `Promo code "${coupon.code}" applied! You saved ₹${discount.toLocaleString('en-IN')}.`,
  };
}
