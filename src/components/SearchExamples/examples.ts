import { AppMode } from '@types';

export const examples = {
  [AppMode.GENERAL]: {
    left: [
      { label: 'author', text: 'author:"penrose, roger"' },
      { label: 'first author', text: 'author:"^penrose, roger"' },
      { label: 'abstract+title', text: 'abs:"black hole"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"black hole"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ],
    right: [
      { label: 'citations', text: 'citations(abstract:JWST)' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'collection', text: 'collection:astronomy' },
      { label: 'exact search', text: '=body:"reproducibility"' },
      { label: 'institution', text: 'inst:NASA' },
      { label: 'record type', text: 'doctype:software' },
    ],
  },
  [AppMode.ASTROPHYSICS]: {
    left: [
      { label: 'author', text: 'author:"huchra, john"' },
      { label: 'first author', text: 'author:"^huchra, john"' },
      { label: 'abstract+title', text: 'abs:"dark energy"' },
      { label: 'year', text: 'year:2000' },
      { label: 'year range', text: 'year:2000-2005' },
      { label: 'full text', text: 'full:"super Earth"' },
      { label: 'publication', text: 'bibstem:ApJ' },
    ],
    right: [
      { label: 'citations', text: 'citations(abstract:JWST)' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'collection', text: 'collection:astronomy' },
      { label: 'exact search', text: '=body:"reproducibility"' },
      { label: 'institution', text: 'inst:NASA' },
      { label: 'record type', text: 'doctype:software' },
    ],
  },
  [AppMode.HELIOPHYSICS]: {
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
      { label: 'citations', text: 'citations(abstract:JWST)' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'collection', text: 'collection:heliophysics' },
      { label: 'exact search', text: '=body:"reproducibility"' },
      { label: 'institution', text: 'inst:NASA' },
      { label: 'record type', text: 'doctype:software' },
    ],
  },
  [AppMode.EARTH_SCIENCE]: {
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
      { label: 'citations', text: 'citations(abstract:JWST)' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'collection', text: 'collection:earth' },
      { label: 'exact search', text: '=body:"reproducibility"' },
      { label: 'institution', text: 'inst:NASA' },
      { label: 'record type', text: 'doctype:software' },
    ],
  },
  [AppMode.PLANET_SCIENCE]: {
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
      { label: 'citations', text: 'citations(abstract:JWST)' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'collection', text: 'collection:planet' },
      { label: 'exact search', text: '=body:"reproducibility"' },
      { label: 'institution', text: 'inst:NASA' },
      { label: 'record type', text: 'doctype:software' },
    ],
  },
  [AppMode.BIO_PHYSICAL]: {
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
      { label: 'citations', text: 'citations(abstract:JWST)' },
      { label: 'refereed', text: 'property:refereed' },
      { label: 'collection', text: 'collection:biophysical' },
      { label: 'exact search', text: '=body:"reproducibility"' },
      { label: 'institution', text: 'inst:NASA' },
      { label: 'record type', text: 'doctype:software' },
    ],
  },
};
