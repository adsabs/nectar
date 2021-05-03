export const examples = {
  left: [
    { label: 'author', text: 'author:"huchra, john"' },
    { label: 'first author', text: 'author:"^huchra, john"' },
    { label: 'abstract+title', text: 'abs:"dark energy"' },
    { label: 'year', text: 'year:2000' },
    { label: 'year range', text: 'year:2000-2005' },
    { label: 'full text', text: 'full:"gravity waves"' },
    { label: 'publication', text: 'bibstem:ApJ' },
  ],
  right: [
    { label: 'citations', text: 'citations(author:"huchra, j")' },
    { label: 'references', text: 'references(author:"huchra, j")' },
    { label: 'reviews', text: 'reviews("gamma-ray bursts")' },
    { label: 'refereed', text: 'property:refereed' },
    { label: 'astronomy', text: 'database:astronomy' },
    { label: 'OR', text: 'abs:(planet OR star)' },
  ],
};
