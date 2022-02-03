import { TextInput } from '@components';
import PT from 'prop-types';
import { ChangeEvent, HTMLAttributes, ReactElement, useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { exportFormats } from './constants';
import { FormatSelector } from './FormatSelector';
import { useExportMachine } from './hook';
import { LimitRange } from './LimitRange';
import { ExportState } from './types';
import { Flex, HStack, Stack } from '@chakra-ui/layout';
import { Button } from '@chakra-ui/button';
import { Collapse, Fade } from '@chakra-ui/transition';
import { CloseButton } from '@chakra-ui/close-button';
import { CopyIcon, DownloadIcon } from '@chakra-ui/icons';
import { Textarea } from '@chakra-ui/react';
import { isBrowser } from '@utils';

export interface IExportProps extends HTMLAttributes<HTMLDivElement> {
  initialFormat?: ExportState['format'];
  initialText?: ExportState['text'];
  initialBibcodes?: ExportState['bibcodes'];
  singleMode?: ExportState['singleMode'];
  loadInitially?: ExportState['loadInitially'];
}
const propTypes = {
  initialFormat: PT.string,
  initialText: PT.string,
  initialBibcodes: PT.arrayOf(PT.string),
  singleMode: PT.bool,
  loadInitially: PT.bool,
};
const defaultProps = {
  initialFormat: exportFormats.bibtex.id,
  singleMode: false,
  initialBibcodes: [],
  initialText: '',
  loadInitially: true,
};

export const Export = ({
  initialFormat,
  initialBibcodes,
  initialText,
  singleMode,
  loadInitially,
}: IExportProps): ReactElement => {
  const [copied, setCopied] = useState(false);

  const handleOnCopy = () => {
    setCopied(true);
    setTimeout(setCopied, 1000, false);
  };

  const {
    state,
    handlers: { onFormatChange, onCustomFormatChange, onLimitChange, onSubmit, onDownload },
  } = useExportMachine({
    initialFormat,
    initialText,
    initialBibcodes,
    singleMode,
    loadInitially,
  });

  const noText = !state.text || state.text.length === 0;

  return (
    <Stack
      direction="column"
      aria-label="export"
      boxShadow={!singleMode ? 'md' : 'none'}
      borderRadius="md"
      p={!singleMode ? '5' : '0'}
      spacing={2}
    >
      {!singleMode && <CloseButton as={Flex} justifyContent="end" width="full" />}
      {isBrowser() && (
        <form onSubmit={onSubmit}>
          <Stack direction="column" spacing={3}>
            <FormatSelector format={state.format} onFormatChange={onFormatChange} />

            <CustomFormatInput
              show={state.format === 'custom'}
              customFormat={state.customFormat}
              onChange={onCustomFormatChange}
            />
            {!singleMode && <LimitRange limit={state.limit} max={state.totalRecords} onLimitChange={onLimitChange} />}
            <Collapse in={!singleMode || state.format === 'custom'}>
              <Button data-testid="btn-apply" type="submit" isLoading={state.loading}>
                Apply
              </Button>
            </Collapse>
          </Stack>
        </form>
      )}
      {isBrowser() && (
        <HStack>
          <Button
            data-testid="btn-download"
            isDisabled={state.loading || noText}
            onClick={onDownload}
            rightIcon={<DownloadIcon />}
          >
            Download to File
          </Button>
          <CopyToClipboard text={state.text} onCopy={handleOnCopy}>
            <Button data-testid="btn-copy" isDisabled={state.loading || noText} rightIcon={<CopyIcon />}>
              Copy to Clipboard
            </Button>
          </CopyToClipboard>

          <Fade in={copied}>Copied!</Fade>
        </HStack>
      )}
      <Textarea aria-label="export text" value={state.text} rows={10} readOnly={true}></Textarea>
    </Stack>
  );
};
Export.propTypes = propTypes;
Export.defaultProps = defaultProps;

const CustomFormatInput = ({
  customFormat,
  show = false,
  onChange,
}: {
  show: boolean;
  customFormat: string;
  onChange: (val: string) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // focus on element if shown
  useEffect(() => {
    if (show && ref.current !== null) {
      ref.current.focus();
    }
  }, [show, ref.current]);
  return (
    <Collapse in={show}>
      <TextInput label="Custom Format" ref={ref} onChange={handleChange} value={customFormat} />
    </Collapse>
  );
};
