import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Legal Modals dynamic policy text', () => {
  const privacyModalPath = path.resolve(__dirname, 'PrivacyPolicyModal.tsx');
  const cookieModalPath = path.resolve(__dirname, 'CookiePolicyModal.tsx');
  const legalCopyPath = path.resolve(__dirname, '../constants/legalCopy.ts');

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
