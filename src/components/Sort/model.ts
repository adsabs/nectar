import { SolrSortField } from '@api';

export interface ISortDescriptor {
  id: SolrSortField;
  text: string;
  desc: string;
}

export const sortValues: ISortDescriptor[] = [
  {
    id: 'author_count',
    text: 'Author Count',
    desc: 'sort by number of authors',
  },
  { id: 'bibcode', text: 'Bibcode', desc: 'sort by bibcode' },
  {
    id: 'citation_count',
    text: 'Citation Count',
    desc: 'sort by number of citations',
  },
  {
    id: 'citation_count_norm',
    text: 'Normalized Citation Count',
    desc: 'sort by number of normalized citations',
  },
  {
    id: 'classic_factor',
    text: 'Classic Factor',
    desc: 'sort using classical score',
  },
  {
    id: 'first_author',
    text: 'First Author',
    desc: 'sort by first author',
  },
  { id: 'date', text: 'Date', desc: 'sort by publication date' },
  {
    id: 'entry_date',
    text: 'Entry Date',
    desc: 'sort by date work entered the database',
  },
  { id: 'read_count', text: 'Read Count', desc: 'sort by number of reads' },
  { id: 'score', text: 'Score', desc: 'sort by the relative score' },
];
