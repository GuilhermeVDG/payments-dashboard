import { describe, expect, it } from 'vitest';
import { CSV_BOM, CSV_HEADER, csvAmount, csvFilename, escapeCsvField, toCsv } from '@/domain/csv';
import { local, makePayment } from './fixtures';

describe('escapeCsvField', () => {
  it('leaves plain values alone', () => {
    expect(escapeCsvField('Subscription update')).toBe('Subscription update');
  });

  it('quotes commas, quotes, newlines and edge spaces, doubling quotes', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField('line\nbreak')).toBe('"line\nbreak"');
    expect(escapeCsvField(' padded')).toBe('" padded"');
  });

  it('neutralises formula injection in text fields', () => {
    expect(escapeCsvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvField('+1')).toBe("'+1");
    expect(escapeCsvField('-1')).toBe("'-1");
    expect(escapeCsvField('@cmd')).toBe("'@cmd");
  });

  it('does not alter non-text fields', () => {
    expect(escapeCsvField('-12.50', { text: false })).toBe('-12.50');
  });
});

describe('csvAmount', () => {
  it('writes major units with the currency precision and no grouping', () => {
    expect(csvAmount(123450, 'usd')).toBe('1234.50');
    expect(csvAmount(5, 'eur')).toBe('0.05');
    expect(csvAmount(500000, 'jpy')).toBe('500000');
  });
});

describe('toCsv', () => {
  const card = makePayment({
    id: 'pi_3Csv0000000000000000card',
    amount: 1999,
    currency: 'usd',
    status: 'succeeded',
    customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
    method: { type: 'card', brand: 'visa', last4: '0042' },
    created: '2026-11-19T17:41:00.000Z',
    description: 'Plan, annual',
  });
  const wallet = makePayment({
    id: 'pi_3Csv000000000000000walle',
    amount: 5000,
    currency: 'jpy',
    status: 'failed',
    failureReason: 'Insufficient funds',
    method: { type: 'wallet', wallet: 'apple_pay', brand: 'mastercard', last4: '4444' },
    created: '2026-11-18T10:00:00.000Z',
  });

  it('writes a header and one CRLF-terminated row per payment, in input order', () => {
    const csv = toCsv([card, wallet]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    const lines = csv.slice(CSV_BOM.length).split('\r\n');
    expect(lines[0]).toBe(CSV_HEADER.join(','));
    expect(lines).toHaveLength(4);
    expect(lines[3]).toBe('');
    expect(lines[1]).toBe(
      'pi_3Csv0000000000000000card,2026-11-19T17:41:00.000Z,19.99,USD,Succeeded,Ada Lovelace,ada@example.com,Card,Visa,,0042,"Plan, annual",,',
    );
    expect(lines[2]).toContain(',5000,JPY,Failed,');
    expect(lines[2]).toContain(',Wallet,Mastercard,Apple Pay,4444,,,Insufficient funds');
  });

  it('writes only the header for an empty view', () => {
    expect(toCsv([])).toBe(`${CSV_BOM}${CSV_HEADER.join(',')}\r\n`);
  });

  it('includes ACH bank names and refund dates', () => {
    const ach = makePayment({
      status: 'refunded',
      refundedAt: '2026-11-20T09:00:00.000Z',
      method: { type: 'ach', bankName: 'Wells Fargo', last4: '6789' },
    });
    expect(toCsv([ach])).toContain(',ACH,Wells Fargo,,6789,');
    expect(toCsv([ach])).toContain('2026-11-20T09:00:00.000Z');
  });
});

describe('csvFilename', () => {
  it('uses the local date', () => {
    expect(csvFilename(local(2026, 11, 19, 23, 30))).toBe('payments-2026-11-19.csv');
  });
});
