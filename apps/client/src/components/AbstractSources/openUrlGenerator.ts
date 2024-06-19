import { is } from 'ramda';
import { IGetOpenUrlOptions } from '@/components/AbstractSources/types';

/**
 * check if value is string
 * @param {any} val value to test
 * @returns {boolean}
 */
const isString = (val: unknown): val is string => is(String, val);

/**
 * Check if value is an array
 * @param {any} val value to test
 * @returns {boolean}
 */
const isArray = (val: unknown): val is unknown[] => is(Array, val);

/**
 * ADS specific fields
 */
const STATIC_FIELDS = {
  url_ver: 'Z39.88-2004',
  rft_val_fmt: 'info:ofi/fmt:kev:mtx:',
  rfr_id: 'info:sid/ADS',
  sid: 'ADS',
};

/**
 * Generates an OpenUrl using metadata and a linkServer
 * @param {object} options
 * @param {IDocsEntity} options.metadata field data from database
 * @param {string} options.linkServer base url to use for generating link
 * @returns {string} the openUrl url
 */
export const getOpenUrl = (options: IGetOpenUrlOptions): string => {
  const { metadata, linkServer = '' } = options || {};

  const { page, doi, doctype, bibcode, author, issue, volume, pub, year, title, issn, isbn } = metadata || {};

  // parse out degree based on bibcode
  const degree =
    isString(bibcode) && (bibcode.includes('PhDT') ? 'PhD' : bibcode.includes('MsT') ? 'Masters' : undefined);

  // genre is "dissertation" for phd thesis, otherwise use doctype/article
  const genre =
    isString(doctype) && isString(bibcode) && bibcode.includes('PhDT')
      ? 'dissertation'
      : isString(doctype)
      ? doctype
      : 'article';

  // parse various fields to create a context object
  const parsed: Record<string, string | string[]> = {
    ...STATIC_FIELDS,
    'rft.spage': isArray(page) ? page[0].split('-')[0] : undefined,
    id: isArray(doi) ? 'doi:' + doi[0] : undefined,
    genre: genre,
    rft_id: [
      isArray(doi) ? 'info:doi/' + doi[0] : undefined,
      isString(bibcode) ? 'info:bibcode/' + bibcode : undefined,
    ],
    'rft.degree': degree,
    'rft.aufirst': isArray(author) ? author[0].split(', ')[0] : undefined,
    'rft.aulast': isArray(author) ? author[0].split(', ')[1] : undefined,
    'rft.issue': isString(issue) ? issue : undefined,
    'rft.volume': isString(volume) ? volume : undefined,
    'rft.jtitle': isString(pub) ? pub : undefined,
    'rft.date': isString(year) ? year : undefined,
    'rft.atitle': isArray(title) ? title[0] : undefined,
    'rft.issn': isArray(issn) ? issn[0] : undefined,
    'rft.isbn': isArray(isbn) ? isbn[0] : undefined,
    'rft.genre': genre,
    rft_val_fmt: STATIC_FIELDS.rft_val_fmt + (isString(doctype) ? doctype : 'article'),
  };

  interface IContext extends Partial<typeof parsed> {
    spage: typeof parsed['rft.spage'];
    volume: typeof parsed['rft.volume'];
    title: typeof parsed['rft.jtitle'];
    atitle: typeof parsed['rft.atitle'];
    aulast: typeof parsed['rft.aulast'];
    aufirst: typeof parsed['rft.aufirst'];
    date: typeof parsed['rft.date'];
    isbn: typeof parsed['rft.isbn'];
    issn: typeof parsed['rft.issn'];
  }

  // add extra fields to context object
  const context: IContext = {
    ...parsed,
    spage: parsed['rft.spage'],
    volume: parsed['rft.volume'],
    title: parsed['rft.jtitle'],
    atitle: parsed['rft.atitle'],
    aulast: parsed['rft.aulast'],
    aufirst: parsed['rft.aufirst'],
    date: parsed['rft.date'],
    isbn: parsed['rft.isbn'],
    issn: parsed['rft.issn'],
  };

  // if the linkServer has query string, just append to the end
  const openUrl = linkServer.includes('?') ? linkServer + '&' : linkServer + '?';

  // generate array of query params from the context object
  const fields = Object.keys(context)
    .filter((k) => typeof context[k] !== 'undefined')
    .map((k: keyof IContext) => {
      const val = context[k];
      if (isArray(val)) {
        return val
          .filter((v) => v)
          .map((v) => `${k}=${v}`)
          .join('&');
      }
      return `${k}=${val}`;
    });

  return encodeURI(openUrl + fields.join('&'));
};
