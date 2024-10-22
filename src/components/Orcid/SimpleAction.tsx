import { useOrcid } from '@/lib/orcid/useOrcid';
import { useWork } from '@/lib/orcid/useWork';

import { ReactElement } from 'react';
import { isOrcidProfileEntry } from '@/api/orcid/models';
import { AddToOrcidButton } from '@/components/Orcid/AddToOrcidButton';
import { DeleteFromOrcidButton } from '@/components/Orcid/DeleteFromOrcidButton';
import { reconcileDocIdentifier } from '@/components/Orcid/helpers';
import { IDocsEntity } from '@/api/search/types';

// if status is null,
export const SimpleAction = (props: { doc: IDocsEntity }): ReactElement => {
  const { doc } = props;
  const { active } = useOrcid();
  const { work } = useWork({ identifier: doc.identifier, full: true });

  // hide if orcid mode is off
  if (!active) {
    return null;
  }

  if (isOrcidProfileEntry(work)) {
    return <DeleteFromOrcidButton identifier={work.identifier} size="xs" mr={1} w={28} />;
  }

  return <AddToOrcidButton identifier={reconcileDocIdentifier(doc)} size="xs" mr={1} w={28} />;
};
