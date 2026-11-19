/**
 * Money helpers. Amounts are always integers in the currency's minor unit
 * (cents for usd, whole yen for jpy). Formatting goes through Intl only.
 */

const LOCALE = 'en-US';

/**
 * ISO 4217 code, any case. Payments use the lowercase `Currency` union.
 * Callers holding untrusted input (URL params) must validate against `CURRENCIES` first:
 * Intl throws RangeError on malformed codes and formats unknown 3-letter codes generically.
 */
export type CurrencyCode = string;

const formatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: CurrencyCode): Intl.NumberFormat {
  const code = currency.toUpperCase();
  let formatter = formatters.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: code });
    formatters.set(code, formatter);
  }
  return formatter;
}

/** Number of minor-unit digits for a currency: 2 for usd, 0 for jpy and krw. */
export function currencyFractionDigits(currency: CurrencyCode): number {
  return currencyFormatter(currency).resolvedOptions().maximumFractionDigits ?? 2;
}

/** Converts an integer minor-unit amount to major units (1234 usd -> 12.34). */
export function toMajor(minor: number, currency: CurrencyCode): number {
  return minor / 10 ** currencyFractionDigits(currency);
}

/**
 * Converts a major-unit amount to integer minor units (12.34 usd -> 1234).
 * Rounds half away from zero on the decimal value as written (1.005 -> 101), so binary
 * floating point noise does not decide the result.
 */
export function toMinor(major: number, currency: CurrencyCode): number {
  if (!Number.isFinite(major)) {
    throw new RangeError(`Amount must be a finite number, got ${major}`);
  }
  const scaled = Number((major * 10 ** currencyFractionDigits(currency)).toPrecision(15));
  return Math.sign(scaled) * Math.round(Math.abs(scaled)) || 0;
}

/** Formats a minor-unit amount with its currency symbol: `$1,234.56`, `€12.00`, `¥5,000`. */
export function formatAmount(minor: number, currency: CurrencyCode): string {
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`Amount must be an integer in minor units, got ${minor}`);
  }
  return currencyFormatter(currency).format(toMajor(minor, currency));
}

/** Uppercase ISO code shown next to the amount: `USD`. */
export function formatCurrencyCode(currency: CurrencyCode): string {
  return currency.toUpperCase();
}

/**
 * Converts an inclusive filter bound to minor units without widening it: a minimum
 * rounds up and a maximum rounds down to the nearest representable amount
 * (max 10.5 jpy -> 10 yen, min 10.005 usd -> 1001 cents).
 */
export function toMinorBound(major: number, currency: CurrencyCode, side: 'min' | 'max'): number {
  if (!Number.isFinite(major)) {
    throw new RangeError(`Amount must be a finite number, got ${major}`);
  }
  const scaled = Number((major * 10 ** currencyFractionDigits(currency)).toPrecision(15));
  return (side === 'min' ? Math.ceil(scaled) : Math.floor(scaled)) || 0;
}
