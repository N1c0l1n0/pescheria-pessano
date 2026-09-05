import { describe, expect, it, vi } from 'vitest';
import { getMealPresetOptionsForDate, getQuickTimeOptionsForDate } from './openingHours';

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

describe('getMealPresetOptionsForDate', () => {
  it('returns exact lunch targets on Tuesday (08:30 grid)', () => {
    const date = new Date(2030, 8, 3, 10, 0, 0); // Tue Sep 3 2030
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['12:10', '12:30', '13:10']);
    expect(presets.cena).toEqual([]);
  });

  it('returns lunch and dinner on Friday', () => {
    const date = new Date(2030, 8, 6, 10, 0, 0); // Fri Sep 6 2030
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['12:10', '12:30', '13:10']);
    expect(presets.cena).toEqual(['18:45', '19:05', '19:25', '20:05']);
  });

  it('resolves lunch to nearest grid slots on Sunday (09:00 grid)', () => {
    const date = new Date(2030, 8, 1, 10, 0, 0); // Sun Sep 1 2030
    const presets = getMealPresetOptionsForDate(date);
    expect(presets.pranzo).toEqual(['12:20', '12:40', '13:20']);
    expect(presets.cena).toEqual(['18:45', '19:05', '19:25', '20:05']);
  });

  it('excludes past lunch presets when date is today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 8, 3, 12, 35, 0));
    try {
      const date = new Date(2030, 8, 3, 12, 35, 0);
      const presets = getMealPresetOptionsForDate(date);
      expect(presets.pranzo).toEqual(['13:10']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns empty lists on Monday', () => {
    const date = new Date(2030, 8, 2, 10, 0, 0); // Mon Sep 2 2030
    expect(getMealPresetOptionsForDate(date)).toEqual({ pranzo: [], cena: [] });
  });
});
