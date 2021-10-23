import { Theme } from '@types';

export const examples = {
  [Theme.GENERAL]: {
    left: [
      { label: 'author', text: 'author:"penrose, roger"' },
      { label: 'first author', text: 'author:"^penrose, roger' },
      { label: 'abstract+title', text: 'abs:"black hole"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"black hole"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ],
    right: [
      { label: 'citations', text: 'citations(author:"penrose, r")' },
      { label: 'references', text: 'references(author:"penrose, roger")' },
      { label: 'reviews', text: 'reviews("black hole")' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'astronomy', text: 'database:general' },
      { label: 'OR', text: 'abs:(planet OR star)' },
    ],
  },
  [Theme.ASTROPHYSICS]: {
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
  },
  [Theme.HELIOPHYISCS]: {
    left: [
      { label: 'author', text: 'author:"pollock, craig"' },
      { label: 'first author', text: 'author:"^pollock, craig"' },
      { label: 'abstract+title', text: 'abs:"plasma"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"plasma"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ],
    right: [
      { label: 'citations', text: 'citations(author:"pollock, c")' },
      { label: 'references', text: 'references(author:"pollock, c")' },
      { label: 'reviews', text: 'reviews("plasma")' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'astronomy', text: 'database:heliophysics' },
      { label: 'OR', text: 'abs:(dust OR magntic)' },
    ],
  },
  [Theme.EARTH_SCIENCE]: {
    left: [
      { label: 'author', text: 'author:"oreskes, naomi"' },
      { label: 'first author', text: 'author:"^oreskes, naomi"' },
      { label: 'abstract+title', text: 'abs:"plate tectonics"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"plate tectonics"' },
      { label: 'publication', text: 'bibstem:GeoJI' },
    ],
    right: [
      { label: 'citations', text: 'citations(author:"oreskes, n")' },
      { label: 'references', text: 'references(author:"oreskes, n")' },
      { label: 'reviews', text: 'reviews("plate tectonics")' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'astronomy', text: 'database:earthscience' },
      { label: 'OR', text: 'abs:(earthquake OR volcano)' },
    ],
  },
  [Theme.PLANET_SCIENCE]: {
    left: [
      { label: 'author', text: 'author:"sagan, carl"' },
      { label: 'first author', text: 'author:"^sagan, carl"' },
      { label: 'abstract+title', text: 'abs:"mars"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"mars"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ],
    right: [
      { label: 'citations', text: 'citations(author:"sagan, c")' },
      { label: 'references', text: 'references(author:"sagan, c")' },
      { label: 'reviews', text: 'reviews("mars")' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'astronomy', text: 'database:planet' },
      { label: 'OR', text: 'abs:(planet OR star)' },
    ],
  },
  [Theme.BIO_PHYSICAL]: {
    left: [
      { label: 'author', text: 'author:"houghton, michael"' },
      { label: 'first author', text: 'author:"^houghton, michael"' },
      { label: 'abstract+title', text: 'abs:"rna"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"rna"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ],
    right: [
      { label: 'citations', text: 'citations(author:"houghton, m")' },
      { label: 'references', text: 'references(author:"houghton, m")' },
      { label: 'reviews', text: 'reviews("rna")' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'astronomy', text: 'database:biophysical' },
      { label: 'OR', text: 'abs:(virus OR disease)' },
    ],
  },
};
