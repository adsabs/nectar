import { NotificationTemplate } from '@api';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import { ArxivForm } from './Forms/ArxivForm';

export const AddNotificationModal = ({
  isOpen,
  onClose,
  template,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: NotificationTemplate;
  onUpdated: () => void;
}) => {
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
        <ModalBody>{template === 'arxiv' && <ArxivForm onClose={onClose} onUpdated={onUpdated} />}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
