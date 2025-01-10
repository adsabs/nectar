import faker from '@faker-js/faker';
import { descend, prop, sortWith } from 'ramda';
import allFacetsResponse from '@/mocks/responses/facets/all-facets.json';
import { FacetField } from '@/api/search/types';

type GenerateOptions = {
  count?: number;
  prefix: string;
  id: FacetField;
};

const createVal = (prefix: string, id: FacetField) => {
  switch (id) {
    case 'author_facet_hier':
      return `${prefix}${faker.name.lastName()}, ${faker.name.firstName()}`;
    case 'aff_facet_hier':
      return `${prefix}${faker.company.companyName()}`;
    case 'doctype_facet_hier':
    case 'simbad_object_facet_hier':
    case 'ned_object_facet_hier':
    case 'planetary_feature_facet_hier_3level':
      return `${prefix}${faker.lorem.words(2)}`;
    case 'uat_facet_hier':
      return `${prefix}${faker.lorem.words(2)}`;

    default:
      return `${faker.lorem.words(3)}`;
  }
};

export const generateFacetResponse = (options: GenerateOptions) => {
  const { count = 10, prefix = '0/', id } = options;

  const buckets: Array<{ val: string; count: number }> = [];

  if (id === 'property') {
    buckets.push(...allFacetsResponse.facets['property'].buckets);
  } else {
    for (let i = 0; i < count; i++) {
      buckets.push({
        val: createVal(prefix, id),
        count: faker.datatype.number({ min: 1, max: buckets?.[buckets.length - 1]?.count ?? 1000 }),
      });
    }
  }

  return {
    numBuckets: faker.datatype.number({ min: 100, max: 10000 }),
    buckets: sortWith([descend(prop('count'))], buckets),
  };
};
