import { IFeedbackParams, useFeedback } from '@api/feedback';
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
  Spacer,
  Text,
} from '@chakra-ui/react';
import { parseAPIError } from '@utils';
import { ReactElement, useCallback } from 'react';
import { RecaptchaMessage } from '@components';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export interface IPreviewProps {
  params: IFeedbackParams;
  isOpen: boolean;
  title: string;
  submitterInfo: string;
  mainContentTitle: string;
  mainContent: string | ReactElement;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const PreviewModal = (props: IPreviewProps) => {
  const { params, isOpen, title, submitterInfo, mainContentTitle, mainContent, onClose, onSuccess, onError } = props;
  const { executeRecaptcha } = useGoogleReCaptcha();

  const { mutate, isLoading } = useFeedback();

  const handleSubmit = useCallback(async () => {
    if (!executeRecaptcha) {
      return;
    }

    mutate(
      {
        ...params,
        'g-recaptcha-response': await executeRecaptcha('feedback'),
      },
      {
        onSettled: (_data, error) => {
          error ? onError(parseAPIError(error)) : onSuccess();
          onClose();
        },
      },
    );
  }, [executeRecaptcha, mutate, onClose, onError, onSuccess, params]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
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
              <>{mainContent}</>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter backgroundColor="transparent" justifyContent="start" gap={1}>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Submit
          </Button>
          <Button onClick={onClose} variant="outline" isDisabled={isLoading}>
            Back
          </Button>
          <Spacer />
          <RecaptchaMessage />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
