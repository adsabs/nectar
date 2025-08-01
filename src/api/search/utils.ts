import { queryFields, queryFnOperators } from '@/api/search/types';
import { logger } from '@/logger';

/**
 * Looks for fields in the query and lowercases them
 * @param query
 */
export const normalizeFields = (query: string): string => {
  try {
    const fieldReg = new RegExp(`\\b(${queryFields.join('|')}):`, 'gi');
    const operatorReg = new RegExp(`\\b(${queryFnOperators.join('|')})\\(`, 'gi');
    return query.replace(fieldReg, (match) => match.toLowerCase()).replace(operatorReg, (match) => match.toLowerCase());
  } catch (err) {
    logger.error({ err }, 'Error caught while normalizing query fields');

    // If an error occurs, return the original query
    return query;
  }
};
