import { resolveClientIpFromHeaders } from './resolve-client-ip';

describe('resolveClientIpFromHeaders', () => {
  it('falls back to the fallback address when there is no x-forwarded-for header', () => {
    const ip = resolveClientIpFromHeaders({}, '127.0.0.1');

    expect(ip).toBe('127.0.0.1');
  });

  it('falls back to the fallback address when x-forwarded-for is blank', () => {
    const ip = resolveClientIpFromHeaders(
      { 'x-forwarded-for': '   ' },
      '127.0.0.1',
    );

    expect(ip).toBe('127.0.0.1');
  });

  it('returns the ip as-is when there is no proxy chain', () => {
    const ip = resolveClientIpFromHeaders(
      { 'x-forwarded-for': '9.9.9.9' },
      '127.0.0.1',
    );

    expect(ip).toBe('9.9.9.9');
  });

  it('trims surrounding whitespace around a single-hop value', () => {
    const ip = resolveClientIpFromHeaders(
      { 'x-forwarded-for': '  9.9.9.9  ' },
      '127.0.0.1',
    );

    expect(ip).toBe('9.9.9.9');
  });

  it('trusts the hop appended by the reverse proxy, not the client-supplied entries before it', () => {
    const realClientIpAppendedByRailway = '9.9.9.9';

    const ip = resolveClientIpFromHeaders(
      {
        'x-forwarded-for': `6.6.6.6, 1.1.1.1, ${realClientIpAppendedByRailway}`,
      },
      '127.0.0.1',
    );

    expect(ip).toBe(realClientIpAppendedByRailway);
  });

  it('falls back to the fallback address when the trusted hop is empty (malformed trailing comma)', () => {
    const ip = resolveClientIpFromHeaders(
      { 'x-forwarded-for': '6.6.6.6,' },
      '127.0.0.1',
    );

    expect(ip).toBe('127.0.0.1');
  });
});
