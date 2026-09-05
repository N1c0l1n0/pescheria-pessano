import { describe, expect, it } from 'vitest';
import { digitsOnly } from './fishCatalog';

describe('digitsOnly', () => {
  it('keeps an already numeric PIN', () => {
    expect(digitsOnly('2134')).toBe('2134');
  });

  it('strips letters and spaces', () => {
    expect(digitsOnly('21a 34')).toBe('2134');
  });

  it('returns empty string for empty input', () => {
    expect(digitsOnly('')).toBe('');
  });
});
