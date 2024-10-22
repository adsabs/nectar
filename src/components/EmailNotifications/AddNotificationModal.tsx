import {
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
} from '@chakra-ui/react';
import { CustomInfoMessage } from '@/components/Feedbacks';
import { useMemo } from 'react';
import { ArxivForm } from './Forms/ArxivForm';
import { CitationForm } from './Forms/CitationForm';
import { KeywordsForm } from './Forms/KeywordsForm';
import { QueryForm } from './Forms/QueryForm';
import { noop } from '@/utils/common/noop';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { INotification, NotificationTemplate } from '@/api/vault/types';
import { useGetNotification } from '@/api/vault/vault';

export const AddNotificationModal = ({
  isOpen,
  onClose,
  template,
  onUpdated = noop,
  nid,
}: {
  isOpen: boolean;
  onClose: () => void;
  template?: NotificationTemplate;
  onUpdated?: () => void;
  nid?: INotification['id'];
}) => {
  // if editing existing notifiction, fetch notification data
  const { data, isFetching, error } = useGetNotification({ id: nid ?? -1 }, { enabled: !!nid, staleTime: 0 });

  const notification = useMemo(() => {
    return data?.[0] ?? null;
  }, [data]);

  const templateLabel = template ?? notification?.template;

  const body = (
    <>
      {!nid ? (
        <>
          {!template ? (
            <QueryForm onClose={onClose} onUpdated={onUpdated} />
          ) : template === 'arxiv' ? (
            <ArxivForm onClose={onClose} onUpdated={onUpdated} />
          ) : template === 'citations' ? (
            <CitationForm onClose={onClose} onUpdated={onUpdated} template="citations" />
          ) : template === 'authors' ? (
            <CitationForm onClose={onClose} onUpdated={onUpdated} template="authors" />
          ) : (
            <KeywordsForm onClose={onClose} onUpdated={onUpdated} />
          )}
        </>
      ) : (
        <>
          {isFetching && (
            <Center>
              <Spinner />
            </Center>
          )}
          {!isFetching && error && (
            <CustomInfoMessage status="error" title="Error fetching data" description={parseAPIError(error)} />
          )}
          {!isFetching && notification && (
            <>
              {notification?.template === 'arxiv' ? (
                <ArxivForm onClose={onClose} onUpdated={onUpdated} notification={notification} />
              ) : notification?.template === 'citations' || notification?.template === 'authors' ? (
                <CitationForm onClose={onClose} onUpdated={onUpdated} notification={notification} />
              ) : (
                <KeywordsForm onClose={onClose} onUpdated={onUpdated} notification={notification} />
              )}
            </>
          )}
        </>
      )}
    </>
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {nid ? `Edit Email Notification - ` : `Create Email Notification - `}
          {`${
            !templateLabel
              ? 'for this query'
              : templateLabel === 'arxiv'
              ? 'arXiv'
              : `${templateLabel[0].toUpperCase()}${templateLabel.slice(1)}`
          }`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>{body}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
