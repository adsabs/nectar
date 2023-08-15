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
import { GOOGLE_RECAPTCHA_KEY } from '@config';
import { parseAPIError } from '@utils';
import { ReactElement, useEffect, useRef, useState } from 'react';
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

  const [paramsWithToken, setParamsWithToken] = useState<IFeedbackParams>(null);

  const [token, setToken] = useState<string>(null);

  const { isLoading, isFetching, isSuccess, error, refetch } = useFeedback(paramsWithToken, {
    enabled: false,
  });

  const recaptchaRef = useRef<ReCAPTCHA>();

  useEffect(() => {
    if (isSubmitting) {
      const token = recaptchaRef.current.getValue();
      setParamsWithToken({ ...params, 'g-recaptcha-response': token });
    } else {
      recaptchaRef?.current?.reset();
      setToken(null);
      setParamsWithToken(null);
    }
  }, [isSubmitting]);

  useEffect(() => {
    if (paramsWithToken) {
      void refetch();
    }
  }, [paramsWithToken]);

  useEffect(() => {
    if (!isFetching && !isLoading) {
      setIsSubmitting(false);
      if (isSuccess) {
        onSuccess();
      } else {
        onError(parseAPIError(error));
      }
      onClose();
    }
  }, [isFetching, isSuccess, error, isLoading]);

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
            <ReCAPTCHA ref={recaptchaRef} sitekey={GOOGLE_RECAPTCHA_KEY} onChange={setToken} />
          </Flex>
        </ModalBody>
        <ModalFooter backgroundColor="transparent" justifyContent="start" gap={1}>
          <Button onClick={handleSubmit} isLoading={isSubmitting} isDisabled={token === null}>
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
