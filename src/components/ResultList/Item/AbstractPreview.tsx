import { IDocsEntity } from '@api';
import { Transition } from '@headlessui/react';
import { ChevronDoubleDownIcon, ChevronDoubleUpIcon, RefreshIcon } from '@heroicons/react/outline';
import { useGetAbstractPreview } from '@_api/search';
import { useState } from 'react';
import { toast } from 'react-toastify';
export interface IAbstractPreviewProps {
  bibcode: IDocsEntity['bibcode'];
}

const text = {
  error: 'Problem loading abstract preview' as const,
  noAbstract: 'No Abstract' as const,
  hideAbstract: 'Hide Abstract Preview' as const,
  showAbstract: 'Show Abstract Preview' as const,
  seeFullAbstract: 'See full abstract' as const,
};

export const AbstractPreview = ({ bibcode }: IAbstractPreviewProps): React.ReactElement => {
  const [show, setShow] = useState(false);
  const { data, isFetching, isSuccess } = useGetAbstractPreview(
    { bibcode },
    {
      enabled: show,
      keepPreviousData: true,
      onError: () => {
        // show toast notification on error, and close drawer
        toast(text.error, { type: 'error' });
        setShow(false);
      },
    },
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <Transition
        show={show}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        {isSuccess && (
          <div className="mt-2" dangerouslySetInnerHTML={{ __html: data.docs[0]?.abstract ?? text.noAbstract }}></div>
        )}
      </Transition>
      <button
        type="button"
        title={show ? text.hideAbstract : text.showAbstract}
        onClick={() => setShow(!show)}
        disabled={false}
        className="flex-col items-start"
      >
        {isFetching ? (
          <RefreshIcon className="default-icon default-link-color transform rotate-180 animate-spin" />
        ) : show ? (
          <ChevronDoubleUpIcon className="default-icon-sm my-1 text-gray-300" />
        ) : (
          <ChevronDoubleDownIcon className="default-icon-sm text-gray-300" />
        )}
      </button>
    </div>
  );
};
