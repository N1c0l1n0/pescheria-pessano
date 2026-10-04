import { describe, expect, it } from 'vitest';
import worker from './index';

describe('Cloudflare Worker /api/fish-admin/verify', () => {
  const dummyAssets = { fetch: async () => new Response('assets') };

  it('accepts correct default PIN 2134 when env is empty', async () => {
    const request = new Request('https://pescheriapessano.it/api/fish-admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '2134' }),
    });

    const response = await worker.fetch(request, { ASSETS: dummyAssets });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it('rejects incorrect PIN 9999', async () => {
    const request = new Request('https://pescheriapessano.it/api/fish-admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '9999' }),
    });

    const response = await worker.fetch(request, { ASSETS: dummyAssets });
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toEqual({ ok: false, error: 'invalid_pin' });
  });

  it('accepts custom PIN when FISH_ADMIN_PIN is configured in env', async () => {
    const request = new Request('https://pescheriapessano.it/api/fish-admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '5678' }),
    });

    const response = await worker.fetch(request, {
      ASSETS: dummyAssets,
      FISH_ADMIN_PIN: '5678',
    });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
