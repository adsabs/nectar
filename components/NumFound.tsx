import { Typography, Box } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { numFoundState } from '@recoil/selectors';

const NumFound: React.FC<INumFoundProps> = () => {
  const numFound = useRecoilValue(numFoundState);

  return (
    <Typography variant="caption" component="article">
      Your search returned{' '}
      <Box fontWeight="fontWeightMedium" display="inline">
        {numFound.toLocaleString()}
      </Box>{' '}
      results
    </Typography>
  );
};

interface INumFoundProps {}

export default NumFound;
