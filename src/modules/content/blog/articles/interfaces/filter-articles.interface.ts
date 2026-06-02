export interface FilterArticlesInterface {
  page?: string;
  q?: string;
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
