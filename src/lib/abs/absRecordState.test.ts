import { describe, expect, test } from 'vitest';

import { AbsSSRResult, deriveAbsRecordState } from './absRecordState';
import { IDocsEntity } from '@/api/search/types';

const doc = { bibcode: '2024ApJ...1..1X' } as IDocsEntity;

const base = {
  doc: undefined as IDocsEntity | undefined,
  hasClientData: false,
  clientDocsCount: 0,
  isLoading: false,
  isFetching: false,
  isError: false,
};

describe('deriveAbsRecordState', () => {
  const found: AbsSSRResult = { outcome: 'found' };
  const notFound: AbsSSRResult = { outcome: 'not-found' };
  const errored: AbsSSRResult = { outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' };

  test('renders content whenever a doc is present, regardless of SSR outcome', () => {
    expect(deriveAbsRecordState({ ...base, ssr: errored, doc })).toEqual({ kind: 'content', doc });
  });

  test('shows loading while the client query is loading and no doc yet', () => {
    expect(deriveAbsRecordState({ ...base, ssr: found, isLoading: true })).toEqual({ kind: 'loading' });
  });

  test('shows loading while the client is re-fetching a negative SSR outcome', () => {
    expect(deriveAbsRecordState({ ...base, ssr: errored, isFetching: true })).toEqual({ kind: 'loading' });
  });

  test('shows error when the client query errors, carrying the SSR status code', () => {
    expect(deriveAbsRecordState({ ...base, ssr: errored, isError: true })).toEqual({
      kind: 'error',
      statusCode: 503,
    });
  });

  test('shows error for an SSR error even before the client resolves', () => {
    expect(deriveAbsRecordState({ ...base, ssr: errored })).toEqual({ kind: 'error', statusCode: 503 });
  });

  test('client-confirmed empty overrides a stale SSR error (fresher client wins)', () => {
    expect(deriveAbsRecordState({ ...base, ssr: errored, hasClientData: true, clientDocsCount: 0 })).toEqual({
      kind: 'not-found',
    });
  });

  test('a client fetch error still shows error even when SSR errored', () => {
    expect(deriveAbsRecordState({ ...base, ssr: errored, isError: true })).toEqual({ kind: 'error', statusCode: 503 });
  });

  test('reserves not-found for a client-confirmed empty result', () => {
    expect(deriveAbsRecordState({ ...base, ssr: notFound, hasClientData: true, clientDocsCount: 0 })).toEqual({
      kind: 'not-found',
    });
  });

  test('treats an SSR not-found as not-found even before the client hydrates', () => {
    expect(deriveAbsRecordState({ ...base, ssr: notFound })).toEqual({ kind: 'not-found' });
  });

  test('never flashes not-found for an ambiguous found outcome with no client data yet', () => {
    expect(deriveAbsRecordState({ ...base, ssr: found })).toEqual({ kind: 'loading' });
  });
});
