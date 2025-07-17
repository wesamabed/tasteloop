import fetch from 'cross-fetch';

export interface QlooEntity { id: string; name: string; domain: string; }
export interface QlooRec { id: string; name: string; domain: string; score?: number; }

const BASE = process.env.QLOO_BASE ?? 'https://api.qloo.com'; // update when docs available

async function qlooFetch(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.QLOO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    throw new Error(`Qloo API error ${res.status}`);
  }
  return res.json();
}

export async function searchEntities(query: string): Promise<QlooEntity[]> {
  return qlooFetch(`/search?query=${encodeURIComponent(query)}`);
}

export async function getRecs(sampleIds: string[], domain: string, limit = 5): Promise<QlooRec[]> {
  const params = new URLSearchParams({ sample: sampleIds.join(','), domain, limit: String(limit) });
  return qlooFetch(`/recs?${params.toString()}`);
}
