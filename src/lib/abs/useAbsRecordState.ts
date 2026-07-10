import { useEffect, useRef } from 'react';
import { path } from 'ramda';
import * as Sentry from '@sentry/nextjs';

import { useGetAbstract } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { AbsRecordUIState, AbsSSRResult, deriveAbsRecordState } from './absRecordState';

// AbsPageProps types ssr/queryId as required, but composeNextGSSP's catch path can
// drop them (a throw before absCanonicalize's try). Accept undefined and degrade to
// error rather than crash on ssr.outcome.
type UseAbsRecordStateArgs = {
  ssr?: AbsSSRResult;
  queryId?: string;
  initialDoc?: IDocsEntity | null;
};

type UseAbsRecordStateResult = {
  doc?: IDocsEntity;
  state: AbsRecordUIState;
};

const MISSING_SSR: AbsSSRResult = { outcome: 'error', statusCode: 500, reason: 'missing-ssr-props' };

export const useAbsRecordState = ({ ssr, queryId, initialDoc }: UseAbsRecordStateArgs): UseAbsRecordStateResult => {
  const resolvedSSR = ssr ?? MISSING_SSR;
  const resolvedQueryId = queryId ?? '';
  const isNegativeSSR = resolvedSSR.outcome !== 'found';

  const { data, isLoading, isFetching, isError } = useGetAbstract(
    { id: resolvedQueryId },
    {
      enabled: resolvedQueryId.length > 0,
      // Found/not-found hydrate from the seeded cache and never refetch. Only the
      // error path fetches client-side — retry it so a transient SSR failure
      // recovers via the browser session.
      retry: isNegativeSSR ? 2 : false,
    },
  );

  const clientDoc = path<IDocsEntity>(['docs', 0], data);
  const doc = clientDoc ?? initialDoc ?? undefined;

  const state = deriveAbsRecordState({
    ssr: resolvedSSR,
    doc,
    hasClientData: data !== undefined,
    clientDocsCount: data?.docs?.length ?? 0,
    isLoading,
    isFetching,
    isError,
  });

  // SSR rendered a negative but the client resolved a real record — measures
  // residual false negatives. Keyed by queryId (not a bool) so it re-fires across
  // client-side navigation without a remount.
  const recoveredQueryId = useRef<string | null>(null);
  useEffect(() => {
    if (isNegativeSSR && clientDoc && recoveredQueryId.current !== resolvedQueryId) {
      recoveredQueryId.current = resolvedQueryId;
      Sentry.captureMessage('abs_ssr_false_negative_recovered', {
        level: 'warning',
        contexts: {
          absRecord: {
            queryId: resolvedQueryId,
            ssrOutcome: resolvedSSR.outcome,
            bibcode: clientDoc.bibcode ?? null,
          },
        },
      });
    }
  }, [isNegativeSSR, clientDoc, resolvedQueryId, resolvedSSR.outcome]);

  return { doc, state };
};
