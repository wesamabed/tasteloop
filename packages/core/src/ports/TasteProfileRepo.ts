export interface TasteProfileRepo {
  /** Insert or update a user’s seeds list */
  save(userKey: string, seeds: readonly Seed[]): Promise<void>
}

export interface Seed {
  id: string
  name: string
  domain: string
  weight?: number
}
