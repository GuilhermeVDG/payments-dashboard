/**
 * Deterministic mock payments generator. Pure: same options in, same rows out.
 * Used by scripts/generate-payments.ts (writes src/data/payments.json) and by tests.
 */
import type {
  CardBrand,
  Currency,
  Payment,
  PaymentMethod,
  Status,
  Wallet,
  WalletCardBrand,
} from '../../src/domain/payment';
import { compareNewestFirst } from '../../src/domain/sort';

export const DEFAULT_SEED = 20261119;
/** Fixed "now" the dataset is generated relative to. */
export const DATA_ANCHOR = '2026-11-19T18:00:00.000Z';
export const DEFAULT_COUNT = 600;
export const DEFAULT_DAYS = 90;

export interface GeneratorOptions {
  seed?: number;
  anchor?: string;
  count?: number;
  days?: number;
}

type Rng = () => number;
type Weighted<T> = readonly (readonly [T, number])[];

/** mulberry32: small, fast, seedable PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function weighted<T>(rng: Rng, table: Weighted<T>): T {
  const total = table.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [value, w] of table) {
    roll -= w;
    if (roll < 0) return value;
  }
  return table[table.length - 1][0];
}

function logUniform(rng: Rng, min: number, max: number): number {
  return Math.exp(Math.log(min) + rng() * (Math.log(max) - Math.log(min)));
}

const STATUS_MIX: Weighted<Status> = [
  ['succeeded', 78],
  ['pending', 8],
  ['failed', 9],
  ['refunded', 5],
];

/** Non-ACH currency mix. ACH debits are always usd. */
const CURRENCY_MIX: Weighted<Currency> = [
  ['usd', 52],
  ['eur', 17],
  ['gbp', 10],
  ['cad', 8],
  ['brl', 6],
  ['aud', 4],
  ['jpy', 3],
];

const METHOD_MIX: Weighted<PaymentMethod['type']> = [
  ['card', 75],
  ['ach', 12],
  ['wallet', 13],
];

const CARD_BRAND_MIX: Weighted<CardBrand> = [
  ['visa', 52],
  ['mastercard', 30],
  ['amex', 11],
  ['discover', 7],
];

const WALLET_MIX: Weighted<Wallet> = [
  ['apple_pay', 60],
  ['google_pay', 40],
];

const WALLET_BRAND_MIX: Weighted<WalletCardBrand> = [
  ['visa', 65],
  ['mastercard', 35],
];

const BANKS = [
  'STRIPE TEST BANK',
  'JPMorgan Chase',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'U.S. Bank',
  'Capital One',
] as const;

const DESCRIPTIONS: Weighted<string | undefined> = [
  ['Subscription update', 46],
  ['Subscription creation', 16],
  ['Payment for Invoice', 12],
  ['One-time purchase', 6],
  ['Plan upgrade', 4],
  [undefined, 16],
];

/** Decline reasons as the Dashboard labels them. */
const FAILURE_REASONS: Weighted<string> = [
  ['Insufficient funds', 30],
  ['Do not honor', 22],
  ['Transaction not allowed', 14],
  ['Generic decline', 12],
  ['Expired card', 8],
  ['Incorrect CVC', 7],
  ['Card velocity exceeded', 4],
  ['Lost card', 3],
];

const FIRST_NAMES = [
  'Olivia',
  'Liam',
  'Emma',
  'Noah',
  'Ava',
  'Elijah',
  'Sophia',
  'James',
  'Isabella',
  'Lucas',
  'Mia',
  'Mateo',
  'Amelia',
  'Benjamin',
  'Harper',
  'Henry',
  'Evelyn',
  'Theo',
  'Camila',
  'Leo',
  'Sofia',
  'Daniel',
  'Aria',
  'Samuel',
  'Chloe',
  'Gabriel',
  'Layla',
  'Julian',
  'Nora',
  'Arthur',
  'Lucia',
  'Hugo',
  'Yuki',
  'Kenji',
  'Priya',
  'Arjun',
  'Fatima',
  'Omar',
  'Ingrid',
  'Lars',
] as const;

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Silva',
  'Santos',
  'Oliveira',
  'Costa',
  'Tanaka',
  'Sato',
  'Patel',
  'Khan',
  'Muller',
  'Rossi',
] as const;

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DAY_MS = 86_400_000;
const WEEKEND_WEIGHT = 0.45;

function paymentId(rng: Rng): string {
  // Real ids tend to start with a digit, e.g. pi_3Nx...; keep that look.
  let body = '3';
  for (let i = 0; i < 23; i++) body += BASE62[Math.floor(rng() * BASE62.length)];
  return `pi_${body}`;
}

function last4(rng: Rng): string {
  if (rng() < 0.04) return '4242';
  return String(Math.floor(rng() * 10_000)).padStart(4, '0');
}

function buildCustomers(rng: Rng, size: number): Payment['customer'][] {
  const customers: Payment['customer'][] = [];
  const emails = new Set<string>();
  while (customers.length < size) {
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const style = Math.floor(rng() * 4);
    const local = [
      `${first}.${last}`,
      `${first}${last}${Math.floor(rng() * 90) + 10}`,
      `${first[0]}${last}`,
      `${first}_${last[0]}`,
    ][style].toLowerCase();
    const email = `${local}@example.com`;
    if (emails.has(email)) continue;
    emails.add(email);
    customers.push({ name: `${first} ${last}`, email });
  }
  return customers;
}

/** Day offsets (0 = anchor day) weighted toward weekdays. */
function dayWeights(anchorMs: number, days: number): Weighted<number> {
  const table: [number, number][] = [];
  for (let offset = 0; offset < days; offset++) {
    const weekday = new Date(anchorMs - offset * DAY_MS).getUTCDay();
    table.push([offset, weekday === 0 || weekday === 6 ? WEEKEND_WEIGHT : 1]);
  }
  return table;
}

function createdAt(rng: Rng, anchorMs: number, offset: number): number {
  const dayStart = Math.floor(anchorMs / DAY_MS) * DAY_MS - offset * DAY_MS;
  // Most volume during Americas/Europe business hours (12:00 to 24:00 UTC).
  const secondOfDay =
    rng() < 0.75 ? 43_200 + Math.floor(rng() * 43_200) : Math.floor(rng() * 86_400);
  const ms = dayStart + secondOfDay * 1000;
  return ms > anchorMs ? anchorMs - Math.floor(rng() * 3_600) * 1000 : ms;
}

/** Amount in minor units. Major units mostly 10 to 500, long tail to 5,000; jpy scaled to yen. */
function amountFor(rng: Rng, currency: Currency): number {
  const major = rng() < 0.88 ? logUniform(rng, 10, 500) : logUniform(rng, 500, 5_000);
  if (currency === 'jpy') {
    return Math.round((major * 150) / 10) * 10; // ~150 yen per major unit, nearest 10 yen
  }
  const style = rng();
  const whole = Math.floor(major);
  if (style < 0.45) return whole * 100 + 99; // charm price: 19.99
  if (style < 0.65) return whole * 100; // round price: 20.00
  return Math.round(major * 100); // arbitrary: 13.18
}

function methodFor(rng: Rng, type: PaymentMethod['type']): PaymentMethod {
  switch (type) {
    case 'card':
      return { type, brand: weighted(rng, CARD_BRAND_MIX), last4: last4(rng) };
    case 'ach':
      return { type, bankName: pick(rng, BANKS), last4: last4(rng) };
    case 'wallet':
      return {
        type,
        wallet: weighted(rng, WALLET_MIX),
        brand: weighted(rng, WALLET_BRAND_MIX),
        last4: last4(rng),
      };
  }
}

export function generatePayments(options: GeneratorOptions = {}): Payment[] {
  const {
    seed = DEFAULT_SEED,
    anchor = DATA_ANCHOR,
    count = DEFAULT_COUNT,
    days = DEFAULT_DAYS,
  } = options;
  const rng = mulberry32(seed);
  const anchorMs = Date.parse(anchor);
  const customers = buildCustomers(rng, Math.ceil(count * 0.35));
  const dayTable = dayWeights(anchorMs, days);
  const ids = new Set<string>();
  const payments: Payment[] = [];

  while (payments.length < count) {
    const id = paymentId(rng);
    if (ids.has(id)) continue;
    ids.add(id);

    const methodType = weighted(rng, METHOD_MIX);
    const method = methodFor(rng, methodType);
    const currency: Currency = methodType === 'ach' ? 'usd' : weighted(rng, CURRENCY_MIX);
    const status = weighted(rng, STATUS_MIX);
    const createdMs = createdAt(rng, anchorMs, weighted(rng, dayTable));
    const description = weighted(rng, DESCRIPTIONS);

    const payment: Payment = {
      id,
      amount: amountFor(rng, currency),
      currency,
      status,
      customer: pick(rng, customers),
      method,
      created: new Date(createdMs).toISOString(),
    };
    if (description !== undefined) payment.description = description;
    if (status === 'failed') payment.failureReason = weighted(rng, FAILURE_REASONS);
    if (status === 'refunded') {
      const delay = 3_600_000 + Math.floor(rng() * 10 * DAY_MS);
      payment.refundedAt = new Date(Math.min(createdMs + delay, anchorMs)).toISOString();
    }
    payments.push(payment);
  }

  return payments.sort(compareNewestFirst);
}
