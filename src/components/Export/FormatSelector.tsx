import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import PT from 'prop-types';
import React from 'react';
import { exportFormats } from './constants';
import { ExportState } from './types';

interface IFormatSelectorProps {
  format: ExportState['format'];
  onFormatChange: (format: ExportState['format']) => void;
}

const propTypes = {
  format: PT.string.isRequired,
  onFormatChange: PT.func.isRequired,
};

export const FormatSelector = ({ format, onFormatChange }: IFormatSelectorProps): React.ReactElement => {
  const cls = {
    label: 'block text-sm font-medium text-gray-700',
    button:
      'relative w-full py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-default focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 focus:ring-1 sm:text-sm',
    options:
      'absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm',
  };

  return (
    <Listbox value={format} onChange={onFormatChange} data-testid="format-select">
      {({ open }) => (
        <>
          <Listbox.Label className={cls.label}>Export format</Listbox.Label>
          <div className="relative mt-1">
            <Listbox.Button className={cls.button}>
              <span className="block truncate">{exportFormats[format].label}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <SelectorIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className={cls.options}>
                {Object.values(exportFormats).map(({ label, id, help }) => (
                  <Listbox.Option
                    key={id}
                    value={id}
                    title={help}
                    aria-label={help}
                    className={({ active }) =>
                      clsx(
                        active ? 'text-white bg-indigo-600' : 'text-gray-900',
                        'relative pl-3 pr-9 py-2 cursor-default select-none',
                      )
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                          {label}
                        </span>

                        {selected ? (
                          <span
                            className={clsx(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                            )}
                          >
                            <CheckIcon className="w-5 h-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

FormatSelector.propTypes = propTypes;
