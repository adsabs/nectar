import { Alert, AlertDescription, AlertIcon, AlertStatus, AlertTitle, Flex } from '@chakra-ui/react';
import { ReactElement } from 'react';

export interface IStaticAlertProps {
  status: AlertStatus;
  title: string | ReactElement;
  description?: string | ReactElement;
}

export const CustomInfoMessage = ({
  status,
  title: alertTitle,
  description: alertDescription,
}: IStaticAlertProps): ReactElement => {
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
