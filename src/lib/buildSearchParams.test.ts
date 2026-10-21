import { describe, expect, test } from 'vitest';
import { omit } from 'ramda';

import { APP_DEFAULTS } from '@/config';
import { AppMode } from '@/types';
import { defaultParams } from '@/api/search/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { ADS_COMPAT_URL_PARAM } from '@/utils/common/searchMode';
import { buildSearchParams } from '@/lib/buildSearchParams';

const base = {
  mode: AppMode.GENERAL,
  numPerPage: 10 as const,
};

describe('buildSearchParams', () => {
  // defaultParams.q and APP_DEFAULTS.EMPTY_QUERY are both '*:*', so a reversed
  // spread would collapse every real query to '*:*' while the empty-query
  // fallback test below still passed. Assert the URL value by name.
  test('preserves the q param from the URL', () => {
    const { params, searchParams } = buildSearchParams({ ...base, url: '/search?q=black+holes' });

    expect(params.q).toBe('black holes');
    expect(searchParams.q).toBe('black holes');
  });

  test('applies the preferred sort when the URL carries no sort param', () => {
    const { params } = buildSearchParams({ ...base, url: '/search?q=star' });

    // 'score' is APP_DEFAULTS.PREFERRED_SEARCH_SORT, whose default direction is
    // desc; normalizeSolrSort appends the QUERY_SORT_POSTFIX tie-breaker.
    expect(params.sort).toEqual(['score desc', 'date desc']);
  });

  test('honors an explicit URL sort param over the preferred sort', () => {
    const { params } = buildSearchParams({
      ...base,
      url: '/search?q=star&sort=citation_count+desc',
      preferredSearchSort: 'read_count',
    });

    expect(params.sort).toEqual(['citation_count desc', 'date desc']);
  });

  test('applies a non-default preferredSearchSort with its default direction', () => {
    const { params } = buildSearchParams({ ...base, url: '/search?q=star', preferredSearchSort: 'first_author' });

    expect(params.sort).toEqual(['first_author asc', 'date desc']);
  });

  test('derives boostType from the app mode', () => {
    expect(buildSearchParams({ ...base, url: '/search?q=star' }).params.boostType).toBe('general');
    expect(buildSearchParams({ ...base, url: '/search?q=star', mode: AppMode.ASTROPHYSICS }).params.boostType).toBe(
      'astrophysics',
    );
    expect(buildSearchParams({ ...base, url: '/search?q=star', mode: AppMode.PLANET_SCIENCE }).params.boostType).toBe(
      'planetary',
    );
  });

  test('uses numPerPage for rows and derives start from the page param', () => {
    const { params } = buildSearchParams({ ...base, url: '/search?q=star&p=3', numPerPage: 25 });

    expect(params.rows).toBe(25);
    expect(params.start).toBe(50);
    expect(params.p).toBe(3);
  });

  test('clamps start against numFound when it is known', () => {
    const { params } = buildSearchParams({ ...base, url: '/search?q=star&p=9', numPerPage: 10, numFound: 42 });

    // page 9 is past the end of 42 results, so the last page starts at 40
    expect(params.start).toBe(40);
  });

  test('starts at 0 on the first page', () => {
    const { params } = buildSearchParams({ ...base, url: '/search?q=star' });

    expect(params.start).toBe(0);
  });

  test('strips p, ads_compat and d from searchParams while keeping them on params', () => {
    const url = `/search?q=star&p=2&${ADS_COMPAT_URL_PARAM}=1&d=astrophysics`;
    const { params, searchParams } = buildSearchParams({ ...base, url });

    expect(params).toHaveProperty('p', 2);
    expect(params).toHaveProperty(ADS_COMPAT_URL_PARAM, '1');
    expect(params).toHaveProperty('d', 'astrophysics');

    expect(searchParams).not.toHaveProperty('p');
    expect(searchParams).not.toHaveProperty(ADS_COMPAT_URL_PARAM);
    expect(searchParams).not.toHaveProperty('d');

    expect(searchParams).toEqual(omit(['p', ADS_COMPAT_URL_PARAM, 'd'], params) as IADSApiSearchParams);
  });

  test('carries the default fl list and preserves URL filters', () => {
    const { searchParams } = buildSearchParams({
      ...base,
      url: '/search?q=star&fq=%7B!type%3Daqp%20v%3D%24fq_database%7D&fq_database=(database%3A%22astronomy%22)',
    });

    expect(searchParams.fl).toEqual(defaultParams.fl);
    expect(searchParams.fq_database).toBe('(database:"astronomy")');
  });

  test('falls back to the empty query when the URL has no q', () => {
    const { params } = buildSearchParams({ ...base, url: '/search' });

    expect(params.q).toBe(APP_DEFAULTS.EMPTY_QUERY);
  });
});
