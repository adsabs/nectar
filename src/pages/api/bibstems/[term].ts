import { IBibstemOption } from '@types';
import Fuse from 'fuse.js';
import DOMPurify from 'isomorphic-dompurify';
import type { NextApiRequest, NextApiResponse } from 'next';
import terms from 'public/data/bibstems/bibstems.json';
import index from 'public/data/bibstems/index.json';
import { map, prop } from 'ramda';

export interface BibstemSearchRequest extends NextApiRequest {
  query: {
    term: string;
  };
}

// create a fuse instance using pre-generated index
const fuse = new Fuse<IBibstemOption>(
  terms,
  {
    keys: [
      { name: 'value', weight: 0.7 },
      { name: 'label', weight: 0.3 },
    ],
    isCaseSensitive: false,
  },
  Fuse.parseIndex(index),
);

const formatResult = map(prop('item'));

export default (req: BibstemSearchRequest, res: NextApiResponse<IBibstemOption[]>) => {
  const value = DOMPurify.sanitize(req.query.term);

  const result = fuse.search(value, { limit: 100 });

  res.status(200).json(formatResult(result));
};
