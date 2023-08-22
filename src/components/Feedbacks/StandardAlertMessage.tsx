import { Alert, AlertDescription, AlertIcon, AlertStatus, AlertTitle, Box } from '@chakra-ui/react';
import React, { ReactElement } from 'react';

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
      <Box>
        <AlertTitle mr={2}>{alertTitle}</AlertTitle>
        {typeof alertDescription !== 'undefined' && <AlertDescription>{alertDescription}</AlertDescription>}
      </Box>
    </Alert>
  );
};
