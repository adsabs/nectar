import api from '@api';
import { APP_DEFAULTS } from '@config';
import { normalizeSolrSort, parseAPIError } from '@utils';
import { beforeEach, describe, expect, test, TestContext } from 'vitest';
import { rest } from 'msw';

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
      ['citation_count desc,classic_factor asc'],
      ['citation_count desc', 'classic_factor asc', defaultSortPostfix],
    ],
    ['garbage string', [['lksjdf;sldjfk;,sldfj,jksdlf,kd']], defaultReturn],
    [
      'garbage string w/valid sort',
      ['slkdjf,sdlkjf,lskdjf;,sdljkdskj,,,,,,,lsdkjf,score asc,dslkj'],
      ['score asc', defaultSortPostfix],
    ],
  ])('%s', async (_, args, expected) => {
    expect(normalizeSolrSort(...args)).toEqual(expected);
    return Promise.resolve();
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
