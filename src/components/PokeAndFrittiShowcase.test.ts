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
  });

  it('contains mobile media queries ensuring single-column layout and preventing overflow', () => {
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*860px\s*\)[\s\S]*?\.poke-hero-card[\s\S]*?grid-template-columns:\s*1fr/);
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*860px\s*\)[\s\S]*?\.poke-hero-image/);
    expect(cssContent).toMatch(/@media\s*\(\s*max-width:\s*520px\s*\)[\s\S]*?\.poke-showcase-tabs/);
  });
});
