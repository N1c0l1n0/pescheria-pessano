import { describe, expect, it } from 'vitest';
import type { FishItem } from '../types/fishCatalog';
import {
  EMPTY_FISH_ITEM,
  canSaveFishDraft,
  formatFishPrice,
  isFishEditorDirty,
  parseFishPrice,
  patchFishItem,
  stepFishPrice,
} from './fishAdmin';

const sample: FishItem = {
  ...EMPTY_FISH_ITEM,
  id: 'branzino',
  name: 'Branzino',
  pricePerKg: 28,
  description: 'Non cancellare',
  cookingTip: 'Al sale',
  winePairing: 'Vermentino',
  locationDetail: 'Finale',
};

describe('stepFishPrice', () => {
  it('steps by half a euro and never goes below zero', () => {
    expect(stepFishPrice(18, 1)).toBe(18.5);
    expect(stepFishPrice(18.5, 1)).toBe(19);
    expect(stepFishPrice(0.5, -1)).toBe(0);
    expect(stepFishPrice(0, -1)).toBe(0);
  });
});

describe('parseFishPrice / formatFishPrice', () => {
  it('accepts comma decimals and formats for the listino', () => {
    expect(parseFishPrice('28,50')).toBe(28.5);
    expect(parseFishPrice('abc')).toBe(0);
    expect(parseFishPrice('-4')).toBe(0);
    expect(formatFishPrice(28)).toBe('28,00');
    expect(formatFishPrice(22.5)).toBe('22,50');
  });
});

describe('patchFishItem', () => {
  it('keeps editorial fields when only the price changes', () => {
    const next = patchFishItem(sample, { pricePerKg: 30 });
    expect(next.pricePerKg).toBe(30);
    expect(next.description).toBe('Non cancellare');
    expect(next.cookingTip).toBe('Al sale');
    expect(next.winePairing).toBe('Vermentino');
    expect(next.locationDetail).toBe('Finale');
  });
});

describe('fish editor draft', () => {
  it('requires a name and detects dirty catalog fields', () => {
    expect(canSaveFishDraft(EMPTY_FISH_ITEM)).toBe(false);
    expect(canSaveFishDraft({ ...EMPTY_FISH_ITEM, name: '  Orata  ' })).toBe(true);
    expect(isFishEditorDirty(sample, sample)).toBe(false);
    expect(isFishEditorDirty({ ...sample, name: 'Orata' }, sample)).toBe(true);
    expect(isFishEditorDirty({ ...EMPTY_FISH_ITEM, name: 'Orata' }, null)).toBe(true);
  });
});
