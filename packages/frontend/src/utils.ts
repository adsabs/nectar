import { ParsedUrlQuery } from 'node:querystring';

export const normalizeURLParams = (
  query: ParsedUrlQuery,
): Record<string, string> => {
  return Object.keys(query).reduce((acc, key) => {
    const rawValue = query[key];
    const value =
      typeof rawValue === 'string'
        ? rawValue
        : Array.isArray(rawValue)
        ? rawValue.join(',')
        : undefined;

    if (typeof value === 'undefined') {
      return acc;
    }

    return {
      ...acc,
      [key]: value,
    };
  }, {});
};
