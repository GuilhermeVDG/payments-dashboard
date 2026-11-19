// PreToolUse hook for Edit/Write: blocks writing secrets into source files
// and editing real env files.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const ti = input?.tool_input ?? {};
const filePath = String(ti.file_path ?? '');
const content = [ti.content, ti.new_string, ...(ti.edits ?? []).map((e) => e?.new_string)]
  .filter(Boolean)
  .join('\n');

const name = basename(filePath);
if (/^\.env(\..+)?$/.test(name) && name !== '.env.example') {
  process.stderr.write(`Blocked by guard-secrets: do not edit ${name}. Update .env.example and ask the user to set real values.\n`);
  process.exit(2);
}

const secretPatterns = [
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, // JWT (Supabase keys)
  /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/, // Slack webhook
  /sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}/, // OpenAI / Anthropic keys
];

for (const re of secretPatterns) {
  if (re.test(content)) {
    process.stderr.write(`Blocked by guard-secrets: this change looks like it contains a real secret in ${filePath}. Read it from env via src/lib/env.ts instead.\n`);
    process.exit(2);
  }
}
process.exit(0);
