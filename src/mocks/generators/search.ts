import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';

type GenerateOptions = {
  params?: Partial<IADSApiSearchParams>;
  numFound?: number;
  innerResponse?: { docs?: IDocsEntity[] };
  facets?: IADSApiSearchResponse['facets'];
  stats?: IADSApiSearchResponse['stats'];
  facet_counts?: IADSApiSearchResponse['facet_counts'];
  highlighting?: IADSApiSearchResponse['highlighting'];
};

export const generateSearchResponse = (options: GenerateOptions): IADSApiSearchResponse => {
  const { params = {}, numFound = 0, innerResponse, ...rest } = options;

  return {
    responseHeader: {
      status: 0,
      QTime: 0,
      params: { q: '', ...params },
    },
    response: {
      numFound,
      docs: innerResponse?.docs ?? [],
    },
    ...rest,
  };
};
