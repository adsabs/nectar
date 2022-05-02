import { Box, Heading, Spinner } from '@chakra-ui/react';
import { FC, HTMLAttributes, ReactNode } from 'react';

export const ExportContainer: FC<{ header: ReactNode; isLoading?: boolean } & HTMLAttributes<HTMLDivElement>> = ({
  children,
  header,
  isLoading,
  ...divProps
}) => {
  return (
    <Box
      p="3"
      border="1px solid"
      borderRadius="8px"
      borderColor="lightgray"
      boxShadow="0px 2px 5.5px rgba(0, 0, 0, 0.02)"
      {...divProps}
    >
      <Heading as="h2" size="sm" mb="3" data-testid="export-heading" display="flex">
        <Box flex="1">{header}</Box>
        {isLoading && <Spinner />}
      </Heading>

      {children}
    </Box>
  );
};
