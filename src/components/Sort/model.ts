import { SelectOption } from '@/components/Select';
import { BiblibSortField, SolrSortField } from '@/api/models';

export const solrSortOptions: SelectOption<SolrSortField>[] = [
  { id: 'score', value: 'score', label: 'Relevance' },
  { id: 'date', value: 'date', label: 'Date' },
  {
    id: 'author_count',
    value: 'author_count',
    label: 'Author Count',
  },
  {
    id: 'citation_count',
    value: 'citation_count',
    label: 'Citation Count',
  },
  {
    id: 'entry_date',
    value: 'entry_date',
    label: 'Entry Date',
  },
  {
    id: 'first_author',
    value: 'first_author',

    label: 'First Author',
  },
  {
    id: 'citation_count_norm',
    value: 'citation_count_norm',

    label: 'Normalized Citation Count',
  },
  { id: 'read_count', value: 'read_count', label: 'Read Count' },
];

export const biblibSortOptions: SelectOption<BiblibSortField>[] = [
  { id: 'date', value: 'date', label: 'Date' },
  {
    id: 'author_count',
    value: 'author_count',
    label: 'Author Count',
  },
  {
    id: 'citation_count',
    value: 'citation_count',
    label: 'Citation Count',
  },
  {
    id: 'entry_date',
    value: 'entry_date',
    label: 'Entry Date',
  },
  {
    id: 'first_author',
    value: 'first_author',

    label: 'First Author',
  },
  {
    id: 'citation_count_norm',
    value: 'citation_count_norm',

    label: 'Normalized Citation Count',
  },
  { id: 'read_count', value: 'read_count', label: 'Read Count' },
  { id: 'time', value: 'time', label: 'Time Added' },
];
