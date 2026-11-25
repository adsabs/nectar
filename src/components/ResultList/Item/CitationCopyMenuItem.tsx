import { useToast } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { useGetExportCitation } from '@/api/export/export';
import { getBibtexExportParams } from '@/api/export/getBibtexExportParams';
import { useCitationFormat } from '@/lib/useCitationFormat';
import { CopyMenuItem } from '@/components/CopyButton';

export interface ICitationCopyMenuItemProps {
  bibcode: string;
  settings: IADSApiUserDataResponse;
}

export const CitationCopyMenuItem = ({ bibcode, settings }: ICitationCopyMenuItemProps): ReactElement => {
  const toast = useToast();
  const { format } = useCitationFormat();

  const { data: citationData } = useGetExportCitation(
    {
      format: format.id,
      customFormat: format.customFormat,
      bibcode: [bibcode],
      ...getBibtexExportParams(settings, format.id),
    },
    { enabled: !!bibcode },
  );

  const citation = citationData?.export ?? '';

  const handleCitationCopied = () => {
    if (!!citation) {
      toast({ status: 'info', title: 'Copied to Clipboard' });
    } else {
      toast({ status: 'error', title: 'There was a problem fetching citation. Try reloading the page.' });
    }
  };

  return (
    <CopyMenuItem
      text={citation}
      onCopyComplete={handleCitationCopied}
      label="Copy Citation"
      asHtml={format.asHtml}
      isDisabled={citation === ''}
    />
  );
};
