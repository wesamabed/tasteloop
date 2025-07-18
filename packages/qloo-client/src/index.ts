import fetch from 'cross-fetch';

export interface QlooEntity { id: string; name: string; domain: string; }
export interface QlooRec    { id: string; name: string; domain: string; score?: number; }

/**
 * Qloo API base. Overridable via env QLOO_BASE.
 * Fallback is the public marketing domain but hackathon sandboxes usually provide
 * a specific API Gateway URL. Set this in Cloud Run / local .env.
 */
const BASE = process.env.QLOO_BASE ?? 'https://hackathon.api.qloo.com';

/**
 * Builds a URL, attaches params, and sends GET with required auth headers.
 * Tries both legacy "Authorization: <token>" and optional "x-api-key" in case
 * the current environment expects one or the other. (Having both is harmless;
 * the server will just read what it needs.)
 */
async function qlooFetch(
  path: string,
  params?: Record<string, string | number | boolean | Array<string | number>>
): Promise<any> {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, BASE);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          url.searchParams.append(k, String(item));
        }
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const token = process.env.QLOO_API_KEY ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Legacy hackathon pattern: raw token in Authorization header. :contentReference[oaicite:2]{index=2}
  if (token) headers['Authorization'] = token;

  // Some newer APIs prefer x-api-key.
  if (token) headers['x-api-key'] = token;

  const res = await fetch(url.toString(), { method: 'GET', headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Qloo API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function searchEntities(query: string): Promise<QlooEntity[]> {
  return qlooFetch('/search', { query });  // Endpoint pattern shown in hackathon guide. :contentReference[oaicite:3]{index=3}
}

export async function getRecs(
  sampleIds: string[],
  domain?: string,
  limit = 5
): Promise<QlooRec[]> {
  const params: Record<string, any> = { sample: sampleIds };
  if (domain) params.domain = domain;
  if (limit) params.limit = limit;
  return qlooFetch('/recs', params);  // Endpoint pattern shown in hackathon guide. :contentReference[oaicite:4]{index=4}
}
