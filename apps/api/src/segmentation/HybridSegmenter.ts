import { SegmenterPort } from "@tasteloop/core";
import { logger } from "@tasteloop/observability";

export class HybridSegmenter implements SegmenterPort {
  constructor(
    private readonly primary: SegmenterPort,
    private readonly fallback: SegmenterPort
  ) {
    logger.debug(
      `HybridSegmenter initialized with primary: ${primary.constructor.name} and fallback: ${fallback.constructor.name}`
    );
  }

  async segment(text: string) {
    logger.debug("segment() called", { text });
    try {
      logger.debug("Attempting primary segmentation");
      const primaryResult = await this.primary.segment(text);
      logger.debug("Primary segmentation successful", { result: primaryResult });
      return primaryResult;
    } catch (error) {
      logger.error("Primary segmentation failed", { error });
      logger.debug("Attempting fallback segmentation");
      try {
        const fallbackResult = await this.fallback.segment(text);
        logger.debug("Fallback segmentation successful", { result: fallbackResult });
        return fallbackResult;
      } catch (fallbackError) {
        logger.error("Fallback segmentation also failed", { error: fallbackError });
        throw fallbackError;
      }
    }
  }
}
