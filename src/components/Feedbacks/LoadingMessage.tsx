import { CircularProgress, Flex, Text } from '@chakra-ui/react';

export interface ILoadingMessageProps {
  message: string;
}

export const LoadingMessage = ({ message }: ILoadingMessageProps) => {
  return (
    <Flex direction="column" alignItems="center" gap={2} m={2}>
      <CircularProgress isIndeterminate />
      <Text>{message}</Text>
    </Flex>
  );
};
