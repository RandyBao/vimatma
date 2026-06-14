/**
 * Utility functions for handling and formatting currency/bill values.
 */

/**
 * Normalizes and extracts raw numeric data from any formatted or manually typed currency string.
 * Keeps only digits and optionally a single decimal point (represented as '.' internal standard).
 */
export const getRawNumericString = (val: string): string => {
  if (!val) return '';
  const hasDigits = /\d/.test(val);
  if (!hasDigits) return '';

  // Strip anything that is NOT a digit, dot, or comma
  const clean = val.replace(/[^\d.,]/g, '');

  // Detect decimal separator by looking at the last occurrence of dot or comma.
  // If the last dot/comma is followed by exactly 1 or 2 digits, we assume it's a decimal separator.
  const lastIndex = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf(','));
  if (lastIndex !== -1) {
    const remainingPart = clean.substring(lastIndex + 1);
    if (remainingPart.length === 1 || remainingPart.length === 2) {
      const integerPart = clean.substring(0, lastIndex).replace(/[\D]/g, '');
      return `${integerPart}.${remainingPart}`;
    }
  }

  // Otherwise, it's just a whole number
  return clean.replace(/[\D]/g, '');
};

/**
 * Formats a raw numeric string (e.g. "1160000" or "123.45") based on language indicators.
 */
export const formatAmountByLang = (rawVal: string, lang: string): string => {
  if (!rawVal) return '';
  const isVi = lang === 'vi';
  const decimalSep = isVi ? ',' : '.';
  const thousandSep = isVi ? '.' : ',';

  const parts = rawVal.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;

  if (integerPart) {
    const num = parseInt(integerPart, 10);
    if (!isNaN(num)) {
      integerPart = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    }
  }

  if (decimalPart !== null && !isVi) {
    return `${integerPart}${decimalSep}${decimalPart}`;
  }
  return integerPart;
};

/**
 * Formats user input as they type, stripping unwanted characters and adding thousands separators.
 * Preserves partially typed decimals block like "123." for English.
 */
export const formatAmountString = (val: string, lang: string): string => {
  if (!val) return '';
  const isVi = lang === 'vi';
  const decimalSep = isVi ? ',' : '.';
  const thousandSep = isVi ? '.' : ',';

  // Remove everything except digits and the active decimal separator
  const regex = isVi ? /[^\d,]/g : /[^\d.]/g;
  const normalized = val.replace(regex, '');

  // Make sure there is at most one decimal separator
  const parts = normalized.split(decimalSep);
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts.slice(1).join('') : null;

  if (integerPart) {
    const num = parseInt(integerPart, 10);
    if (!isNaN(num)) {
      integerPart = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    }
  }

  if (decimalPart !== null) {
    const maxDecimals = isVi ? 0 : 2; // VND doesn't use decimals, USD uses max 2
    if (maxDecimals === 0) {
      return integerPart;
    }
    const trimmedDecimal = decimalPart.substring(0, maxDecimals);
    return trimmedDecimal ? `${integerPart}${decimalSep}${trimmedDecimal}` : `${integerPart}${decimalSep}`;
  }

  return integerPart;
};

/**
 * Formats any amount string for display in details or list views, with prefix/suffix.
 */
export const formatDisplayAmount = (amountStr: string, lang: string): string => {
  if (!amountStr) return '';
  
  const raw = getRawNumericString(amountStr);
  if (!raw) {
    // If it is already not numeric, return as is with basic spacing
    return amountStr;
  }

  const formatted = formatAmountByLang(raw, lang);
  if (!formatted) return amountStr;

  if (lang === 'vi') {
    return `${formatted} đ`;
  } else {
    return `$${formatted}`;
  }
};
