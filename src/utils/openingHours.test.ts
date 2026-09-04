import { describe, expect, it } from 'vitest';
import { getQuickTimeOptionsForDate } from './openingHours';

describe('getQuickTimeOptionsForDate 20-minute grid', () => {
  it('starts at 08:30 and steps 20 minutes on a Tuesday far in the future', () => {
    const date = new Date(2030, 8, 3, 7, 0, 0);
    const slots = getQuickTimeOptionsForDate(date);
    expect(slots[0]).toBe('08:30');
    expect(slots[1]).toBe('08:50');
    expect(slots[2]).toBe('09:10');
    expect(slots).toContain('14:30');
    expect(slots).not.toContain('14:50');
  });

  it('starts Friday evening at 17:45 not 18:00', () => {
    const date = new Date(2030, 8, 6, 7, 0, 0);
    const slots = getQuickTimeOptionsForDate(date);
    expect(slots).toContain('17:45');
    expect(slots).toContain('18:05');
    expect(slots).not.toContain('18:00');
  });
});
