import { IAuthorAffiliationItem } from '@/api/author-affiliation/types';
import { faker } from '@faker-js/faker';
import { range, slice } from 'ramda';
import { Esources, IADSApiSearchResponse } from '@/api/search/types';
import { ApiTargets } from '@/api/models';

faker.seed(Date.now());

// fake api data generators
export const api = {
  bibcode: () => faker.string.alphanumeric(18),
  author: () => `${faker.person.lastName()}, ${faker.person.lastName()}`,
  bibstem: () => faker.string.alphanumeric(6),
  pubdate: () => {
    const date = faker.date.between({ from: '2000-01-01T00:00:00.000Z', to: '2020-01-01T00:00:00.000Z' });
    return `${date.getFullYear()}-${date.getMonth()}-00`;
  },
  title: () => faker.lorem.sentence({ min: 10, max: 40 }),
  esources: (): Esources[] => {
    const keys = Object.keys(Esources);
    const max = faker.number.int(keys.length);
    return slice(faker.number.int({ min: 0, max }), max, keys as Esources[]);
  },
  property: () => ['ARTICLE', 'ESOURCE', 'REFEREED'],
  orcidPub: () => (faker.datatype.boolean() ? `0000-0000-0000-0000` : '-'),
  aff: () =>
    `${faker.company.name()}, ${faker.location.zipCode()}, ${faker.location.city()}, ${faker.location.country()}`,
  abstract: () => faker.lorem.paragraphs(faker.number.int({ min: 1, max: 5 })),
  putcode: () => faker.number.int({ min: 100000, max: 999999 }),
};

// create random sized array of number
export const ranRange = (min: number, max: number) => {
  return range(min, faker.number.int({ min, max }));
};

export const ids_mocks = range(0, 10).map(() => faker.string.alphanumeric(8));

export const highlights_mocks: IADSApiSearchResponse['highlighting'] = {
  [ids_mocks[0]]: {
    abstract: [
      'The wit makes fun of other persons; the <em>satirist</em> makes fun of the world; the humorist makes fun of himself.',
      'Everything is funny as long as it is happening to <em>Somebody</em> Else.',
    ],
    title: ["In everyone's <em>heart</em> stirs a great homesickness."],
  },
  [ids_mocks[1]]: {},
  [ids_mocks[2]]: {
    abstract: [
      'The wit makes fun of other persons; the <em>satirist</em> makes fun of the world; the humorist makes fun of himself.',
    ],
    title: ["In everyone's <em>heart</em> stirs a great homesickness."],
  },
  [ids_mocks[3]]: {
    abstract: [
      'The wit makes fun of other persons; the <em>satirist</em> makes fun of the world; the humorist makes fun of himself.',
    ],
  },
  [ids_mocks[4]]: {
    title: ["In everyone's <em>heart</em> stirs a great homesickness."],
  },
  [ids_mocks[5]]: {},
  [ids_mocks[6]]: {},
  [ids_mocks[7]]: {},
  [ids_mocks[8]]: {},
  [ids_mocks[9]]: {},
};

export const authorAffData = (count = 1) => {
  const authorName = api.author();

  return range(0, count).map(
    () =>
      ({
        authorName,
        affiliations: {
          name: faker.helpers.arrayElement([api.aff(), '-']),
          years: [
            ...range(0, faker.number.int({ min: 0, max: 10 })).map(
              () => `${faker.date.past({ years: 20 }).getFullYear()}`,
            ),
          ],
          lastActiveDate: api.pubdate(),
        },
      } as IAuthorAffiliationItem),
  );
};

export const exportAuthorAffData = (entries: string[]) => {
  return entries.join('\n');
};

export const apiHandlerRoute = (key: ApiTargets, path?: string) => `*${key}${typeof path === 'string' ? path : '*'}`;
