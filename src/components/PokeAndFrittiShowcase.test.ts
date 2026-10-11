import { describe, it, expect } from 'vitest';
// @ts-ignore
import fs from 'node:fs';

describe('Poke & Fritti Showcase Mobile Responsiveness', () => {
  const cssContent = fs.readFileSync(new URL('../index.css', import.meta.url), 'utf-8');

  it('contains dedicated responsive classes for poke hero card and showcase tabs', () => {
    expect(cssContent).toContain('.poke-hero-card');
    expect(cssContent).toContain('.poke-hero-image');
    expect(cssContent).toContain('.poke-showcase-tabs');
    expect(cssContent).toContain('.poke-format-item');
    expect(cssContent).toContain('.poke-section-card');
    expect(cssContent).toContain('.food-safety-notice-card');
    expect(cssContent).toContain('.food-safety-grid');
    expect(cssContent).toContain('.food-safety-subcard');
  });

  it('contains mobile media queries ensuring single-column layout and preventing overflow', () => {
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*860px\s*\)[\s\S]*?\.poke-hero-card[\s\S]*?grid-template-columns:\s*1fr/);
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*860px\s*\)[\s\S]*?\.poke-hero-image/);
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*520px\s*\)[\s\S]*?\.poke-showcase-tabs/);
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*860px\s*\)[\s\S]*?\.food-safety-grid[\s\S]*?grid-template-columns:\s*1fr/);
  });

  it('contains required food safety regulations (Reg. UE 1169/2011 & Reg. CE 853/2004)', () => {
    const tsxContent = fs.readFileSync(new URL('./PokeAndFrittiShowcase.tsx', import.meta.url), 'utf-8');
    expect(tsxContent).toContain('Reg. UE 1169/2011');
    expect(tsxContent).toContain('Reg. CE 853/2004');
    expect(tsxContent).toContain('allergie o intolleranze alimentari');
    expect(tsxContent).toContain('bonifica preventiva tramite abbattimento a freddo');
  });
});
