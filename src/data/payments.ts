import type { Payment } from '@/domain/payment';
import raw from './payments.json';

/**
 * The committed mock dataset. Its shape is verified row by row with `isPayment`
 * in tests/generator.test.ts, so the cast from the JSON literal type is safe.
 */
export const PAYMENTS = raw as readonly Payment[];
