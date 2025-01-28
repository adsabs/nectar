import { CheckIcon, DownloadIcon } from '@chakra-ui/icons';
import { Box, Button, HStack, Spinner, Stack, StackProps, Textarea, useBreakpointValue, Text } from '@chakra-ui/react';
import { useDownloadFile } from '@/lib/useDownloadFile';
import { useIsClient } from '@/lib/useIsClient';
import { citationFormatIds, exportFormats } from '../models';
import { LabeledCopyButton } from '@/components/CopyButton';

import { sendGTMEvent } from '@next/third-parties/google';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { ExportApiFormatKey } from '@/api/export/types';
import { LoadingMessage } from '@/components/Feedbacks';

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
  const { onDownload, hasDownloaded, isDownloading } = useDownloadFile(result, {
    filename: () => `export-${format}.${exportFormats[format].ext}`,
    onDownloaded() {
      sendGTMEvent({
        event: 'citation_export',
        export_type: 'download',
        export_format: format,
      });
    },
  });
  const colors = useColorModeColors();
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
              sendGTMEvent({
                event: 'citation_export',
                export_type: 'copy',
                export_format: format,
              });
            }}
          />
        </HStack>
      )}
      {citationFormatIds.includes(format) ? (
        <>
          {result.length > 0 ? (
            <Box
              fontWeight="medium"
              dangerouslySetInnerHTML={{ __html: result }}
              overflowY="scroll"
              maxHeight="72"
              border="1px"
              borderRadius="md"
              borderColor={colors.border}
              padding={2}
            />
          ) : isLoading ? (
            <LoadingMessage message="Loading" />
          ) : (
            <Text>{`Press "submit" to generate export.`}</Text>
          )}
        </>
      ) : (
        <Textarea
          readOnly
          fontSize={['xs', 'sm']}
          resize="none"
          minH={['xs', 'sm']}
          bgColor={textAreaBackgroundColor}
          fontFamily="monospace"
          fontWeight="semibold"
          value={result.length > 0 ? result : isLoading ? 'Loading...' : 'Press "submit" to generate export.'}
          data-testid="export-output"
        />
      )}
    </Stack>
  );
};
