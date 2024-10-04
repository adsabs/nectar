import { DownloadIcon } from '@chakra-ui/icons';
import { Button, StyleProps, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { useDownloadFile } from '@/lib/useDownloadFile';

export interface IDataDownloaderProps extends StyleProps {
  label: string;
  getFileContent: () => string;
  fileName: string; // include file extension
}

/**
 * The component is a download button, which handles downloading of dynamically generated data file
 */
export const DataDownloader: FC<IDataDownloaderProps> = ({ label, getFileContent, fileName, ...styleProps }) => {
  const { onDownload } = useDownloadFile(getFileContent, {
    filename: fileName,
  });

  return (
    <Button
      w="fit-content"
      onClick={onDownload}
      variant="ghost"
      fontSize="md"
      leftIcon={<DownloadIcon aria-hidden />}
      {...styleProps}
    >
      <Text>{label}</Text>
    </Button>
  );
};
