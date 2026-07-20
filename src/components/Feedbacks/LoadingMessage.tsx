import { CircularProgress, Flex, FlexProps, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';

export type ILoadingMessageProps = {
  message: string;
} & FlexProps;

export const LoadingMessage = ({ message, ...props }: ILoadingMessageProps): ReactElement => {
  return (
    <Flex direction="column" alignItems="center" gap={2} m={2} {...props}>
      <CircularProgress isIndeterminate />
      <Text>{message}</Text>
    </Flex>
  );
};
