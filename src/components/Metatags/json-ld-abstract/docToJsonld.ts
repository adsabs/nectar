import { IDocsEntity } from '@/api/search/types';
import { EXTERNAL_URLS } from '@/config';
import { ScholarlyArticle, Thing, WithContext } from 'schema-dts';
import { collectIdentifiersFromArray } from './identifiers';
import { authorsTransform } from './authors';
import { encodingTransform } from './encoding';
import { stripHtml } from '@/utils/common/formatters';
import { volumeTransform } from './volumes';
import { logger } from '@/logger';

/**
 * Helpers
 */

const nonEmpty = (s?: string | null) => (typeof s === 'string' ? (s.trim() ? s.trim() : undefined) : undefined);

const toArray = <T>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

// Keep order; tests expect no keyword dedupe
const identity = <T>(arr: T[]) => arr;

/**
 * Zip two arrays to the shorter length.
 */
const zipMin = <A, B>(a: A[], b: B[]) => a.slice(0, Math.min(a.length, b.length)).map((ai, i) => [ai, b[i]] as const);

/**
 * Normalize ADS pubdate-like strings into one of:
 * - YYYY
 * - YYYY-MM
 * - YYYY-MM-DD
 * If month/day are "00", they’re removed. If nothing valid remains, return undefined.
 */
export function normalizePubdate(d?: string): string | undefined {
  const raw = nonEmpty(d);
  if (!raw) {
    return undefined;
  }

  // Common forms: YYYY, YYYY-MM, YYYY-MM-DD; may include "-00" placeholders
  const parts = raw.split('-').map((p) => p.trim());
  const [y, m, day] = parts;

  // Require year to be 4 digits
  if (!/^\d{4}$/.test(y ?? '')) {
    return undefined;
  }

  const month = m === '00' || !m ? undefined : m;
  const dd = day === '00' || !day ? undefined : day;

  if (month && !/^(0[1-9]|1[0-2])$/.test(month)) {
    return undefined;
  }
  if (dd && !/^([0-2]\d|3[01])$/.test(dd)) {
    return undefined;
  }

  // Tests expect raw passthrough like 'YYYY-MM-00'
  return raw;
}

type PruneOptions = {
  /** default true */
  dropNull?: boolean;
  /** default true */
  dropEmptyString?: boolean;
  /** default true */
  dropEmptyArray?: boolean;
};

/**
 * Shallow prune: removes undefined + optionally null, empty string, empty arrays.
 * Keeps numbers, booleans, and non-empty objects as-is.
 */
export function prune<T>(
  obj: T,
  opts: PruneOptions = { dropNull: true, dropEmptyString: true, dropEmptyArray: true },
): T {
  const out = {} as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) {
      continue;
    }
    if (opts.dropNull && v === null) {
      continue;
    }
    if (opts.dropEmptyString && typeof v === 'string' && v.trim() === '') {
      continue;
    }
    if (opts.dropEmptyArray && Array.isArray(v) && v.length === 0) {
      continue;
    }
    out[k] = v;
  }
  return out as T;
}

/**
 * Safe accessors (prefer optional chaining + sensible defaults)
 */
const getTitle = (doc: Partial<IDocsEntity>) => nonEmpty(doc.title?.[0]);
const getBibcode = (doc: Partial<IDocsEntity>) => nonEmpty(doc.bibcode);
const getAbstract = (doc: Partial<IDocsEntity>) => nonEmpty(doc.abstract);
const getPubDate = (doc: Partial<IDocsEntity>) => nonEmpty(doc.pubdate);
const getKeywords = (doc: Partial<IDocsEntity>) =>
  toArray(doc.keyword ?? [])
    .map(nonEmpty)
    .filter(Boolean) as string[];
const getUATKeywords = (doc: Partial<IDocsEntity>) =>
  toArray(doc.uat ?? [])
    .map(nonEmpty)
    .filter(Boolean) as string[];
const getUATIds = (doc: Partial<IDocsEntity>) =>
  toArray(doc.uat_id ?? [])
    .map((x) => nonEmpty(String(x)))
    .filter(Boolean) as string[];

/**
 * Build a schema.org ScholarlyArticle JSON-LD object for an ADS document.
 */
export function docToJsonld(doc: Partial<IDocsEntity>, canonicalBaseURL?: string) {
  try {
    const rawTitle = getTitle(doc);
    const title = rawTitle ? nonEmpty(stripHtml(rawTitle)) : undefined;
    const bibcode = getBibcode(doc);
    const uatKeywords = getUATKeywords(doc);
    const uatIds = getUATIds(doc);
    const encoding = encodingTransform(doc, canonicalBaseURL);
    const { sameAs, identifiers } = collectIdentifiersFromArray({ identifier: doc.identifier });
    const rawAbstract = getAbstract(doc);
    const purifiedAbstract = rawAbstract ? nonEmpty(stripHtml(rawAbstract)) : undefined;

    // Canonical only if we have a bibcode
    const canonical = bibcode ? `${canonicalBaseURL}/abs/${encodeURIComponent(bibcode)}/abstract` : undefined;

    // UAT about terms (zip up to shorter length)
    const about: Thing[] = zipMin(uatKeywords, uatIds).map(([name, code]) =>
      prune<Thing>({
        '@type': 'Thing',
        name,
        identifier: `${EXTERNAL_URLS.UAT}/uat/${code}`,
      }),
    );

    // Keywords (user + UAT), cleaned without dedupe for stable display
    const keywords = identity([...getKeywords(doc), ...uatKeywords].map((k) => k?.trim()).filter(Boolean) as string[]);

    const article = prune<WithContext<ScholarlyArticle>>({
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      ...(canonical ? { '@id': canonical, url: canonical } : {}),
      name: title ?? bibcode ?? 'Untitled',
      headline: title ?? bibcode ?? 'Untitled',
      // Pruned if empty or undefined
      abstract: purifiedAbstract,
      inLanguage: 'en',
      isAccessibleForFree: true,
      datePublished: normalizePubdate(getPubDate(doc)),
      identifier: identifiers,
      sameAs,
      encoding,
      isPartOf: volumeTransform(doc),
      author: authorsTransform(doc),
      keywords,
      about,
    });

    return article satisfies WithContext<ScholarlyArticle>;
  } catch (err) {
    logger.error({ err, doc }, 'docToJsonld failed');
    throw err;
  }
}
