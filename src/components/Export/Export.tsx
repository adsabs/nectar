import { TextInput } from '@components';
import { Button } from '@components/Button';
import { Panel } from '@components/Panel';
import { Transition } from '@headlessui/react';
import { DownloadIcon, DuplicateIcon, RefreshIcon } from '@heroicons/react/solid';
import PT from 'prop-types';
import React, { HTMLAttributes, useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { exportFormats } from './constants';
import { FormatSelector } from './FormatSelector';
import { useExportMachine } from './hook';
import { LimitRange } from './LimitRange';
import { ExportState } from './types';

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
}: IExportProps): React.ReactElement => {
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
    <Panel ariaName="export" showCloseButton={!singleMode}>
      <div className="grid gap-7 grid-cols-12">
        <div className="col-span-12 sm:col-span-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <FormatSelector format={state.format} onFormatChange={onFormatChange} />

            <CustomFormatInput
              show={state.format === 'custom'}
              customFormat={state.customFormat}
              onChange={onCustomFormatChange}
            />
            <Transition show={!singleMode}>
              <LimitRange limit={state.limit} max={state.totalRecords} onLimitChange={onLimitChange} />
            </Transition>

            <div className="flex items-center">
              <Transition show={!singleMode || state.format === 'custom'}>
                <Button data-testid="btn-apply" type="submit" disabled={state.loading}>
                  Apply
                </Button>
              </Transition>
              <Transition show={state.loading} className="ml-1">
                <RefreshIcon className="w-6 h-6 text-blue-600 animate-spin" />
              </Transition>
            </div>
          </form>
        </div>
        <div className="col-span-12 sm:col-span-8">
          <div className="mb-3">
            <Button data-testid="btn-download" className="mr-3" disabled={state.loading || noText} onClick={onDownload}>
              <DownloadIcon className="mr-2 w-4 h-4" aria-hidden="true" /> Download to File
            </Button>
            <CopyToClipboard text={state.text} onCopy={handleOnCopy}>
              <Button data-testid="btn-copy" disabled={state.loading || noText}>
                <DuplicateIcon className="mr-2 w-4 h-4" aria-hidden="true" /> Copy to Clipboard
              </Button>
            </CopyToClipboard>

            <Transition show={copied} as="span" className="ml-4 text-blue-500 text-sm">
              Copied!
            </Transition>
          </div>
          <textarea
            data-testid="textarea"
            value={state.text}
            rows={10}
            readOnly={true}
            className="block w-full bg-gray-100 border border-gray-300 focus:border-indigo-500 rounded-md shadow-sm box-border focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>
      </div>
    </Panel>
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // focus on element if shown
  useEffect(() => {
    if (show && ref.current !== null) {
      ref.current.focus();
    }
  }, [show, ref.current]);
  return (
    <Transition show={show}>
      <TextInput label="Custom Format" ref={ref} onChange={handleChange} value={customFormat} />
    </Transition>
  );
};
