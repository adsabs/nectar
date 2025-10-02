import { CheckIcon, DownloadIcon } from '@chakra-ui/icons';
import { Box, Button, HStack, Spinner, Stack, StackProps, Textarea, useBreakpointValue } from '@chakra-ui/react';
import { useDownloadFile } from '@/lib/useDownloadFile';
import { useIsClient } from '@/lib/useIsClient';
import { LabeledCopyButton } from '@/components/CopyButton';

import { sendGTMEvent } from '@next/third-parties/google';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { ExportApiFormatKey } from '@/api/export/types';
import { useEffect, useState } from 'react';
import { htmlToRtfPreprocess } from '../helpers';
import { useExportFormats } from '@/lib/useExportFormats';

export const ResultArea = ({
  result = '',
  format = ExportApiFormatKey.bibtex,
  isLoading,
  ...stackProps
}: {
  result: string;
  format: string;
  isLoading?: boolean;
} & StackProps) => {
  const [rtf, setRtf] = useState<string>(null);

  const { getFormatOptionById } = useExportFormats();

  const formatOption = getFormatOptionById(format);

  // for html format, convert to RTF and and additional clean up
  useEffect(() => {
    const loadHtmlToRtf = async () => {
      if (formatOption.type === 'HTML') {
        try {
          import('html-to-rtf-browser').then((m) => {
            const htmlToRtf = new m.default();
            setRtf(htmlToRtf.convertHtmlToRtf(htmlToRtfPreprocess(result)));
          });
        } catch (error) {
          console.error('Failed to load html-to-rtf-browser', error);
        }
      }
    };

    loadHtmlToRtf();
  }, [result, formatOption.type]);

  const { onDownload, hasDownloaded, isDownloading } = useDownloadFile(formatOption.type === 'HTML' ? rtf : result, {
    filename: () => `export-${format}.${formatOption.ext}`,
    type: formatOption.type === 'HTML' ? 'RTF' : 'TEXT',
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
            asHtml={formatOption.type === 'HTML'}
          />
        </HStack>
      )}
      {formatOption.type === 'HTML' ? (
        <>
          {result.length > 0 ? (
            <Box
              fontWeight="medium"
              dangerouslySetInnerHTML={{ __html: result }}
              overflowY="scroll"
              height="72"
              border="1px"
              borderRadius="md"
              borderColor={colors.border}
              padding={2}
            />
          ) : isLoading ? (
            <Box height="72" border="1px" borderRadius="md" borderColor={colors.border} padding={2}>{`Loading...`}</Box>
          ) : (
            <Box
              height="72"
              border="1px"
              borderRadius="md"
              borderColor={colors.border}
              padding={2}
            >{`Press "submit" to generate export.`}</Box>
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
          id="export-output"
        />
      )}
    </Stack>
  );
};
