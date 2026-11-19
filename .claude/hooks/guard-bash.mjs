// PreToolUse hook for Bash: blocks destructive or secret-leaking commands
// and enforces commit rules (dev branch, one-line conventional commits).
// Exit code 2 blocks the tool call and shows stderr to Claude.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const command = String(input?.tool_input?.command ?? '');

const rules = [
  { re: /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i, why: 'Recursive force delete is not allowed. Delete specific files instead.' },
  { re: /git\s+push\s+.*(--force|-f\b)/, why: 'Force push is not allowed.' },
  { re: /git\s+reset\s+--hard/, why: 'Hard reset is not allowed. Use git stash or a new commit.' },
  { re: /\b(cat|less|more|head|tail|grep|sed|awk)\b[^|]*\.env(\.local|\.production)?\b(?!\.example)/, why: 'Reading env files is not allowed.' },
  { re: /\bvercel\s+(--prod|deploy\s+--prod)/, why: 'Production deploys are done by the user, not the agent.' },
  { re: /curl\s+[^|]*\|\s*(sh|bash)/, why: 'Piping remote scripts into a shell is not allowed.' },
];

for (const { re, why } of rules) {
  if (re.test(command)) {
    process.stderr.write(`Blocked by guard-bash: ${why}\nCommand: ${command}\n`);
    process.exit(2);
  }
}

if (/\bgit\s+commit\b/.test(command)) {
  let branch = '';
  try {
    branch = execSync('git branch --show-current', { cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd() }).toString().trim();
  } catch {}
  if (branch !== 'dev') {
    process.stderr.write(`Blocked by guard-bash: commits go on the dev branch (current: "${branch || 'unknown'}"). Run: git switch dev || git switch -c dev\n`);
    process.exit(2);
  }
  const m = command.match(/-m\s+(["'])([\s\S]*?)\1/);
  const msg = m ? m[2] : '';
  const multipleMessages = (command.match(/\s-m\s/g) || []).length > 1;
  if (!/^(feat|fix|test|refactor|chore|docs|style)(\([a-z0-9-]+\))?: [a-z0-9].{0,70}$/.test(msg) || msg.includes('\n') || multipleMessages || /\.$/.test(msg)) {
    process.stderr.write(
      'Blocked by guard-bash: use a one-line conventional commit, lowercase, no period, max ~72 chars.\n' +
      'Example: git commit -m "feat: add payments table with sorting"\n'
    );
    process.exit(2);
  }
}
process.exit(0);
