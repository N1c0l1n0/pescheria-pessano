import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authenticateKds,
  getKdsPin,
  isKdsAuthenticated,
  logoutKds,
} from './kdsAdmin';

describe('kdsAdmin', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it('getKdsPin reads VITE_KDS_ADMIN_PIN', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    expect(getKdsPin()).toBe('5678');
  });

  it('getKdsPin returns empty string when env missing', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '');
    expect(getKdsPin()).toBe('');
  });

  it('authenticateKds stores session on correct pin', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    expect(authenticateKds('5678')).toBe(true);
    expect(isKdsAuthenticated()).toBe(true);
  });

  it('authenticateKds rejects wrong pin', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    expect(authenticateKds('0000')).toBe(false);
    expect(isKdsAuthenticated()).toBe(false);
  });

  it('logoutKds clears session', () => {
    vi.stubEnv('VITE_KDS_ADMIN_PIN', '5678');
    authenticateKds('5678');
    logoutKds();
    expect(isKdsAuthenticated()).toBe(false);
  });
});
