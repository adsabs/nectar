export type TypeaheadOption = {
  value: string;
  label: string;
  desc: string;
  match: string;
};
export const typeaheadOptions: TypeaheadOption[] = [
  { value: 'author:""', label: 'Author', match: 'author:"', desc: '' },
  {
    value: 'author:"^"',
    label: 'First Author',
    match: 'first author',
    desc: '',
  },
  {
    value: 'author:"^"',
    label: 'First Author',
    match: 'author:"^',
    desc: '',
  },
  {
    value: 'bibcode:""',
    label: 'Bibcode',
    desc: 'e.g. bibcode:1989ApJ...342L..71R',
    match: 'bibcode:"',
  },
  {
    value: 'bibstem:""',
    label: 'Publication',
    desc: 'e.g. bibstem:ApJ',
    match: 'bibstem:"',
  },
  {
    value: 'bibstem:""',
    label: 'Publication',
    desc: 'e.g. bibstem:ApJ',
    match: 'publication (bibstem)',
  },
  { value: 'arXiv:', label: 'arXiv ID', desc: '', match: 'arxiv:' },
  { value: 'doi:', label: 'DOI', desc: '', match: 'doi:' },
  {
    value: 'full:""',
    label: 'Full text search',
    desc: 'title, abstract, and body',
    match: 'full:',
  },
  {
    value: 'full:""',
    label: 'Full text search',
    desc: 'title, abstract, and body',
    match: 'fulltext',
  },
  {
    value: 'full:""',
    label: 'Full text search',
    desc: 'title, abstract, and body',
    match: 'text',
  },
  { value: 'year:', label: 'Year', match: 'year', desc: '' },
  {
    value: 'year:1999-2005',
    label: 'Year Range',
    desc: 'e.g. 1999-2005',
    match: 'year range',
  },
  { value: 'aff:""', label: 'Affiliation', match: 'aff:', desc: '' },
  {
    value: 'abs:""',
    label: 'Search abstract + title + keywords',
    match: 'abs:',
    desc: '',
  },
  {
    value: 'database:astronomy',
    label: 'Limit to papers in the astronomy database',
    match: 'database:astronomy',
    desc: '',
  },
  {
    value: 'database:physics',
    label: 'Limit to papers in the physics database',
    match: 'database:physics',
    desc: '',
  },
  { value: 'title:""', label: 'Title', match: 'title:"', desc: '' },
  {
    value: 'orcid:',
    label: 'ORCiD identifier',
    match: 'orcid:',
    desc: '',
  },
  {
    value: 'object:',
    label: 'SIMBAD object (e.g. object:LMC)',
    desc: '',
    match: 'object:',
  },
  {
    value: 'property:refereed',
    label: 'Limit to refereed',
    desc: '(property:refereed)',
    match: 'refereed',
  },
  {
    value: 'property:refereed',
    label: 'Limit to refereed',
    desc: '(property:refereed)',
    match: 'property:refereed',
  },
  {
    value: 'property:notrefereed',
    label: 'Limit to non-refereed',
    desc: '(property:notrefereed)',
    match: 'property:notrefereed',
  },
  {
    value: 'property:notrefereed',
    label: 'Limit to non-refereed',
    desc: '(property:notrefereed)',
    match: 'notrefereed',
  },
  {
    value: 'property:eprint',
    label: 'Limit to eprints',
    desc: '(property:eprint)',
    match: 'eprint',
  },
  {
    value: 'property:eprint',
    label: 'Limit to eprints',
    desc: '(property:eprint)',
    match: 'property:eprint',
  },
  {
    value: 'property:openaccess',
    label: 'Limit to open access',
    desc: '(property:openaccess)',
    match: 'property:openaccess',
  },
  {
    value: 'property:openaccess',
    label: 'Limit to open access',
    desc: '(property:openaccess)',
    match: 'openaccess',
  },
  {
    value: 'doctype:software',
    label: 'Limit to software',
    desc: '(doctype:software)',
    match: 'software',
  },
  {
    value: 'doctype:software',
    label: 'Limit to software',
    desc: '(doctype:software)',
    match: 'doctype:software',
  },
  {
    value: 'property:inproceedings',
    label: 'Limit to papers in conference proceedings',
    desc: '(property:inproceedings)',
    match: 'proceedings',
  },
  {
    value: 'property:inproceedings',
    label: 'Limit to papers in conference proceedings',
    desc: '(property:inproceedings)',
    match: 'property:inproceedings',
  },
  {
    value: 'citations()',
    label: 'Citations',
    desc: 'Get papers citing your search result set',
    match: 'citations(',
  },
  {
    value: 'references()',
    label: 'References',
    desc: 'Get papers referenced by your search result set',
    match: 'references(',
  },
  {
    value: 'trending()',
    label: 'Trending',
    desc:
      'Get papers most read by users who recently read your search result set',
    match: 'trending(',
  },
  {
    value: 'reviews()',
    label: 'Review Articles',
    desc: 'Get most relevant papers that cite your search result set',
    match: 'reviews(',
  },
  {
    value: 'useful()',
    label: 'Useful',
    desc: 'Get papers most frequently cited by your search result set',
    match: 'useful(',
  },
  {
    value: 'similar()',
    label: 'Similar',
    desc: 'Get papers that have similar full text to your search result set',
    match: 'similar(',
  },
];
