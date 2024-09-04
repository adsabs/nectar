import { CircularProgress, Flex, FlexProps, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';

export interface ILoadingMessageProps extends FlexProps {
  message: string;
}

export const LoadingMessage = ({ message, ...flexProps }: ILoadingMessageProps): ReactElement => {
  return (
    <Flex direction="column" alignItems="center" gap={2} m={2} {...flexProps}>
      <CircularProgress isIndeterminate />
      <Text>{message}</Text>
    </Flex>
  );
};
