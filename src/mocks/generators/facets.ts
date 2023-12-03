import { FacetField } from '@api';
import faker from '@faker-js/faker';

type GenerateOptions = {
  count?: number;
  level: 1 | 2 | 3 | 4;
  id: FacetField;
};

const createVal = (level: number, id: FacetField) => {
  switch (id) {
    case 'author_facet_hier':
      return `${level + 1}/${faker.name.lastName()}, ${faker.name.firstName()}`;

    default:
      return `${level + 1}/${faker.lorem.words(1)}`;
  }
};

export const generateFacetResponse = (options: GenerateOptions) => {
  const { count = 10, level = 1, id } = options;

  const buckets: Array<{ val: string; count: number }> = [];

  for (let i = 0; i < count; i++) {
    buckets.push({
      val: createVal(level, id),
      count: faker.datatype.number({ min: 1, max: buckets?.[buckets.length - 1]?.count ?? 1000 }),
    });
  }

  return {
    numBuckets: faker.datatype.number({ min: 100, max: 10000 }),
    buckets,
  };
};
