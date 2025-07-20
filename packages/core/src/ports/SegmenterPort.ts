/**
 * One job only: turn an arbitrary user phrase into an
 * array of *clean* search terms.
 */
export interface SegmenterPort {
  /**
   * @param text  Full utterance from the user
   * @returns     Normalised, lower-cased “taste” tokens
   *              (e.g. ["radiohead", "sushi"])
   */
  segment(text: string): Promise<string[]>;
}
