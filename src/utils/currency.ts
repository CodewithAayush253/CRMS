/**
 * Currency utility for Indian Rupee (INR - ₹) formatting across CRMS.
 */

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

/**
 * Formats numeric amounts to Indian Rupee representation (e.g. ₹4,500 or ₹4,500.50).
 */
export function formatINR(amount: number | undefined | null, includeDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  };

  try {
    return new Intl.NumberFormat('en-IN', options).format(amount);
  } catch {
    // Fallback in case of environment locale failure
    const formatted = amount.toLocaleString('en-IN', {
      maximumFractionDigits: includeDecimals ? 2 : 0,
      minimumFractionDigits: includeDecimals ? 2 : 0,
    });
    return `₹${formatted}`;
  }
}
