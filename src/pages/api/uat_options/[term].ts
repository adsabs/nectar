import { NextApiRequest, NextApiResponse } from 'next';
import uatTerms from 'public/data/uat/UAT_list.json';
import Fuse from 'fuse.js';
import { TypeaheadOption } from '@/components/SearchBar/types';

export interface SearchRequest extends NextApiRequest {
  query: {
    term: string;
  };
}

interface IUatTerm {
  name: string;
  altNames: string[];
}

// create a fuse instance using pre-generated index
const fuse = new Fuse<IUatTerm>(uatTerms as IUatTerm[], {
  keys: [
    { name: 'name', weight: 0.9 },
    { name: 'altNames', weight: 0.1 },
  ],
  isCaseSensitive: false,
  includeScore: true,
  shouldSort: true,
  threshold: 0.1,
  location: 0,
});

// extract `item` from the result list
const formatResult = (result: Fuse.FuseResult<IUatTerm>[]) =>
  result.map((r, i) => {
    return {
      value: `"${r.item.name.toLowerCase()}"`,
      label: r.item.name,
      desc: r.item.altNames?.map((n) => `"${n}"`).join(', '),
      id: i,
      match: [] as string[],
    } as TypeaheadOption;
  });

const request = (req: SearchRequest, res: NextApiResponse<TypeaheadOption[] | { error: string }>) => {
  try {
    const value = req.query.term;
    const result = fuse.search(value, { limit: 100 });
    res.status(200).json(formatResult(result));
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown Server Error';
    res.status(500).json({ error });
  }
};

export default request;
