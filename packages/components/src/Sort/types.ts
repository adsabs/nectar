type SortDirection = 'asc' | 'desc';

export type SortType = [
  (
    | 'author_count'
    | 'bibcode'
    | 'citation_count'
    | 'citation_count_norm'
    | 'classic_factor'
    | 'first_author'
    | 'date'
    | 'entry_date'
    | 'read_count'
    | 'score'
  ),
  SortDirection,
];
