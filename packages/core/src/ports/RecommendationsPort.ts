export interface RecommendationsPort {
  /**
   * @param query arbitrary free-text (“Radiohead”, “Sushi” …)
   * @return top N entities Qloo believes are most relevant
   */
  searchEntities(query: string, limit?: number): Promise<Array<{
    id: string
    name: string
    type: string
    score: number
  }>>
}
