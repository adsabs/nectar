import { Alert, AlertDescription, AlertIcon, AlertProps, AlertStatus, AlertTitle, Flex } from '@chakra-ui/react';
import { ReactElement } from 'react';

export interface IStaticAlertProps extends AlertProps {
  status: AlertStatus;
  alertTitle: string | ReactElement;
  description?: string | ReactElement;
}

export const CustomInfoMessage = ({
  status,
  alertTitle,
  description: alertDescription,
  ...alertProps
}: IStaticAlertProps) => {
  return (
    <Flex justifyContent="center">
      <Alert
        status={status}
        variant="subtle"
        flexDirection="column"
        justifyContent="center"
        backgroundColor="transparent"
        my={5}
        width="50%"
        {...alertProps}
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          {alertTitle}
        </AlertTitle>
        {typeof alertDescription !== 'undefined' && <AlertDescription>{alertDescription}</AlertDescription>}
      </Alert>
    </Flex>
  );
};
