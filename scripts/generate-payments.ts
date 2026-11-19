/**
 * Writes the deterministic mock dataset to src/data/payments.json.
 * Run with: npm run generate:data
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generatePayments } from './lib/payments-generator';

const outFile = fileURLToPath(new URL('../src/data/payments.json', import.meta.url));
const payments = generatePayments();

writeFileSync(outFile, `${JSON.stringify(payments, null, 2)}\n`);
process.stdout.write(`Wrote ${payments.length} payments to src/data/payments.json\n`);
