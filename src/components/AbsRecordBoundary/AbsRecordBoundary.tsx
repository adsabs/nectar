import { ReactNode } from 'react';

import { AbsLayout } from '@/components/Layout/AbsLayout';
import { RecordNotFound } from '@/components/RecordNotFound';
import { ServiceUnavailable } from '@/components/ServiceUnavailable';
import { IDocsEntity } from '@/api/search/types';
import { AbsRecordUIState } from '@/lib/abs/absRecordState';
import { AbsRecordSkeleton } from './AbsRecordSkeleton';

type AbsRecordBoundaryProps = {
  state: AbsRecordUIState;
  recordId: string;
  label: string;
  titleDescription: string;
  onFeedback?: () => void;
  children: (doc: IDocsEntity) => ReactNode;
};

// One place for the loading / not-found / error / content branch across all
// abstract sub-views. Content is a render prop so markup dereferencing `doc` only
// runs once the record is present.
export const AbsRecordBoundary = ({
  state,
  recordId,
  label,
  titleDescription,
  onFeedback,
  children,
}: AbsRecordBoundaryProps) => {
  const doc = state.kind === 'content' ? state.doc : undefined;

  return (
    <AbsLayout doc={doc} titleDescription={titleDescription} label={label}>
      {state.kind === 'content' ? (
        children(state.doc)
      ) : state.kind === 'loading' ? (
        <AbsRecordSkeleton />
      ) : state.kind === 'error' ? (
        <ServiceUnavailable recordId={recordId || 'N/A'} statusCode={state.statusCode} />
      ) : (
        <RecordNotFound recordId={recordId || 'N/A'} onFeedback={onFeedback} />
      )}
    </AbsLayout>
  );
};
