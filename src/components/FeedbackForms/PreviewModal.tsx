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
  Text,
} from '@chakra-ui/react';
import { useRecaptcha } from '@lib/useRecaptcha';
import { parseAPIError } from '@utils';
import { ReactElement, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getRecaptchaProps, recaptcha } = useRecaptcha({
    onError: (error) => {
      onError(error);
      onClose();
    },
    enabled: isSubmitting,
  });

  const { isLoading, isSuccess, error } = useFeedback(
    { ...params, 'g-recaptcha-response': recaptcha } as IFeedbackParams,
    {
      enabled: isSubmitting && !!recaptcha,
    },
  );

  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
      if (isSuccess) {
        onSuccess();
      } else {
        onError(parseAPIError(error));
      }
      onClose();
    }
  }, [isLoading, isSuccess, error]);

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
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
          <ReCAPTCHA {...getRecaptchaProps()} />
        </ModalBody>
        <ModalFooter backgroundColor="transparent" justifyContent="start" gap={1}>
          <Button onClick={handleSubmit} isLoading={isSubmitting} isDisabled={!!recaptcha}>
            Submit
          </Button>
          <Button onClick={onClose} variant="outline" isDisabled={isSubmitting}>
            Back
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
