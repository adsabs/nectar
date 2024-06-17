import { DownloadIcon } from '@chakra-ui/icons';
import { Flex, IconButton, StyleProps, Text } from '@chakra-ui/react';
import { useDownloadFile } from 'src/lib';
import { FC, PropsWithChildren } from 'react';

export interface IDataDownloaderProps extends StyleProps {
  label: string;
  getFileContent: () => string;
  fileName: string; // include file extension
  showLabel?: boolean;
}

/**
 * The component is a download button, which handles downloading of dynamically generated data file
 */
export const DataDownloader: FC<PropsWithChildren<IDataDownloaderProps>> = ({
  label,
  getFileContent,
  fileName,
  showLabel = false,
  ...styleProps
}) => {
  const { onDownload } = useDownloadFile(getFileContent, {
    filename: fileName,
  });

  return (
    <Flex
      w="fit-content"
      gap={2}
      alignItems="center"
      onClick={onDownload}
      as="a"
      cursor="pointer"
      tabIndex={0}
      {...styleProps}
    >
      <IconButton aria-label={label} icon={<DownloadIcon />} variant="outline" isRound tabIndex={-1} />
      {showLabel && <Text>{label}</Text>}
    </Flex>
  );
};
