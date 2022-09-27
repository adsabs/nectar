import { FC, HTMLAttributes, useEffect, useRef, useState } from 'react';
import { Flex, IconButton, StyleProps, Text } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';

export interface IDataDownloaderProps extends StyleProps {
  label: string;
  getFileContent: () => string;
  fileName: string; // include file extension
  showLabel?: boolean;
}

/**
 * The component is a download button, which handles downloading of dynamically generated data file
 */
export const DataDownloader: FC<IDataDownloaderProps> = ({
  label,
  getFileContent,
  fileName,
  showLabel = false,
  ...styleProps
}) => {
  const [fileUrl, setFileUrl] = useState<string>(null);

  const linkRef = useRef<HTMLAnchorElement>();

  const handleDownloadClick = () => {
    const fileContent = getFileContent();
    const blob = new Blob([fileContent]);
    setFileUrl(URL.createObjectURL(blob));
  };

  useEffect(() => {
    if (fileUrl) {
      // click the file link
      linkRef.current.click();
      // reset
      setFileUrl(null);
    }
  }, [fileUrl]);

  return (
    <Flex
      w="fit-content"
      gap={2}
      alignItems="center"
      onClick={handleDownloadClick}
      as="a"
      cursor="pointer"
      tabIndex={0}
      {...styleProps}
    >
      <IconButton aria-label={label} icon={<DownloadIcon />} variant="outline" isRound tabIndex={-1} />
      {showLabel && <Text>{label}</Text>}
      <a ref={linkRef} href={fileUrl} download={fileName}></a>
    </Flex>
  );
};
