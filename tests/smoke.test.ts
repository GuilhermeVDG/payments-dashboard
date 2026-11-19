import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs in the configured time zone', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Sao_Paulo');
  });
});
