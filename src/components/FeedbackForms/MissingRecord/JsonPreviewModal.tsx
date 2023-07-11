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
import { FormValues } from '@components';

export const JsonPreviewModal = ({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: FormValues;
}) => {
  return (
    <>
      {data && (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>JSON Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text fontWeight="bold" mb={2}>
                Submitter:
              </Text>
              <Text>{data.name}</Text>
              <Text>{data.email}</Text>
              <Box mt={5}>
                <Text fontWeight="bold" mb={2}>
                  Record:
                </Text>
                <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
