// packages/qloo-client/src/QlooClient.ts
import fetch from 'cross-fetch';
import { RecommendationsPort } from '@tasteloop/core';
import { logger } from '@tasteloop/observability';

export interface RecEntity {
  id: string;
  name: string;
  type: string;
  score: number;
}

export class QlooClient implements RecommendationsPort {
  constructor(
    private readonly apiKey: string,
    private readonly base = process.env.QLOO_BASE ??
      'https://hackathon.api.qloo.com',
  ) {}

  /** Implements RecommendationsPort */

async searchEntities(query: string, limit = 5): Promise<RecEntity[]> {
  logger.debug({ query, limit }, 'QlooClient.searchEntities ▶');
  const url = new URL('/search', this.base)
  url.searchParams.set('query', query)
  url.searchParams.set('take',  String(Math.max(limit, 2))) // Qloo needs >1

  const res  = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key':    this.apiKey,      // their preferred header
      Authorization:  this.apiKey       // legacy header also ok
    }
  })

  if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, body: text }, 'Qloo API error');
      throw new Error(`Qloo ${res.status}`);
  }
  /* ---------- unwrap any of the known response shapes ---------- */
  const raw   = await res.json()
  logger.trace({ raw }, 'Raw Qloo response');

  const list: any[] =
        Array.isArray(raw)                 ? raw :
        Array.isArray(raw.results)         ? raw.results :
        Array.isArray(raw.entities)        ? raw.entities :
        Array.isArray(raw.data)            ? raw.data :
        []
  logger.info({ hits: list.length }, 'QlooClient hits');
  /* ---------- adapt to RecommendationsPort DTO ---------- */
  const adapted = list.map(e => ({
    id:    e.entity_id ?? e.id,
    name:  e.name,
    type:  Array.isArray(e.types) ? e.types[0] : (e.type ?? 'unknown'),
    score: typeof e.popularity === 'number' ? e.popularity : 1
  })) as RecEntity[]
  logger.debug({ adapted }, 'Adapted entities');
  return adapted;
}
}
