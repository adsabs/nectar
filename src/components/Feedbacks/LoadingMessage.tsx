import { Box, CircularProgress, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';

export interface ILoadingMessageProps {
  message: string;
}

export const LoadingMessage = ({ message }: ILoadingMessageProps): ReactElement => {
  return (
    <Box my={5}>
      <Text>{message}</Text>
      <CircularProgress isIndeterminate />
    </Box>
  );
};
