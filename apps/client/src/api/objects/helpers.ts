import { splitQuery } from '@/query';

export const replaceObjectTerms = (query: string) => {
  const replaceObjectWithAbs = (term: string) => term.replace('object:', 'abs:');
  const terms = splitQuery(query, { stripField: false, transform: replaceObjectWithAbs });
  return terms.join(' ');
};

export const hasObjectTerm = (query: string) => query.includes('object:');
