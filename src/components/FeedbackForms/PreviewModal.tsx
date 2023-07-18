import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { DiffSectionPanel } from './MissingRecord';
import { DiffSection } from './MissingRecord/types';

export interface IPreviewProps {
  isOpen: boolean;
  title: string;
  submitterInfo: string;
  mainContentTitle: string;
  mainContent: string | DiffSection[];
  onSubmit: () => void;
  onClose: () => void;
}

export const PreviewModal = (props: IPreviewProps) => {
  const { isOpen, title, submitterInfo, mainContentTitle, mainContent, onSubmit, onClose } = props;

  const diffSectionPanels = useMemo(
    () =>
      typeof mainContent !== 'string' ? (
        !mainContent || mainContent.length === 0 ? (
          <strong>No Updates Detected</strong>
        ) : (
          <>
            {mainContent.map((section) => (
              <DiffSectionPanel key={section.label} section={section} />
            ))}
          </>
        )
      ) : null,
    [mainContent],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap={4}>
            <Text fontWeight="semibold">Submitter:</Text>
            <Box border="1px" borderColor="gray.100" backgroundColor="gray.50" p={4}>
              <pre className="whitespace-pre-wrap">{submitterInfo}</pre>
            </Box>
            <Text fontWeight="semibold">{mainContentTitle}:</Text>
            {typeof mainContent === 'string' ? (
              <Box border="1px" borderColor="gray.100" backgroundColor="gray.50" p={4}>
                <pre className="whitespace-pre-wrap">{mainContent}</pre>
              </Box>
            ) : (
              <>{diffSectionPanels}</>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter backgroundColor="transparent" justifyContent="start" gap={1}>
          <Button onClick={onSubmit}>Submit</Button>
          <Button onClick={onClose} variant="outline">
            Back
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
