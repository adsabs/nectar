import { Box, Typography } from '@material-ui/core';
import React from 'react';

const NumFound: React.FC<INumFoundProps> = React.memo(({ numFound = 0 }) => {
  return (
    <Typography variant="caption" component="article">
      Your search returned{' '}
      <Box fontWeight="fontWeightMedium" display="inline">
        {numFound.toLocaleString()}
      </Box>{' '}
      results
    </Typography>
  );
});

interface INumFoundProps {
  numFound: number;
}

export default NumFound;
