// PostToolUse hook for Edit/Write: formats the edited file with Prettier.
// Never blocks: formatting problems are reported but the edit stays.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = String(input?.tool_input?.file_path ?? '');

if (/\.(ts|tsx|js|mjs|json|md|sql)$/.test(filePath) && !filePath.includes('node_modules')) {
  try {
    execFileSync('npx', ['--no-install', 'prettier', '--write', filePath], { stdio: 'ignore' });
  } catch {
    process.stderr.write(`[format] prettier skipped for ${filePath} (not installed or failed)\n`);
  }
}
process.exit(0);
