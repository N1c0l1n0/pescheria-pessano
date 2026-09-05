import { describe, expect, it, vi } from 'vitest';
import {
  getMealPresetOptionsForDate,
  getQuickTimeOptionsForDate,
  getVisibleMealGroups,
} from './openingHours';

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

describe('getVisibleMealGroups', () => {
  it('shows only pranzo on Friday morning', () => {
    const today = new Date(2030, 8, 6, 10, 0, 0);
    expect(getVisibleMealGroups(today, today)).toEqual({
      showPranzo: true,
      showCena: false,
    });
  });

  it('shows pranzo and cena in the last 30 minutes before Friday morning close', () => {
    const today = new Date(2030, 8, 6, 14, 20, 0);
    expect(getVisibleMealGroups(today, today)).toEqual({
      showPranzo: true,
      showCena: true,
    });
  });

  it('shows only cena after Friday morning close', () => {
    const today = new Date(2030, 8, 6, 15, 0, 0);
    expect(getVisibleMealGroups(today, today)).toEqual({
      showPranzo: false,
      showCena: true,
    });
  });

  it('ignores device phase for Domani', () => {
    const now = new Date(2030, 8, 6, 15, 0, 0); // Fri 15:00
    const tomorrow = new Date(2030, 8, 7, 15, 0, 0); // Sat
    expect(getVisibleMealGroups(tomorrow, now)).toEqual({
      showPranzo: true,
      showCena: true,
    });
  });

  it('never shows cena on Wednesday', () => {
    const morning = new Date(2030, 8, 4, 10, 0, 0);
    const afternoon = new Date(2030, 8, 4, 15, 0, 0);
    expect(getVisibleMealGroups(morning, morning)).toEqual({
      showPranzo: true,
      showCena: false,
    });
    expect(getVisibleMealGroups(afternoon, afternoon)).toEqual({
      showPranzo: false,
      showCena: false,
    });
  });

  it('hides both groups on Monday', () => {
    const monday = new Date(2030, 8, 2, 10, 0, 0);
    expect(getVisibleMealGroups(monday, monday)).toEqual({
      showPranzo: false,
      showCena: false,
    });
  });
});
