import { TextSegmentationPort } from "../ports/TextSegmentationPort"
import { RecommendationsPort } from '../ports/RecommendationsPort'
import { TasteProfileRepo, Seed }   from '../ports/TasteProfileRepo'
import { logger } from '@tasteloop/observability';

export interface SeedProfileInput {
  userKey?: string            // optional → can still return results
  seedsText: string           // “Radiohead, Sushi”
  maxPerSeed?: number         // default 1 (take top match per term)
}

export interface SeedProfileOutput {
  chosen: Seed[]
}

export class SeedProfile {
  constructor(
    private readonly segmenter: TextSegmentationPort,
    private readonly recs: RecommendationsPort,
    private readonly repo: TasteProfileRepo,
  ) {}

  /** Parse, call Qloo, persist, return list */
  async execute(input: SeedProfileInput): Promise<SeedProfileOutput> {
    logger.info({ seedsText: input.seedsText, userKey: input.userKey }, 'SeedProfile.execute ▶');
    const segments = await this.segmenter.segment(input.seedsText); // string[]
    logger.debug({ segments }, 'Segments from segmenter');

    const terms = segments
      .flatMap(s => s.split(/[,\n;]/)) // s: string
      .map(t => t.trim())
      .filter(Boolean);
    logger.debug({ terms }, 'Cleaned terms');

    const results = await Promise.all(
      terms.map(t => this.recs.searchEntities(t, input.maxPerSeed ?? 1)),
    )
    logger.debug({ results }, 'Raw Qloo results');

    const chosen: Seed[] = results
      .map(arr => arr[0])            // top hit per term
      .filter(Boolean)
      .map(e => ({                   // normalise DTO
        id:     e.id,
        name:   e.name,
        domain: e.type,
        weight: e.score ?? 1,
      }))
    logger.info({ chosenCount: chosen.length }, 'Normalized & filtered seeds');

    if (input.userKey && chosen.length) {
      await this.repo.save(input.userKey, chosen)
      logger.info({ userKey: input.userKey }, 'Seeds saved to Mongo');
    }

    return { chosen }
  }
}
