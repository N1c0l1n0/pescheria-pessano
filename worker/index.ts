interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  FISH_ADMIN_PIN?: string;
  VITE_FISH_ADMIN_PIN?: string;
}

const DEFAULT_PIN = 'pessano2026';

function resolveAdminPin(env: Env): string {
  return env.FISH_ADMIN_PIN?.trim() || env.VITE_FISH_ADMIN_PIN?.trim() || DEFAULT_PIN;
}

async function verifyFishAdminPin(request: Request, env: Env): Promise<Response> {
  let body: { pin?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  const submitted = String(body.pin ?? '').trim();
  if (!submitted) {
    return Response.json({ ok: false, error: 'missing_pin' }, { status: 400 });
  }

  if (submitted === resolveAdminPin(env)) {
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: 'invalid_pin' }, { status: 401 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/fish-admin/verify') {
      if (request.method === 'POST') {
        return verifyFishAdminPin(request, env);
      }

      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      return Response.json({ ok: false, error: 'method_not_allowed' }, { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
