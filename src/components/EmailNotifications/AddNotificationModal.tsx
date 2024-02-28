import { NotificationTemplate } from '@api';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import { noop } from '@utils';
import { ArxivForm } from './Forms/ArxivForm';
import { CitationForm } from './Forms/CitationForm';
import { QueryForm } from './Forms/QueryForm';

export const AddNotificationModal = ({
  isOpen,
  onClose,
  template,
  onUpdated = noop,
}: {
  isOpen: boolean;
  onClose: () => void;
  template?: NotificationTemplate;
  onUpdated?: () => void;
}) => {
  const body = (
    <>
      {!template ? (
        <QueryForm onClose={onClose} onUpdated={onUpdated} />
      ) : template === 'arxiv' ? (
        <ArxivForm onClose={onClose} onUpdated={onUpdated} />
      ) : template === 'citations' ? (
        <CitationForm onClose={onClose} onUpdated={onUpdated} />
      ) : null}
    </>
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Create Email Notification -{' '}
          {!template
            ? 'for this query'
            : template === 'arxiv'
            ? 'arXiv'
            : `${template[0].toUpperCase()}${template.slice(1)}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>{body}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
