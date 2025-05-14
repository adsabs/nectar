import { NextApiRequest, NextApiResponse } from 'next';
import uatTerms from 'public/data/uat/UAT_list.json';
import Fuse from 'fuse.js';
import { IUATTerm, IUATTermsSearchReponse } from '@/api/uat/types';

export interface SearchRequest extends NextApiRequest {
  query: {
    term: string;
    exact?: 'true' | 'false';
  };
}

// create a fuse instance using pre-generated index
const fuse = new Fuse<IUATTerm>(uatTerms as IUATTerm[], {
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

const fuseExact = new Fuse<IUATTerm>(uatTerms as IUATTerm[], {
  keys: ['name'],
  threshold: 0,
  useExtendedSearch: true,
});

const formatResult = (result: Fuse.FuseResult<IUATTerm>[]) =>
  result.map((r) => {
    return r.item as IUATTerm;
  });

const request = (req: SearchRequest, res: NextApiResponse<IUATTermsSearchReponse>) => {
  try {
    const value = req.query.term;
    const exact = req.query.exact && req.query.exact === 'true' ? true : false;
    if (exact) {
      const result = fuseExact.search(`="${value}"`);
      res.status(200).json({ uatTerms: formatResult(result) });
    } else {
      const result = fuse.search(value, { limit: 100 });
      res.status(200).json({ uatTerms: formatResult(result) });
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown Server Error';
    res.status(500).json({ uatTerms: [], error });
  }
};

export default request;
