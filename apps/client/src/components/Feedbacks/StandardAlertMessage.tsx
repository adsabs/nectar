import { Alert, AlertDescription, AlertIcon, AlertProps, AlertTitle, Box } from '@chakra-ui/react';
import React, { ReactElement } from 'react';

export interface IStandardAlertProps extends Omit<AlertProps, 'title'> {
  title: string | ReactElement;
  description?: string | ReactElement;
}

export const StandardAlertMessage = (props: IStandardAlertProps): ReactElement => {
  const { title: alertTitle, description: alertDescription, ...alertProps } = props;
  return (
    <Alert my={5} {...alertProps}>
      <AlertIcon />
      <Box>
        <AlertTitle mr={2}>{alertTitle}</AlertTitle>
        {typeof alertDescription !== 'undefined' && <AlertDescription>{alertDescription}</AlertDescription>}
      </Box>
    </Alert>
  );
};
