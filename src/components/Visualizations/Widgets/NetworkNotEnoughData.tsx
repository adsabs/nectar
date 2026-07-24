import { Stack } from '@chakra-ui/react';
import { ReactElement } from 'react';

import { CustomInfoMessage } from '@/components/Feedbacks';
import { DataDownloader } from '@/components/DataDownloader';
import { NotEnoughData } from './NotEnoughData';
import { PaperLimit } from './PaperLimit';

export interface INetworkNotEnoughDataProps {
  paperLimit: number;
  maxPaperLimit: number;
  onChangePaperLimit: (limit: number) => void;
  // Only provided when the response carries usable rows to export; when
  // omitted the download button is not rendered (AC: omit when no data).
  csv?: { getFileContent: () => string; fileName: string };
}

/**
 * Error-state widget shown when the network grouping algorithm cannot build
 * groups. Keeps the PaperLimit control reachable so the user can raise an
 * over-restricted limit and retry, and offers a CSV export of whatever raw
 * data did come back.
 */
export const NetworkNotEnoughData = ({
  paperLimit,
  maxPaperLimit,
  onChangePaperLimit,
  csv,
}: INetworkNotEnoughDataProps): ReactElement => {
  return (
    <Stack as="section" aria-label="Not enough data" alignItems="center" spacing={2}>
      <CustomInfoMessage status="info" alertTitle="Could not generate" description={<NotEnoughData />} />
      <PaperLimit initialLimit={paperLimit} max={maxPaperLimit} onApply={onChangePaperLimit} />
      {csv && <DataDownloader label="Download CSV Data" getFileContent={csv.getFileContent} fileName={csv.fileName} />}
    </Stack>
  );
};
