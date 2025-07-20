import JSON5 from 'json5';
import { ZodSchema, z } from 'zod';
import { logger } from '@tasteloop/observability';

/**
 * Extract & parse a JSON (-ish) payload produced by an LLM.
 * Handles code-fences, prose before/after, stray commas, etc.
 *
 * @param raw       Raw model text
 * @param schema    Runtime validator for the *desired* structure
 * @throws          When nothing that looks like JSON can be recovered
 */
export function decodeLLMJson<T>(
  raw: string,
  schema: ZodSchema<T>
): T {
  logger.debug('Starting decodeLLMJson function.');
  logger.debug(`Received raw input: ${raw}`);

  // 1) Coarse trim (quick win)
  let txt = raw.trim();
  logger.debug(`After trim: ${txt}`);

  // 2) Remove ``` fences (```json … ``` or plain ``` … ```)
  txt = txt
    .replace(/^```(?:json|JSON)?/i, '')
    .replace(/```$/m, '')
    .trim();
  logger.debug(`After removing code fences: ${txt}`);

  // 3) The model may still prepend/append prose. Grab the first {...} or [...] that *parses* successfully.
  const match = /[{[][\s\S]+/.exec(txt);
  if (!match) {
    logger.error('No JSON block found in LLM output');
    throw new SyntaxError('No JSON block found in LLM output');
  }

  const candidate = match[0];
  logger.debug(`Extracted candidate JSON block: ${candidate}`);

  // 4) Parse with a forgiving parser, then validate strictly with zod.
  try {
    const parsed = JSON5.parse(candidate);
    logger.debug(`Parsed JSON object: ${JSON.stringify(parsed)}`);

    const validatedData = schema.parse(parsed);
    logger.debug('Schema validation successful.');

    return validatedData;
  } catch (err) {
    const errorMsg = (err as Error).message;
    logger.error(`Failed to parse/validate LLM JSON → ${errorMsg}`);
    throw new SyntaxError(`Failed to parse/validate LLM JSON → ${errorMsg}`);
  }
}

/* ---------- ready-made schema for our segmenter ---------- */
export const StringArraySchema = z.array(z.string().min(1));
