import { describe, it, expect } from 'vitest';
// @ts-ignore
import fs from 'node:fs';

describe('Header Mobile Navigation & Transitions', () => {
  const headerContent = fs.readFileSync(new URL('./Header.tsx', import.meta.url), 'utf-8');
  const cssContent = fs.readFileSync(new URL('../index.css', import.meta.url), 'utf-8');

  it('immediately closes and unmounts the mobile menu when a section link is clicked', () => {
    // handleSectionNav must set isMenuMounted to false and cancel any pending timeout
    expect(headerContent).toMatch(/handleSectionNav[\s\S]*?setIsMenuMounted\(false\)/);
    expect(headerContent).toMatch(/handleSectionNav[\s\S]*?setMobileMenuOpen\(false\)/);
  });

  it('does not include mobileMenuOpen in useEffect dependency array to avoid clearing timeout prematurely', () => {
    // The main scroll/resize effect should not restart on every mobileMenuOpen toggle
    expect(headerContent).not.toMatch(/useEffect\([\s\S]*?\},\s*\[mobileMenuOpen\]\)/);
  });

  it('does not force opacity 1 on t-panel-slide or t-stagger-line in prefers-reduced-motion', () => {
    // prefers-reduced-motion must only disable transition, never force opacity: 1 on closing/hidden panels
    expect(cssContent).not.toMatch(/\.t-panel-slide[\s\S]*?opacity:\s*1\s*!important/);
  });

  it('does not include recensioni in navigation links to avoid clutter and overlap', () => {
    expect(headerContent).not.toMatch(/href="\/#recensioni"/);
  });

  it('protects the brand header and desktop-nav against flex shrinking to prevent text overlap', () => {
    expect(headerContent).toMatch(/className="header-brand"[\s\S]*?flexShrink:\s*0/);
    expect(headerContent).toMatch(/className="desktop-nav"[\s\S]*?flexShrink:\s*0/);
  });

  it('uses an appropriate desktop navigation breakpoint (1100px) to prevent overlapping on medium screens', () => {
    expect(headerContent).toMatch(/@media\s*\(min-width:\s*1100px\)/);
  });
});
