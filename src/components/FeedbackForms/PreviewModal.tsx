import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { ReactElement, useCallback, useState } from 'react';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormMessage } from '@/components/Feedbacks/FormMessage';

import { RecaptchaMessage } from '@/components/RecaptchaMessage/RecaptchaMessage';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { useFeedback } from '@/api/feedback/feedback';
import { IFeedbackParams } from '@/api/feedback/types';

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
  const [formError, setFormError] = useState<Error | string | null>(null);

  const { mutate, isLoading } = useFeedback();

  const colors = useColorModeColors();

  const handleSubmit = useCallback(async () => {
    if (!executeRecaptcha) {
      setFormError('ReCAPTCHA not loaded properly. Please refresh the page and try again.');
      return;
    }

    try {
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
    } catch (e) {
      setFormError(e as Error);
    }
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
            <Box border="1px" borderColor={colors.border} backgroundColor={colors.panel} p={4}>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{submitterInfo}</pre>
            </Box>
            <Text fontWeight="semibold">{mainContentTitle}:</Text>
            {typeof mainContent === 'string' ? (
              <Box border="1px" borderColor={colors.border} backgroundColor={colors.panel} p={4}>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{mainContent}</pre>
              </Box>
            ) : (
              <>{mainContent}</>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter backgroundColor="transparent" justifyContent="start" gap={1}>
          <Flex direction={{ base: 'column' }}>
            <HStack>
              <Button onClick={handleSubmit} isLoading={isLoading}>
                Submit
              </Button>
              <Button onClick={onClose} variant="outline" isDisabled={isLoading}>
                Back
              </Button>
            </HStack>
            <FormMessage show={!!formError} title="Unable to submit form" error={formError} />
            <RecaptchaMessage />
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
