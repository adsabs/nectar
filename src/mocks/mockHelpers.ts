import { Esources, IADSApiSearchResponse } from '@api';
import { faker } from '@faker-js/faker';
import { range, slice } from 'ramda';

faker.seed(Date.now());

// fake api data generators
export const api = {
  bibcode: () => faker.random.alphaNumeric(18),
  author: () => `${faker.name.lastName()}, ${faker.name.lastName()}`,
  bibstem: () => faker.random.alphaNumeric(6),
  pubdate: () => {
    const date = faker.date.between('2000', '2020');
    return `${date.getFullYear()}-${date.getMonth()}-00`;
  },
  title: () => faker.lorem.sentence(10, 40),
  esources: (): Esources[] => {
    const keys = Object.keys(Esources);
    const max = faker.datatype.number(keys.length);
    return slice(faker.datatype.number({ min: 0, max }), max, keys as Esources[]);
  },
  property: () => ['ARTICLE', 'ESOURCE', 'REFEREED'],
  orcidPub: () => (faker.datatype.boolean() ? `0000-0000-0000-0000` : '-'),
  aff: () =>
    `${faker.company.companyName()}, ${faker.address.zipCode()}, ${faker.address.city()}, ${faker.address.country()}`,
  abstract: () => faker.lorem.paragraphs(faker.datatype.number({ min: 1, max: 5 })),
};

// create random sized array of number
export const ranRange = (min: number, max: number) => {
  return range(min, faker.datatype.number({ min, max }));
};

export const ids_mocks = range(0, 10).map(() => faker.random.alphaNumeric(8));

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
