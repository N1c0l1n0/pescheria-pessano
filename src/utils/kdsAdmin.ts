import { digitsOnly } from './fishCatalog';

const KDS_AUTH_KEY = 'kds_admin_auth';

export function getKdsPin(): string {
  return (
    import.meta.env.VITE_KDS_ADMIN_PIN?.trim() ||
    import.meta.env.VITE_FISH_ADMIN_PIN?.trim() ||
    '2134'
  );
}

export function isKdsAuthenticated(): boolean {
  return sessionStorage.getItem(KDS_AUTH_KEY) === '1';
}

export function authenticateKds(pin: string): boolean {
  const expected = getKdsPin();
  if (digitsOnly(pin) !== digitsOnly(expected)) return false;
  sessionStorage.setItem(KDS_AUTH_KEY, '1');
  return true;
}

export function logoutKds(): void {
  sessionStorage.removeItem(KDS_AUTH_KEY);
}
