import { FC, PropsWithChildren } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

export const HideOnPrint: FC<PropsWithChildren<BoxProps>> = (props) => {
  const { children, ...boxProps } = props;
  return (
    <Box
      sx={{
        '@media print': {
          display: 'none',
        },
      }}
      {...boxProps}
    >
      {children}
    </Box>
  );
};
