import { afterEach, describe, expect, test, vi } from 'vitest';
import { SessionStorageKey } from '@/lib/session/sessionStore';
import { clearClassicFormSnapshot, readClassicFormSnapshot, saveClassicFormSnapshot } from './form-snapshot';
import { IClassicFormState } from './types';

const CLASSIC_FORM_SNAPSHOT_KEY = SessionStorageKey.ClassicFormSnapshot;

const complete: IClassicFormState = {
  limit: ['astronomy', 'earthscience'],
  author: 'Rubin, V',
  logic_author: 'or',
  object: 'M 31',
  logic_object: 'and',
  pubdate_start: '1970/01',
  pubdate_end: '1980/12',
  title: 'rotation curves',
  logic_title: 'boolean',
  abstract_keywords: 'dark matter',
  logic_abstract_keywords: 'and',
  property: ['refereed-only'],
  bibstems: 'ApJ',
  sort: ['citation_count desc'],
};

describe('classic form snapshot', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  test('round-trips every field', () => {
    saveClassicFormSnapshot(complete);

    expect(readClassicFormSnapshot()).toEqual(complete);
  });

  test('returns null when nothing was stored', () => {
    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('the most recent save wins', () => {
    saveClassicFormSnapshot({ ...complete, title: 'star' });
    saveClassicFormSnapshot({ ...complete, title: 'pulsar' });

    expect(readClassicFormSnapshot()?.title).toBe('pulsar');
  });

  test('clearing removes the snapshot', () => {
    saveClassicFormSnapshot(complete);

    clearClassicFormSnapshot();

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot that is not valid JSON', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, '{not json');

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot missing required keys', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, JSON.stringify({ title: 'star' }));

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot whose choice fields hold unknown values', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, JSON.stringify({ ...complete, logic_author: 'maybe' }));

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot whose property list holds unknown values', () => {
    sessionStorage.setItem(
      CLASSIC_FORM_SNAPSHOT_KEY,
      JSON.stringify({ ...complete, property: ['refereed-only', 'nope'] }),
    );

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot with an empty sort list', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, JSON.stringify({ ...complete, sort: [] }));

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot whose sort is not a known Solr sort', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, JSON.stringify({ ...complete, sort: ['garbage desc'] }));

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('discards a snapshot whose collection list holds unknown values', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, JSON.stringify({ ...complete, limit: ['astronomy', 'nope'] }));

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('drops a stale snapshot rather than leaving it readable when it cannot be parsed', () => {
    sessionStorage.setItem(CLASSIC_FORM_SNAPSHOT_KEY, '{not json');

    readClassicFormSnapshot();

    expect(sessionStorage.getItem(CLASSIC_FORM_SNAPSHOT_KEY)).toBeNull();
  });

  test('survives sessionStorage throwing on write', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied');
    });

    expect(() => saveClassicFormSnapshot(complete)).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });

  test('survives sessionStorage throwing on read', () => {
    saveClassicFormSnapshot(complete);
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied');
    });

    expect(readClassicFormSnapshot()).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});
