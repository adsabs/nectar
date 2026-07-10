import { IDocsEntity } from '@/api/search/types';

// SSR outcome for an abstract record. Absence is a 200 with zero docs; upstream
// 4xx/5xx are errors, never not-found.
export type AbsSSRResult =
  | { outcome: 'found' }
  | { outcome: 'not-found' }
  | { outcome: 'error'; statusCode: number; reason: string };

// Props every abstract sub-view page receives from the shared SSR helper.
export type AbsPageProps = {
  ssr: AbsSSRResult;
  queryId: string;
  initialDoc?: IDocsEntity | null;
  isAuthenticated?: boolean;
};

// Discriminated UI state the boundary renders from.
export type AbsRecordUIState =
  | { kind: 'content'; doc: IDocsEntity }
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; statusCode?: number };

type DeriveAbsRecordStateInput = {
  ssr: AbsSSRResult;
  doc?: IDocsEntity;
  hasClientData: boolean;
  clientDocsCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

// Never render not-found while ambiguous — default to loading. not-found is
// reserved for a confirmed empty result the client hasn't contradicted.
export const deriveAbsRecordState = (input: DeriveAbsRecordStateInput): AbsRecordUIState => {
  const { ssr, doc, hasClientData, clientDocsCount, isLoading, isFetching, isError } = input;

  if (doc) {
    return { kind: 'content', doc };
  }

  // Client is actively resolving (or re-checking a negative SSR outcome) — wait.
  if (isLoading || isFetching) {
    return { kind: 'loading' };
  }

  // Client fetch failed.
  if (isError) {
    return { kind: 'error', statusCode: ssr.outcome === 'error' ? ssr.statusCode : undefined };
  }

  // Client-confirmed empty. The client is fresher than SSR, so this wins over a
  // stale SSR error — a record confirmed absent is not-found, not unavailable.
  // Also covers SSR not-found (seeded empty cache).
  if (hasClientData && clientDocsCount === 0) {
    return { kind: 'not-found' };
  }

  // SSR error the client didn't override.
  if (ssr.outcome === 'error') {
    return { kind: 'error', statusCode: ssr.statusCode };
  }

  // SSR-confirmed empty; the seeded cache means the client will agree.
  if (ssr.outcome === 'not-found') {
    return { kind: 'not-found' };
  }

  // Ambiguous — never flash not-found.
  return { kind: 'loading' };
};
