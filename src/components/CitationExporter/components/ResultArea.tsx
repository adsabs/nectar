import { ExportApiFormatKey } from '@api';
import { CheckIcon, DownloadIcon } from '@chakra-ui/icons';
import { Button, HStack, Spinner, Stack, StackProps, Textarea, useBreakpointValue } from '@chakra-ui/react';
import { useDownloadFile } from '@lib/useDownloadFile';
import { useIsClient } from '@lib/useIsClient';
import { exportFormats } from '../models';
import { LabeledCopyButton } from '@components/CopyButton';
import { useGTMDispatch } from '@elgorditosalsero/react-gtm-hook';
import { useColorModeColors } from '@lib';

export const ResultArea = ({
  result = '',
  format = ExportApiFormatKey.bibtex,
  isLoading,
  ...stackProps
}: {
  result: string;
  format: ExportApiFormatKey;
  isLoading?: boolean;
} & StackProps) => {
  const sendDataToGTM = useGTMDispatch();
  const { onDownload, hasDownloaded, isDownloading } = useDownloadFile(result, {
    filename: () => `export-${format}.${exportFormats[format].ext}`,
    onDownloaded() {
      sendDataToGTM({
        event: 'citation_export',
        export_type: 'download',
        export_format: format,
      });
    },
  });
  const isFullWidth = useBreakpointValue([true, false]);
  const isClient = useIsClient();
  const { panel: textAreaBackgroundColor } = useColorModeColors();
  return (
    <Stack flexGrow={[1, 1, 2]} {...stackProps}>
      {isClient && (
        <HStack justifyContent={['center', 'start']}>
          <Button
            onClick={onDownload}
            data-testid="export-download"
            isDisabled={isLoading}
            width={isFullWidth ? 'full' : 'auto'}
            variant="outline"
            leftIcon={hasDownloaded ? <CheckIcon /> : <DownloadIcon />}
          >
            {hasDownloaded ? 'Downloaded!' : isDownloading ? <Spinner /> : 'Download to file'}
          </Button>
          <LabeledCopyButton
            label={'Copy to Clipboard'}
            text={result}
            data-testid="export-copy"
            isDisabled={isLoading}
            width={isFullWidth ? 'full' : 'auto'}
            variant="outline"
            onCopyComplete={() => {
              sendDataToGTM({
                event: 'citation_export',
                export_type: 'copy',
                export_format: format,
              });
            }}
          />
        </HStack>
      )}
      <Textarea
        readOnly
        fontSize={['xs', 'sm']}
        resize="none"
        minH={['xs', 'sm']}
        bgColor={textAreaBackgroundColor}
        fontFamily="monospace"
        fontWeight="semibold"
        value={result}
        data-testid="export-output"
      />
    </Stack>
  );
};
