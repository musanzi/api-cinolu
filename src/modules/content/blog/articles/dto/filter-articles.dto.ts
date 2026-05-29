export interface FilterArticlesDto {
  page: string | null;
  q: string | null;
  filter?: 'all' | 'published' | 'drafts' | 'highlighted';
}
