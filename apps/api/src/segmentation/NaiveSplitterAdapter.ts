import { SegmenterPort } from "@tasteloop/core";
import { logger } from '@tasteloop/observability';

// Log file/module load
logger.debug("NaiveSplitterAdapter module loaded");

export class NaiveSplitterAdapter implements SegmenterPort {
  async segment(text: string): Promise<string[]> {
    logger.debug("NaiveSplitterAdapter.segment() called", { text });
    logger.trace("Starting segmentation process");

    const segments = text
      .split(/[,\n;]/) // Split by commas, new-lines, semicolons
      .map(segment => {
        const processedSegment = segment.trim().toLowerCase();
        logger.trace("Processed segment", {
          original: segment,
          processed: processedSegment,
        });
        return processedSegment;
      })
      .filter(segment => {
        const isValid = Boolean(segment);
        if (!isValid) {
          logger.trace("Filtered out empty segment");
        }
        return isValid;
      });

    logger.debug("Segmentation complete", { segments });
    return segments;
  }
}
