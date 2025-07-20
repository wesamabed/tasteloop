import fetch from 'cross-fetch'

const BASE = process.env.QLOO_BASE ?? 'https://hackathon.api.qloo.com'

async function qlooFetch(
  path: string,
  params?: Record<string, string | number | boolean | Array<string | number>>
) {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, BASE)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      Array.isArray(v)
        ? v.forEach(val => url.searchParams.append(k, String(val)))
        : url.searchParams.set(k, String(v))
    }
  }

  const apiKey = process.env.QLOO_API_KEY ?? ''
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: apiKey,
    'x-api-key':   apiKey,
  }

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`Qloo API ${res.status}: ${await res.text()}`)
  return res.json()
}

export const searchEntities = (query: string) =>
  qlooFetch('/search', { query })

export const getRecs = (
  sampleIds: string[],
  domain?: string,
  limit = 5
) => {
  const params: Record<string, any> = { sample: sampleIds, limit }
  if (domain) params.domain = domain
  return qlooFetch('/recs', params)
}
