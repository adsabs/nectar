import { FallbackProps } from 'react-error-boundary';
import { AxiosError } from 'axios';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertStatus,
  Button,
  Code,
  Collapse,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { parseAPIError } from '@utils';
import React from 'react';

interface ISuspendedAlertProps extends FallbackProps {
  label: string;
  resetButtonText?: string;
  error: AxiosError | Error | unknown;
  status?: AlertStatus;
  mapErrorMessages?: Record<string, string>;
}

export const SuspendedAlert = (props: ISuspendedAlertProps) => {
  const {
    error,
    status = 'error',
    resetErrorBoundary,
    label,
    resetButtonText = 'Try again',
    mapErrorMessages = {},
  } = props;
  const { isOpen, onToggle } = useDisclosure();
  const message = mapErrorMessages?.[parseAPIError(error)] ?? parseAPIError(error);

  return (
    <Alert status={status} my="2" borderRadius="md">
      <AlertDescription>
        <Stack spacing="4" alignItems="flex-start">
          <Text>
            <AlertIcon display="inline-block" />
            {label}
          </Text>
          {message ? (
            <>
              <Button variant="link" onClick={onToggle}>
                See details
              </Button>
              <Collapse in={isOpen}>
                <Code>{message}</Code>
              </Collapse>
            </>
          ) : null}
          <Button onClick={() => resetErrorBoundary()}>{resetButtonText}</Button>
        </Stack>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Utility function for creating suspended alert specifically from a fallback render prop
 * @param props
 */
export const getFallBackAlert = (props: Omit<ISuspendedAlertProps, 'error' | 'resetErrorBoundary'>) => {
  return (fallbackProps: FallbackProps) => <SuspendedAlert {...props} {...fallbackProps} />;
};
