import { describe, it, expect } from 'vitest';
import { generateJoinCode, isValidJoinCode, normaliseJoinCode } from '../joincode';

describe('generateJoinCode', () => {
  it('generates a code matching the expected format', () => {
    const code = generateJoinCode();
    expect(isValidJoinCode(code)).toBe(true);
  });

  it('generates different codes on successive calls (probabilistic)', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateJoinCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('isValidJoinCode', () => {
  it('accepts valid codes', () => {
    expect(isValidJoinCode('TIGER-42')).toBe(true);
    expect(isValidJoinCode('EAGLE-07')).toBe(true);
    expect(isValidJoinCode('PANDA-99')).toBe(true);
  });

  it('rejects invalid codes', () => {
    expect(isValidJoinCode('TIGER42')).toBe(false); // no dash
    expect(isValidJoinCode('TIG-42')).toBe(false); // word too short (< 4 chars)
    expect(isValidJoinCode('TIGER-4')).toBe(false); // single digit
    expect(isValidJoinCode('')).toBe(false);
  });

  it('accepts lowercase input (normalised before validation)', () => {
    // isValidJoinCode normalises input, so lowercase is accepted
    expect(isValidJoinCode('tiger-42')).toBe(true);
  });
});

describe('normaliseJoinCode', () => {
  it('uppercases and trims', () => {
    expect(normaliseJoinCode('  tiger-42  ')).toBe('TIGER-42');
    expect(normaliseJoinCode('eagle-19')).toBe('EAGLE-19');
  });
});
