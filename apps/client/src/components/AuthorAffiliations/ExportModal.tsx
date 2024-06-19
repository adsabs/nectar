import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  ButtonProps,
  Code,
  FormLabel,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  useDisclosure,
} from '@chakra-ui/react';
import { parseAPIError } from '@/utils';
import { useEffect } from 'react';
import { exportTypes } from './models';
import { useExportModal } from './useExportModal';

export const ExportModal = (props: ButtonProps) => {
  const { ...btnProps } = props;

  const { isOpen, onClose, onOpen } = useDisclosure();
  const {
    isLoading,
    format,
    onDone,
    onFetch,
    onFormatChange,
    numSelected,
    downloadLink,
    downloadFilename,
    isError,
    error,
    noData,
  } = useExportModal({
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      // if modal closes unexpectedly, this will make sure the state gets reset
      onDone();
    }
  }, [isOpen]);

  return (
    <>
      <Button onClick={onOpen} variant="outline" {...btnProps}>
        Export
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            Exporting {numSelected} entrie{numSelected > 1 ? 's' : ''}
          </ModalHeader>
          <ModalBody>
            <FormLabel htmlFor="export-selection">Select export format</FormLabel>
            <RadioGroup onChange={onFormatChange} value={format} isDisabled={isError}>
              <Stack>
                {exportTypes.map((type) => (
                  <Radio size="sm" key={type} value={type}>
                    <Code children={type} p="1" />
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
            <Button onClick={onFetch} mt="2" width="full" isLoading={isLoading} isDisabled={isError || noData}>
              Export to file
            </Button>
            {noData ? (
              <Alert status="warning" mt="2">
                <AlertTitle>No Selection!</AlertTitle>
              </Alert>
            ) : null}
            {downloadLink ? (
              <Box mt="2">
                Download not working?{' '}
                <Link href={downloadLink} download={downloadFilename}>
                  Direct Link
                </Link>
              </Box>
            ) : null}
            {isError ? (
              <Alert status="error" mt="2">
                <AlertTitle>Error downloading file</AlertTitle>
                <AlertDescription>{parseAPIError(error)}</AlertDescription>
              </Alert>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
