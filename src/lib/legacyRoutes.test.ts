import { describe, expect, test } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ABS_VIEWS, resolveLegacyHashRoute } from './legacyRoutes';

describe('resolveLegacyHashRoute - abs routes', () => {
  test('defaults a bare abs route to the abstract view', () => {
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K')).toBe('/abs/2019ApJ...879...45K/abstract');
  });

  test('keeps a trailing view that falls on the end of the route', () => {
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K/metrics')).toBe('/abs/2019ApJ...879...45K/metrics');
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K/citations')).toBe('/abs/2019ApJ...879...45K/citations');
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K/toc')).toBe('/abs/2019ApJ...879...45K/toc');
  });

  test('maps the ADS figures view onto graphics', () => {
    expect(resolveLegacyHashRoute('#abs/2014A%26A...568A..53R/figures')).toBe('/abs/2014A%26A...568A..53R/graphics');
  });

  test('keeps every view nectar serves', () => {
    for (const view of ['coreads', 'credits', 'graphics', 'mentions', 'similar', 'references', 'citations', 'toc']) {
      expect(resolveLegacyHashRoute(`#abs/2019ApJ...879...45K/${view}`)).toBe(`/abs/2019ApJ...879...45K/${view}`);
    }
  });

  test('applies the bibcode rule only at exactly 19 characters', () => {
    const short = '2019ApJ...879...4';
    const long = '2019ApJ...879...45KX';
    expect(short).toHaveLength(17);
    expect(long).toHaveLength(20);

    expect(resolveLegacyHashRoute(`#abs/${short}/bogus`)).toBe(`/abs/${short}%2Fbogus/abstract`);
    expect(resolveLegacyHashRoute(`#abs/${long}/bogus`)).toBe(`/abs/${long}%2Fbogus/abstract`);
  });

  test('carries an export format through', () => {
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K/exportcitation/bibtex')).toBe(
      '/abs/2019ApJ...879...45K/exportcitation/bibtex',
    );
  });

  test('leaves a bare exportcitation route for the format redirect to resolve', () => {
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K/exportcitation')).toBe(
      '/abs/2019ApJ...879...45K/exportcitation',
    );
  });

  test('re-encodes an ampersand in a bibcode exactly once', () => {
    expect(resolveLegacyHashRoute('#abs/2019A%26A...623A..40S/abstract')).toBe('/abs/2019A%26A...623A..40S/abstract');
    expect(resolveLegacyHashRoute('#abs/2019A&A...623A..40S/abstract')).toBe('/abs/2019A%26A...623A..40S/abstract');
  });

  test('drops an unrecognized trailing segment when the identifier is a complete bibcode', () => {
    expect(resolveLegacyHashRoute('#abs/2019ApJ...879...45K/bogus')).toBe('/abs/2019ApJ...879...45K/abstract');
    expect(resolveLegacyHashRoute('#abs/2016PhRvL.116f1102A/year:2021-2026')).toBe('/abs/2016PhRvL.116f1102A/abstract');
  });

  test('keeps an unrecognized trailing segment when the identifier is not a bibcode', () => {
    expect(resolveLegacyHashRoute('#abs/10.1051/0004-6361/201833910/bogus')).toBe(
      '/abs/10.1051%2F0004-6361%2F201833910%2Fbogus/abstract',
    );
  });

  test('keeps a DOI whose raw slashes span several segments', () => {
    expect(resolveLegacyHashRoute('#abs/10.1051/0004-6361/201833910/abstract')).toBe(
      '/abs/10.1051%2F0004-6361%2F201833910/abstract',
    );
    expect(resolveLegacyHashRoute('#abs/10.1051/0004-6361/201833910')).toBe(
      '/abs/10.1051%2F0004-6361%2F201833910/abstract',
    );
    expect(resolveLegacyHashRoute('#abs/10.3847/2041-8213/aa920c/metrics')).toBe(
      '/abs/10.3847%2F2041-8213%2Faa920c/metrics',
    );
  });

  test('keeps an old-style arXiv identifier that contains a raw slash', () => {
    expect(resolveLegacyHashRoute('#abs/astro-ph/0601001/abstract')).toBe('/abs/astro-ph%2F0601001/abstract');
  });

  test('keeps an export format on a slash-bearing identifier', () => {
    expect(resolveLegacyHashRoute('#abs/10.1051/0004-6361/201833910/exportcitation/bibtex')).toBe(
      '/abs/10.1051%2F0004-6361%2F201833910/exportcitation/bibtex',
    );
  });

  test('ignores an abs route with no identifier', () => {
    expect(resolveLegacyHashRoute('#abs')).toBeNull();
    expect(resolveLegacyHashRoute('#abs/')).toBeNull();
  });
});

describe('resolveLegacyHashRoute - search routes', () => {
  test('converts the param list into a real query string', () => {
    expect(resolveLegacyHashRoute('#search/q=star&sort=date%20desc')).toBe('/search?q=star&sort=date+desc');
  });

  test('converts the zero-based p_ index into a one-based page number', () => {
    expect(resolveLegacyHashRoute('#search/q=star&p_=0')).toBe('/search?q=star&p=1');
    expect(resolveLegacyHashRoute('#search/q=star&p_=4')).toBe('/search?q=star&p=5');
  });

  test('drops an unusable p_ value rather than guessing a page', () => {
    expect(resolveLegacyHashRoute('#search/q=star&p_=notanumber')).toBe('/search?q=star');
    expect(resolveLegacyHashRoute('#search/q=star&p_=-3')).toBe('/search?q=star');
  });

  test('maps a visualization suffix that falls after the param list', () => {
    expect(resolveLegacyHashRoute('#search/q=star&sort=date%20desc&p_=0/show-metrics')).toBe(
      '/search/metrics?q=star&sort=date+desc&p=1',
    );
    expect(resolveLegacyHashRoute('#search/q=star/show-author-network')).toBe('/search/author_network?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/show-paper-network')).toBe('/search/paper_network?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/show-concept-cloud')).toBe('/search/concept_cloud?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/show-bubble-chart')).toBe('/search/results_graph?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/show-author-affiliation-tool')).toBe(
      '/search/authoraffiliations?q=star',
    );
    expect(resolveLegacyHashRoute('#search/q=star/show-citation-helper')).toBe('/search/citation_helper?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/show-overview')).toBe('/search/overview?q=star');
  });

  test('accepts a nectar-style suffix as well as the bumblebee one', () => {
    expect(resolveLegacyHashRoute('#search/q=star/metrics')).toBe('/search/metrics?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/author_network')).toBe('/search/author_network?q=star');
  });

  test('maps an export suffix onto the exportcitation route', () => {
    expect(resolveLegacyHashRoute('#search/q=star/export-bibtex')).toBe('/search/exportcitation/bibtex?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/exportcitation/aastex')).toBe('/search/exportcitation/aastex?q=star');
  });

  test('preserves filter params verbatim', () => {
    const hash = '#search/q=star&fq=%7B!type%3Daqp%20v%3D%24fq_database%7D&fq_database=(database%3A%22astronomy%22)';
    expect(resolveLegacyHashRoute(hash)).toBe(
      '/search?q=star&fq=%7B%21type%3Daqp+v%3D%24fq_database%7D&fq_database=%28database%3A%22astronomy%22%29',
    );
  });

  test('keeps slashes inside a param value when no suffix is present', () => {
    expect(resolveLegacyHashRoute('#search/q=doi:10.1093/mnras/stz1234')).toBe(
      '/search?q=doi%3A10.1093%2Fmnras%2Fstz1234',
    );
  });

  test('ignores a trailing slash after a sub-route', () => {
    expect(resolveLegacyHashRoute('#search/q=star/metrics/')).toBe('/search/metrics?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/show-metrics/')).toBe('/search/metrics?q=star');
    expect(resolveLegacyHashRoute('#search/q=star/')).toBe('/search?q=star');
  });

  test('ignores a search route with no usable query', () => {
    expect(resolveLegacyHashRoute('#search')).toBeNull();
    expect(resolveLegacyHashRoute('#search/')).toBeNull();
    expect(resolveLegacyHashRoute('#search/q=')).toBeNull();
    expect(resolveLegacyHashRoute('#search/sort=date%20desc')).toBeNull();
  });
});

describe('resolveLegacyHashRoute - user routes', () => {
  test('maps the library views', () => {
    expect(resolveLegacyHashRoute('#user/libraries')).toBe('/user/libraries');
    expect(resolveLegacyHashRoute('#user/libraries/')).toBe('/user/libraries');
    expect(resolveLegacyHashRoute('#user/libraries/aBcD1234')).toBe('/user/libraries/aBcD1234');
  });

  test('maps settings sections that exist here', () => {
    expect(resolveLegacyHashRoute('#user/settings/application')).toBe('/user/settings/application');
    expect(resolveLegacyHashRoute('#user/settings/token')).toBe('/user/settings/token');
  });

  test('maps renamed settings sections', () => {
    expect(resolveLegacyHashRoute('#user/settings/myads')).toBe('/user/notifications');
    expect(resolveLegacyHashRoute('#user/settings/libraryimport')).toBe('/user/settings/libraries');
    expect(resolveLegacyHashRoute('#user/settings/preferences')).toBe('/user/settings/application');
  });

  test('falls back to the settings index for an unknown section', () => {
    expect(resolveLegacyHashRoute('#user/settings/bogus')).toBe('/user/settings');
    expect(resolveLegacyHashRoute('#user/settings')).toBe('/user/settings');
  });

  test('maps the account routes', () => {
    expect(resolveLegacyHashRoute('#user/account/login')).toBe('/user/account/login');
    expect(resolveLegacyHashRoute('#user/account/register')).toBe('/user/account/register');
    expect(resolveLegacyHashRoute('#user/account/reset-password')).toBe('/user/account/forgotpassword');
    expect(resolveLegacyHashRoute('#user/forgotpassword')).toBe('/user/account/forgotpassword');
  });

  test('maps an emailed verification link, token and all', () => {
    const token = 'NzEzOTQ.aoj2GQ.B2xwyFb497k-aq9yd_NwWjoawp8';
    expect(resolveLegacyHashRoute(`#user/account/verify/register/${token}`)).toBe(
      `/user/account/verify/register/${token}`,
    );
    expect(resolveLegacyHashRoute(`#user/account/verify/change-email/${token}`)).toBe(
      `/user/account/verify/change-email/${token}`,
    );
    expect(resolveLegacyHashRoute(`#user/account/verify/reset-password/${token}`)).toBe(
      `/user/account/verify/reset-password/${token}`,
    );
    expect(resolveLegacyHashRoute('#user/account/verify/register')).toBeNull();
    expect(resolveLegacyHashRoute(`#user/account/verify/bogus/${token}`)).toBeNull();
  });

  test('sends the authenticated home view to the landing page', () => {
    expect(resolveLegacyHashRoute('#user/home')).toBe('/');
  });

  test('maps a public library to its page', () => {
    expect(resolveLegacyHashRoute('#public-libraries/PcKKUoh1RTGjbqSI5vF-1w')).toBe(
      '/public-libraries/PcKKUoh1RTGjbqSI5vF-1w',
    );
    expect(resolveLegacyHashRoute('#public-libraries')).toBeNull();
  });

  test('ignores unknown user routes', () => {
    expect(resolveLegacyHashRoute('#user')).toBeNull();
    expect(resolveLegacyHashRoute('#user/bogus')).toBeNull();
    expect(resolveLegacyHashRoute('#user/account')).toBeNull();
  });
});

describe('resolveLegacyHashRoute - other routes', () => {
  test('maps the standalone forms and index', () => {
    expect(resolveLegacyHashRoute('#classic-form')).toBe('/classic-form');
    expect(resolveLegacyHashRoute('#paper-form')).toBe('/paper-form');
    expect(resolveLegacyHashRoute('#index')).toBe('/');
  });

  test('tolerates a leading slash or shebang', () => {
    expect(resolveLegacyHashRoute('#/abs/2019ApJ...879...45K/metrics')).toBe('/abs/2019ApJ...879...45K/metrics');
    expect(resolveLegacyHashRoute('#!/abs/2019ApJ...879...45K/metrics')).toBe('/abs/2019ApJ...879...45K/metrics');
  });

  test('leaves in-page anchors alone', () => {
    expect(resolveLegacyHashRoute('#results')).toBeNull();
    expect(resolveLegacyHashRoute('#abstract')).toBeNull();
    expect(resolveLegacyHashRoute('#abstract-section')).toBeNull();
  });

  test('ignores an empty or unrecognized fragment', () => {
    expect(resolveLegacyHashRoute('')).toBeNull();
    expect(resolveLegacyHashRoute('#')).toBeNull();
    expect(resolveLegacyHashRoute('#execute-query/abc123')).toBeNull();
    expect(resolveLegacyHashRoute('#orcid-instructions')).toBeNull();
    expect(resolveLegacyHashRoute('#404')).toBeNull();
  });
});

describe('ABS_VIEWS', () => {
  test('matches the abs subpages that actually exist', () => {
    const dir = join(process.cwd(), 'src', 'pages', 'abs', '[id]');
    const onDisk = readdirSync(dir, { withFileTypes: true })
      .map((entry) => (entry.isDirectory() ? entry.name : entry.name.replace(/\.tsx?$/, '')))
      .sort();

    expect([...ABS_VIEWS].sort()).toEqual(onDisk);
  });
});
