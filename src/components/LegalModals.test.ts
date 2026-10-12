import { describe, expect, it } from 'vitest';
// @ts-ignore
import fs from 'node:fs';

describe('Legal Modals dynamic policy text', () => {
  const privacyModalPath = new URL('./PrivacyPolicyModal.tsx', import.meta.url);
  const cookieModalPath = new URL('./CookiePolicyModal.tsx', import.meta.url);
  const legalCopyPath = new URL('../constants/legalCopy.ts', import.meta.url);

  it('PrivacyPolicyModal supports both showcase and online ordering modes', () => {
    const content = fs.readFileSync(privacyModalPath, 'utf-8');
    expect(content).toContain('FEATURES.ONLINE_ORDERING');
    // Showcase branch
    expect(content).toContain('sito vetrina');
    // Ordering branch
    expect(content).toContain('Supabase Inc.');
    expect(content).toContain('PRIVACY_RETENTION_ORDERS');
  });

  it('CookiePolicyModal conditionally handles order storage key based on FEATURES', () => {
    const content = fs.readFileSync(cookieModalPath, 'utf-8');
    expect(content).toContain('FEATURES.ONLINE_ORDERING');
    expect(content).toContain('pessano_cookie_consent');
    expect(content).toContain('pescheria_pessano_orders_store');
  });

  it('legalCopy exports dynamic retention copy dependent on FEATURES.ONLINE_ORDERING', () => {
    const content = fs.readFileSync(legalCopyPath, 'utf-8');
    expect(content).toContain('FEATURES.ONLINE_ORDERING');
    expect(content).toContain('PRIVACY_RETENTION_ORDERS_ACTIVE');
    expect(content).toContain('PRIVACY_RETENTION_ORDERS_VETRINA');
  });
});
