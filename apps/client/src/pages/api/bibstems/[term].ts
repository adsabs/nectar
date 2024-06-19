import { IBibstemOption } from '@/types';
import Fuse from 'fuse.js';
import DOMPurify from 'isomorphic-dompurify';
import type { NextApiRequest, NextApiResponse } from 'next';
import terms from 'public/data/bibstems/bibstems.json';
import index from 'public/data/bibstems/index.json';
import topTerms from 'public/data/bibstems/topterms.json';
import { map, prop } from 'ramda';

export interface SearchRequest extends NextApiRequest {
  query: {
    term: string;
  };
}

/**
 * Ranking function for sorting results
 *
 * So that a bibstem towards the bottom of the list
 * will receive a lower overall ranking
 */
const getRank = (value: string, score: number) => score * Math.log(2 + getPosition(value));

// retrieve the index position (if existing) in the `Top Terms` list
const getPosition = (value: string) => {
  const index = topTerms.indexOf(value);
  return index === -1 ? topTerms.length : index;
};

// create a fuse instance using pre-generated index
const fuse = new Fuse<IBibstemOption>(
  terms as IBibstemOption[],
  {
    keys: [
      { name: 'value', weight: 0.7 },
      { name: 'label', weight: 0.3 },
    ],
    isCaseSensitive: false,
    ignoreLocation: true,
    includeScore: true,
    sortFn: (a, b) => {
      const valueA = (a.item as { '0'?: { v: string } })[0]?.v;
      const valueB = (b.item as { '0'?: { v: string } })[0]?.v;
      return getRank(valueA, a.score) - getRank(valueB, b.score);
    },
  },
  Fuse.parseIndex(index),
);

// extract `item` from the result list
const formatResult = (result: Fuse.FuseResult<IBibstemOption>[]) => map(prop('item'), result);

export default (req: SearchRequest, res: NextApiResponse<IBibstemOption[] | { error: string }>) => {
  try {
    const value = DOMPurify.sanitize(req.query.term);

    const result = fuse.search(value, { limit: 100 });

    res.status(200).json(formatResult(result));
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown Server Error';
    res.status(500).json({ error });
  }
};
