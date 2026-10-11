import { describe, it, expect } from 'vitest';
import {
  POKE_FORMATS,
  POKE_BASES,
  POKE_PROTEINS,
  POKE_TOPPINGS,
  POKE_SAUCES,
  POKE_TOPPING_SHOWCASE_CATEGORIES,
  POKE_SAUCE_SHOWCASE_CATEGORIES,
  BASI,
  PROTEINE,
  INGREDIENTI,
  SALSE,
} from './pokeMenu';

describe('pokeMenu consistency with official order sheet', () => {
  it('has exactly 3 official formats with right limits and prices', () => {
    expect(POKE_FORMATS).toHaveLength(3);
    const regular = POKE_FORMATS.find((f) => f.id === 'regular');
    const regularPlus = POKE_FORMATS.find((f) => f.id === 'regularPlus');
    const xl = POKE_FORMATS.find((f) => f.id === 'xl');

    expect(regular?.price).toBe(10);
    expect(regular?.maxBasi).toBe(1);
    expect(regular?.maxProteine).toBe(1);
    expect(regular?.maxSecondari).toBe(3);
    expect(regular?.maxSalse).toBe(2);

    expect(regularPlus?.price).toBe(12);
    expect(regularPlus?.maxProteine).toBe(2);

    expect(xl?.price).toBe(15);
    expect(xl?.maxBasi).toBe(2);
    expect(xl?.maxProteine).toBe(3);
    expect(xl?.maxSecondari).toBe(5);
    expect(xl?.maxSalse).toBe(4);
  });

  it('has exactly 4 bases matching the physical order form', () => {
    expect(POKE_BASES.map((b) => b.name)).toEqual([
      'Riso Bianco',
      'Riso Venere',
      'Insalata',
      'Metà Riso Metà Insalata',
    ]);
    expect(BASI).toEqual(POKE_BASES.map((b) => b.name));
  });

  it('has all 11 proteins matching the physical order form', () => {
    const proteinNames = POKE_PROTEINS.map((p) => p.name);
    expect(proteinNames).toEqual([
      'Gambero Cotto',
      'Gambero in Tempura',
      'Salmone Crudo',
      'Salmone Scottato',
      'Salmone in Tempura',
      'Polpo',
      'Tonno Crudo',
      'Tonno in Tempura',
      'Tonno Scottato',
      'Pollo Grigliato',
      'Tofu',
    ]);
    expect(PROTEINE).toEqual(POKE_PROTEINS);
  });

  it('has all 26 secondary ingredients matching the physical order form', () => {
    expect(POKE_TOPPINGS).toHaveLength(26);
    expect(INGREDIENTI).toEqual(POKE_TOPPINGS);

    // Verify showcase categories contain all 26 toppings without duplicates or omissions
    const showcaseToppingNames = POKE_TOPPING_SHOWCASE_CATEGORIES.flatMap((c) =>
      c.items.map((i) => i.name)
    );
    expect(showcaseToppingNames).toHaveLength(26);
    const sortedOfficial = [...POKE_TOPPINGS.map((t) => t.name)].sort();
    const sortedShowcase = [...showcaseToppingNames].sort();
    expect(sortedShowcase).toEqual(sortedOfficial);
  });

  it('has all 16 sauces matching the physical order form', () => {
    expect(POKE_SAUCES).toHaveLength(16);
    expect(SALSE).toEqual(POKE_SAUCES);

    const showcaseSauceNames = POKE_SAUCE_SHOWCASE_CATEGORIES.flatMap((c) =>
      c.items.map((i) => i.name)
    );
    expect(showcaseSauceNames).toHaveLength(16);
    const sortedOfficial = [...POKE_SAUCES.map((s) => s.name)].sort();
    const sortedShowcase = [...showcaseSauceNames].sort();
    expect(sortedShowcase).toEqual(sortedOfficial);
  });
});
