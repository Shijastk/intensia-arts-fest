import { describe, it, expect } from 'vitest';
import { normalizeUsername, staffPasswordFields, staffPasswordMatches } from '../staffPassword';

describe('staff passwords', () => {
  it('stores a salted hash, never the password', async () => {
    const fields = await staffPasswordFields('judge@123');
    expect(fields.passwordHash).toMatch(/^[0-9a-f]{64}$/);
    expect(fields.passwordSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(fields)).not.toContain('judge@123');
    // Same password, new salt, different hash.
    expect((await staffPasswordFields('judge@123')).passwordHash).not.toBe(fields.passwordHash);
  });

  it('checks hashed and legacy plain-text passwords', async () => {
    const hashed = await staffPasswordFields('secret1');
    expect(await staffPasswordMatches(hashed, 'secret1')).toBe(true);
    expect(await staffPasswordMatches(hashed, 'secret2')).toBe(false);
    expect(await staffPasswordMatches({ password: 1234 }, '1234')).toBe(true);
    expect(await staffPasswordMatches({ password: '1234' }, '12345')).toBe(false);
    expect(await staffPasswordMatches({}, '')).toBe(false);
  });

  it('matches usernames case-insensitively', () => {
    expect(normalizeUsername('  Judge1 ')).toBe('judge1');
  });
});
