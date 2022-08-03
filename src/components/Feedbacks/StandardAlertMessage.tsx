import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { AlertStatus } from '@chakra-ui/alert';

export interface IStandardAlertProps {
  status: AlertStatus;
  title: string | ReactElement;
  description?: string | ReactElement;
}

export const StandardAlertMessage = ({
  status,
  title: alertTitle,
  description: alertDescription,
}: IStandardAlertProps): ReactElement => {
  return (
    <Alert status={status} my={5}>
      <AlertIcon />
      <AlertTitle mr={2}>{alertTitle}</AlertTitle>
      {typeof alertDescription !== 'undefined' && <AlertDescription>{alertDescription}</AlertDescription>}
    </Alert>
  );
};
