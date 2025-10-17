import { IBibstemOption } from '@/types';
import { IJournalSearchResponse, IJournalOption } from '@/api/journals/types';
import Fuse from 'fuse.js';
import DOMPurify from 'isomorphic-dompurify';
import type { NextApiRequest, NextApiResponse } from 'next';
import terms from 'public/data/bibstems/bibstems.json';
import index from 'public/data/bibstems/index.json';
import topTerms from 'public/data/bibstems/topterms.json';

export interface JournalSearchRequest extends NextApiRequest {
  query: {
    term: string;
    fieldType?: 'pub' | 'bibstem' | 'pub_abbrev';
  };
}

/**
 * Ranking function for sorting results
 * Prioritizes journals towards the top of the list
 */
const getRank = (value: string, score: number) => score * Math.log(2 + getPosition(value));

// retrieve the index position (if existing) in the `Top Terms` list
const getPosition = (value: string) => {
  const index = topTerms.indexOf(value);
  return index === -1 ? topTerms.length : index;
};

// Create a fuse instance using pre-generated index with weights optimized for journal search
// Searches across: bibstem identifier, publication name, and abbreviation
const fuse = new Fuse<IBibstemOption>(
  terms as IBibstemOption[],
  {
    keys: [
      // Weight bibstem highest (serves as abbreviation until we have dedicated pub_abbrev field)
      { name: 'value', weight: 0.6 },
      // Weight publication name lower (often long and less precise for search)
      { name: 'label', weight: 0.4 },
      // TODO: Add pub_abbrev field when available from Journals DB
      // { name: 'pub_abbrev', weight: 0.5 },
    ],
    isCaseSensitive: false,
    ignoreLocation: true,
    includeScore: true,
    // Allow slightly more fuzzy matching for journal names
    threshold: 0.3,
    sortFn: (a, b) => {
      const valueA = (a.item as { '0'?: { v: string } })[0]?.v;
      const valueB = (b.item as { '0'?: { v: string } })[0]?.v;
      return getRank(valueA, a.score) - getRank(valueB, b.score);
    },
  },
  Fuse.parseIndex(index),
);

// Convert bibstem options to journal options for autocomplete
const formatJournalResults = (
  results: Fuse.FuseResult<IBibstemOption>[],
  fieldType?: 'pub' | 'bibstem' | 'pub_abbrev',
): IJournalOption[] => {
  return results.map((result, index) => {
    const item = result.item;
    const pubName = Array.isArray(item.label) ? item.label[0] : item.label;

    // Determine the appropriate value based on field type
    let value: string;
    switch (fieldType) {
      case 'pub':
        // For pub: searches, return the full publication name
        value = `"${pubName}"`;
        break;
      case 'bibstem':
      case 'pub_abbrev':
      default:
        // For bibstem: and pub_abbrev: searches, return the bibstem (short identifier)
        value = `"${item.value}"`;
        break;
    }

    return {
      id: index,
      value,
      label: pubName,
      desc: `Bibstem: ${item.value}`,
      // Current field mapping (until Journals DB provides dedicated fields):
      bibstem: item.value, // e.g., "ApJ", "AJ", "MNRAS"
      pub: pubName, // e.g., "Astrophysical Journal"
      // For now, bibstem serves as abbreviation (will be replaced by canonical abbreviations from Journals DB)
      pub_abbrev: item.value,
    };
  });
};

const handler = (req: JournalSearchRequest, res: NextApiResponse<IJournalSearchResponse>) => {
  try {
    const searchTerm = DOMPurify.sanitize(req.query.term);
    const fieldType = req.query.fieldType;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(200).json({ journals: [] });
    }

    const results = fuse.search(searchTerm, { limit: 50 });
    const journals = formatJournalResults(results, fieldType);

    res.status(200).json({ journals });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown Server Error';
    res.status(500).json({ journals: [], error });
  }
};

export default handler;
