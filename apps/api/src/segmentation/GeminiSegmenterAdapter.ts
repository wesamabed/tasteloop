import type { SegmenterPort } from "@tasteloop/core";
import { decodeLLMJson, StringArraySchema } from "../lib/llmJson";
import type { GenerativeModel } from "@google/generative-ai";
import { logger } from '@tasteloop/observability';

/**
 * GeminiSegmenterAdapter is an adapter for the Gemini LLM to segment text into
 * taste terms, returning them as an array of strings.
 */
export class GeminiSegmenterAdapter implements SegmenterPort {
  constructor(private model: GenerativeModel) {
    logger.debug('Initializing GeminiSegmenterAdapter');
  }

  async segment(text: string): Promise<string[]> {
    logger.debug({ text }, 'Entering segment method with input text');
    const trimmedText = text.trim();
    logger.trace({ trimmedText }, 'Trimmed input text');

    const prompt = String.raw`
    You are a JSON generator whose ONLY job is to extract “taste terms” from arbitrary user text.  
    — Respond STRICTLY with a JSON array of strings (no markdown, no prose, no code fences).  
    — Each array element must be a single noun or noun-phrase, lower-cased and trimmed.  
    — Do not include duplicates.  
    — If you can’t find anything, return an empty array [].

    Example:
      Input:  "I love sushi 🍣, Radiohead, and dark-roast coffee—plus cinnamon rolls!"
      Output: ["sushi", "radiohead", "dark-roast coffee", "cinnamon rolls"]

    Now process the following:
    Text: """${trimmedText}"""
    `;

    logger.debug({ prompt }, 'Constructed prompt for model');

    logger.debug('Calling model.generateContent with prompt');
    const res = await this.model.generateContent(prompt);
    logger.trace({ res }, 'Received response from model.generateContent');

    const raw =
      res.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    logger.trace({ raw }, 'Extracted raw text from model response');

    logger.debug('Decoding raw JSON output');
    const tokens = decodeLLMJson(raw, StringArraySchema);
    logger.info({ tokens }, 'Decoded tokens from raw JSON output');

    logger.debug('Exiting segment method with tokens');
    return tokens;
  }
}