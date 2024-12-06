import api from '@/api/api';
import { APP_DEFAULTS } from '@/config';
import { beforeEach, describe, expect, test, TestContext } from 'vitest';
import { rest } from 'msw';

import { truncateDecimal } from '@/utils/common/formatters';
import { normalizeSolrSort, normalizeURLParams, parseQueryFromUrl } from '@/utils/common/search';
import { coalesceAuthorsFromDoc } from '@/utils/common/coalesceAuthorsFromDoc';
import { parsePublicationDate } from '@/utils/common/parsePublicationDate';
import { parseAPIError } from '@/utils/common/parseAPIError';

const defaultSortPostfix = APP_DEFAULTS.QUERY_SORT_POSTFIX;

describe('normalizeSolrSort', () => {
  const defaultReturn: ReturnType<typeof normalizeSolrSort> = ['score desc', defaultSortPostfix];
  test.concurrent.each<[string, Parameters<typeof normalizeSolrSort>, ReturnType<typeof normalizeSolrSort>]>([
    ['simple case', [['score asc']], ['score asc', defaultSortPostfix]],
    ['garbage with postfix specified', ['lsdjkf', 'citation_count asc'], ['score desc', 'citation_count asc']],
    ['duplicate sort w/ garbage', [['score asc', 'sdljkf', 'score asc']], ['score asc', defaultSortPostfix]],
    [
      'simple sort with postfix specified',
      ['citation_count desc', 'author_count asc'],
      ['citation_count desc', 'author_count asc'],
    ],
    ['duplicated default postfix', [defaultSortPostfix], [defaultSortPostfix]],
    [
      'garbage with single valid sort',
      [['lsdjkf', 'citation_count asc', 'sldjkf', 'eejej', NaN, 29393, 'garbage']],
      ['citation_count asc', defaultSortPostfix],
    ],
    ['null input', [null], defaultReturn],
    ['empty array', [[]], defaultReturn],
    [
      'valid string',
      ['citation_count desc,read_count asc'],
      ['citation_count desc', 'read_count asc', defaultSortPostfix],
    ],
    ['garbage string', [['lksjdf;sldjfk;,sldfj,jksdlf,kd']], defaultReturn],
    [
      'garbage string w/valid sort',
      ['slkdjf,sdlkjf,lskdjf;,sdljkdskj,,,,,,,lsdkjf,score asc,dslkj'],
      ['score asc', defaultSortPostfix],
    ],
  ])('%s', (_, args, expected) => {
    expect(normalizeSolrSort(...args)).toEqual(expected);
  });
});

describe('parseAPIError', () => {
  const defaultMessage = 'Unknown Server Error';
  const testReq = () => api.request({ method: 'GET', url: '/test' });

  beforeEach(() => api.reset());
  test('works', async ({ server }: TestContext) => {
    server.use(
      rest.get('*test', (_req, res, ctx) => res.once(ctx.status(400), ctx.json({ message: 'Message' }))),
      rest.get('*test', (_req, res, ctx) => res.once(ctx.status(400), ctx.json({ error: 'Error' }))),
      rest.get('*test', (_req, res, ctx) => res(ctx.status(500), ctx.json({}))),
    );

    // response/data/message
    try {
      await testReq();
    } catch (e) {
      expect(parseAPIError(e)).toEqual('Message');
    }
    // response/data/error
    try {
      await testReq();
    } catch (e) {
      expect(parseAPIError(e)).toEqual('Error');
    }
    // response/statusText
    try {
      await testReq();
    } catch (e) {
      expect(parseAPIError(e)).toEqual('Internal Server Error');
    }
    // message
    try {
      throw new Error('foo');
    } catch (e) {
      expect(parseAPIError(e)).toEqual('foo');
    }
  });

  // check I/O to make sure default response is given
  test.concurrent.each<[Parameters<typeof parseAPIError>, ReturnType<typeof parseAPIError>]>([
    [['test'], 'test'],
    [['test', { defaultMessage: 'TestError' }], 'test'],
    [[new Error()], defaultMessage],
    [[new Error('test')], 'test'],
    [[undefined], defaultMessage],
  ])('parseAPIError(%s) -> "%s"', (args, expected) => expect(parseAPIError(...args)).toEqual(expected));
});

describe('parseQueryFromUrl', () => {
  const baseUrl = 'https://example.com/search';

  test.concurrent.each<[string, Parameters<typeof parseQueryFromUrl>, ReturnType<typeof parseQueryFromUrl>]>([
    [
      'Simple case with no query params',
      [baseUrl, {}],
      {
        n: 10,
        q: APP_DEFAULTS.EMPTY_QUERY,
        sort: ['score desc', 'date desc'],
        p: 1,
      },
    ],
    [
      'Case with query params',
      [`${baseUrl}?q=test&sort=score asc&fq=author:John`, {}],
      {
        n: 10,
        q: 'test',
        sort: ['score asc', 'date desc'],
        p: 1,
        fq: ['author:John'],
      },
    ],
    [
      'Case with multiple filter queries',
      [`${baseUrl}?q=test&fq=author:John&fq=year:2021`, {}],
      {
        n: 10,
        q: 'test',
        sort: ['score desc', 'date desc'],
        p: 1,
        fq: ['author:John', 'year:2021'],
      },
    ],
    [
      'Case with pagination',
      [`${baseUrl}?q=test&p=3`, {}],
      {
        n: 10,
        q: 'test',
        sort: ['score desc', 'date desc'],
        p: 3,
      },
    ],
    [
      'Case with invalid pagination',
      [`${baseUrl}?q=test&p=invalid`, {}],
      {
        n: 10,
        q: 'test',
        sort: ['score desc', 'date desc'],
        p: 1,
      },
    ],
    [
      'Case with sort postfix',
      [`${baseUrl}?q=test&sort=citation_count desc`, { sortPostfix: 'author_count asc' }],
      {
        n: 10,
        q: 'test',
        sort: ['citation_count desc', 'author_count asc'],
        p: 1,
      },
    ],
    [
      'Case with long set of query params, including all FQs',
      [
        `${baseUrl}?n=100&q=star&sort=score+desc%2Cdate+desc&p=1&fq_property=(property%3A"refereed")&fq_data=(data_facet%3A"NED")&fq_bibstem=(bibstem_facet%3A"A\\%26A"+AND+bibstem_facet%3A"AJ"+AND+bibstem_facet%3A"ApJL"+AND+bibstem_facet%3A"Ap\\%26SS"+AND+bibstem_facet%3A"PASP")&fq_database=(database%3A"earthscience")&fq_author=(author_facet_hier%3A"0\\%2FWang%2C+J"+AND+author_facet_hier%3A"0\\%2FWang%2C+Y"+AND+author_facet_hier%3A"0\\%2FHenning%2C+T"+AND+author_facet_hier%3A"0\\%2FZhang%2C+Y"+AND+author_facet_hier%3A"0\\%2FChen%2C+Y")&fq_aff=(aff_facet_hier%3A"0\\%2FMax+Planck")&fq_bibgroup=(bibgroup_facet%3A"ESO\\%2FTelescopes")&fq_simbad=(simbad_object_facet_hier%3A"0\\%2FStar")&fq_ned=(ned_object_facet_hier%3A"0\\%2FGalaxy")&fq_vizier=(vizier_facet%3A"Optical")&fq_doctype=(doctype_facet_hier%3A"0\\%2FArticle")&fq={!type%3Daqp+v%3D%24fq_property}%2C{!type%3Daqp+v%3D%24fq_data}%2C{!type%3Daqp+v%3D%24fq_bibstem}%2C{!type%3Daqp+v%3D%24fq_database}%2C{!type%3Daqp+v%3D%24fq_author}%2C{!type%3Daqp+v%3D%24fq_aff}%2C{!type%3Daqp+v%3D%24fq_bibgroup}%2C{!type%3Daqp+v%3D%24fq_simbad}%2C{!type%3Daqp+v%3D%24fq_ned}%2C{!type%3Daqp+v%3D%24fq_vizier}%2C{!type%3Daqp+v%3D%24fq_doctype}%2C{!type%3Daqp+v%3D%24fq_planetary_feature}&fq_planetary_feature=(planetary_feature_facet_hier_3level%3A"0\\%2FMars")`,
        {},
      ],
      {
        n: 100,
        fq: [
          '{!type=aqp v=$fq_property}',
          '{!type=aqp v=$fq_data}',
          '{!type=aqp v=$fq_bibstem}',
          '{!type=aqp v=$fq_database}',
          '{!type=aqp v=$fq_author}',
          '{!type=aqp v=$fq_aff}',
          '{!type=aqp v=$fq_bibgroup}',
          '{!type=aqp v=$fq_simbad}',
          '{!type=aqp v=$fq_ned}',
          '{!type=aqp v=$fq_vizier}',
          '{!type=aqp v=$fq_doctype}',
          '{!type=aqp v=$fq_planetary_feature}',
        ],
        fq_bibstem:
          '(bibstem_facet:"A\\&A" AND bibstem_facet:"AJ" AND bibstem_facet:"ApJL" AND' +
          ' bibstem_facet:"Ap\\&SS" AND bibstem_facet:"PASP")',
        fq_data: '(data_facet:"NED")',
        fq_database: '(database:"earthscience")',
        fq_property: '(property:"refereed")',
        fq_aff: '(aff_facet_hier:"0\\/Max Planck")',
        fq_author:
          '(author_facet_hier:"0\\/Wang, J" AND author_facet_hier:"0\\/Wang, Y" AND' +
          ' author_facet_hier:"0\\/Henning, T" AND author_facet_hier:"0\\/Zhang, Y" AND author_facet_hier:"0\\/Chen,' +
          ' Y")',
        fq_bibgroup: '(bibgroup_facet:"ESO\\/Telescopes")',
        fq_simbad: '(simbad_object_facet_hier:"0\\/Star")',
        fq_ned: '(ned_object_facet_hier:"0\\/Galaxy")',
        fq_vizier: '(vizier_facet:"Optical")',
        fq_doctype: '(doctype_facet_hier:"0\\/Article")',
        fq_planetary_feature: '(planetary_feature_facet_hier_3level:"0\\/Mars")',
        q: 'star',
        sort: ['score desc', 'date desc'],
        p: 1,
      },
    ],
    [
      'NumPerPage param is parsed correctly',
      [`${baseUrl}?n=10000`, {}],
      {
        n: 100,
        q: '*:*',
        sort: ['score desc', 'date desc'],
        p: 1,
      },
    ],
    [
      'Case with smart quotes',
      [`${baseUrl}?q=object:“test”`, {}],
      {
        n: 10,
        q: 'object:"test"',
        sort: ['score desc', 'date desc'],
        p: 1,
      },
    ],
  ])('%s', (_, args, expected) => {
    const result = parseQueryFromUrl(...args);
    expect(result).toEqual(expected);
  });
});

describe('coalesceAuthorsFromDoc', () => {
  const baseDoc = {
    author: ['Zhang, Dali', 'Li, Xingjiao'],
    aff: ['INFN, Sezione di Pisa, I-56127 Pisa, Italy', ''],
    orcid_other: ['0000-0003-4311-5804', ''],
    orcid_pub: ['0000-0003-4311-5804', ''],
    orcid_user: ['0000-0003-4311-5804', ''],
  };

  const cases: [string, Parameters<typeof coalesceAuthorsFromDoc>, ReturnType<typeof coalesceAuthorsFromDoc>][] = [
    [
      'Case with includeAff true',
      [baseDoc, true],
      [
        [
          '1',
          'Zhang, Dali',
          'INFN, Sezione di Pisa, I-56127 Pisa, Italy',
          '0000-0003-4311-5804',
          '0000-0003-4311-5804',
          '0000-0003-4311-5804',
        ],
        ['2', 'Li, Xingjiao', '', '', '', ''],
      ],
    ],
    [
      'Case with includeAff false',
      [baseDoc, false],
      [
        ['1', 'Zhang, Dali', '0000-0003-4311-5804', '0000-0003-4311-5804', '0000-0003-4311-5804'],
        ['2', 'Li, Xingjiao', '', '', ''],
      ],
    ],
    ['Case with empty doc', [{}, false], []],
    [
      'Case with missing ORCID values',
      [
        {
          author: ['Zhang, Dali', 'Li, Xingjiao'],
          aff: ['INFN, Sezione di Pisa, I-56127 Pisa, Italy', ''],
          orcid_other: ['', ''],
          orcid_pub: ['', ''],
          orcid_user: ['', ''],
        },
        true,
      ],
      [
        ['1', 'Zhang, Dali', 'INFN, Sezione di Pisa, I-56127 Pisa, Italy', '', '', ''],
        ['2', 'Li, Xingjiao', '', '', '', ''],
      ],
    ],
    [
      'Case with single author',
      [
        {
          author: ['Zhang, Dali'],
          aff: ['INFN, Sezione di Pisa, I-56127 Pisa, Italy'],
          orcid_other: ['0000-0003-4311-5804'],
          orcid_pub: ['0000-0003-4311-5804'],
          orcid_user: ['0000-0003-4311-5804'],
        },
        true,
      ],
      [
        [
          '1',
          'Zhang, Dali',
          'INFN, Sezione di Pisa, I-56127 Pisa, Italy',
          '0000-0003-4311-5804',
          '0000-0003-4311-5804',
          '0000-0003-4311-5804',
        ],
      ],
    ],
  ];

  test.concurrent.each(cases)('%s', (_, args, expected) => {
    const result = coalesceAuthorsFromDoc(...args);
    expect(result).toEqual(expected);
  });
});

describe('normalizeURLParams', () => {
  const cases: [string, Parameters<typeof normalizeURLParams>, ReturnType<typeof normalizeURLParams>][] = [
    [
      'Simple case with single string value',
      [{ param1: 'value1', param2: 'value2' }, []],
      { param1: 'value1', param2: 'value2' },
    ],
    [
      'Case with array values',
      [{ param1: ['value1', 'value2'], param2: 'value3' }, []],
      { param1: 'value1,value2', param2: 'value3' },
    ],
    [
      'Case with mixed string and array values',
      [{ param1: 'value1', param2: ['value2', 'value3'] }, []],
      { param1: 'value1', param2: 'value2,value3' },
    ],
    ['Case with skipKeys parameter', [{ param1: 'value1', param2: 'value2' }, ['param1']], { param2: 'value2' }],
    ['Case with undefined values', [{ param1: undefined, param2: 'value2' }, []], { param2: 'value2' }],
    ['Case with undefined and skipKeys', [{ param1: 'value1', param2: undefined }, ['param1']], {}],
    ['Case with empty object', [{}, []], {}],
    ['Case with only skipKeys', [{ param1: 'value1', param2: 'value2' }, ['param1', 'param2']], {}],
  ];

  test.concurrent.each(cases)('%s', (_, args, expected) => {
    const result = normalizeURLParams(...args);
    expect(result).toEqual(expected);
  });
});

describe('parsePublicationDate', () => {
  const cases: [string, Parameters<typeof parsePublicationDate>, ReturnType<typeof parsePublicationDate>][] = [
    ['valid full date', ['2024-05-31'], { year: '2024', month: '05', day: '31' }],
    ['valid year and month', ['2024-05'], { year: '2024', month: '05', day: '00' }],
    ['valid year only', ['2024'], { year: '2024', month: '00', day: '00' }],
    ['invalid date format', ['2024/05/31'], { year: '2024', month: '00', day: '00' }],
    ['empty date', [''], null],
    ['null date', [null], null],
    ['undefined date', [undefined], null],
    ['non-date string', ['not-a-date'], { year: 'not-', month: '00', day: '00' }],
  ];

  test.concurrent.each(cases)('%s', (_, args, expected) => {
    const result = parsePublicationDate(...args);
    expect(result).toEqual(expected);
  });
});

describe('truncateDecimal', () => {
  const cases: [string, Parameters<typeof truncateDecimal>, ReturnType<typeof truncateDecimal>][] = [
    ['truncate to 0 decimal places', [123.456, 0], 123],
    ['truncate to 1 decimal place', [123.456, 1], 123.4],
    ['truncate to 2 decimal places', [123.456, 2], 123.45],
    ['truncate to 3 decimal places', [123.456, 3], 123.456],
    ['truncate a whole number', [123, 2], 123],
    ['truncate a negative number', [-123.456, 2], -123.45],
    ['truncate with no decimals', [0.123456, 0], 0],
    ['truncate with large number of decimal places', [1.123456789, 8], 1.12345678],
    ['truncate a number with fewer decimals than specified', [123.4, 5], 123.4],
  ];

  test.concurrent.each(cases)('%s', (_, args, expected) => {
    const result = truncateDecimal(...args);
    expect(result).toBe(expected);
  });
});
