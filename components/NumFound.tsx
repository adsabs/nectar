import { Typography, Box } from '@material-ui/core';

const NumFound: React.FC<INumFoundProps> = () => {
  const numFound = 0;

  return (
    <Typography variant="caption" component="article">
      Your search returned{' '}
      <Box fontWeight="fontWeightMedium" display="inline">
        {numFound}
      </Box>{' '}
      results
    </Typography>
  );
};

interface INumFoundProps {}

export default NumFound;
