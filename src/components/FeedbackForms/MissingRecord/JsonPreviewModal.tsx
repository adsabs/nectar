import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  Box,
  Text,
} from '@chakra-ui/react';
import { IFormData } from '@components';

export const JsonPreviewModal = ({
  isOpen,
  onClose,
  name,
  email,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  email: string;
  data: IFormData;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>JSON Preview</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontWeight="bold" mb={2}>
            Submitter:
          </Text>
          <Text>{name}</Text>
          <Text>{email}</Text>
          <Box mt={5}>
            <Text fontWeight="bold" mb={2}>
              Record:
            </Text>
            <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
