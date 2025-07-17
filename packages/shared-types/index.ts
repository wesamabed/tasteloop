export type Domain =
  | 'music'
  | 'tv'
  | 'film'
  | 'dining'
  | 'travel'
  | 'fashion'
  | 'books'
  | 'podcasts'
  | 'brands';

export interface TasteSeed {
  entityId: string;
  weight: number;
  name: string;
  domain: Domain;
}
