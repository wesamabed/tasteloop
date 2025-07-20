export interface TextSegmentationPort {
  /** Returns an *ordered* list of search terms, already trimmed & lower-cased */
  segment(text: string): Promise<string[]>
}
