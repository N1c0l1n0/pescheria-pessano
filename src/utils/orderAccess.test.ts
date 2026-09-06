import { describe, expect, it } from 'vitest';
import { phoneLastFourDigits, verifyOrderPhoneAccess } from './orderAccess';

describe('phoneLastFourDigits', () => {
  it('returns last four digits', () => {
    expect(phoneLastFourDigits('333 1234567')).toBe('4567');
  });

  it('returns empty for too-short input', () => {
    expect(phoneLastFourDigits('12')).toBe('12');
  });
});

describe('verifyOrderPhoneAccess', () => {
  it('matches last four digits ignoring formatting', () => {
    expect(verifyOrderPhoneAccess('333 1234567', '4567')).toBe(true);
    expect(verifyOrderPhoneAccess('333 1234567', '1234')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(verifyOrderPhoneAccess('', '4567')).toBe(false);
    expect(verifyOrderPhoneAccess('3331234567', '')).toBe(false);
  });
});
