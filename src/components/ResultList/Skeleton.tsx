import { Stack, Box } from '@chakra-ui/layout';
import { range } from 'ramda';
import { ReactElement } from 'react';

interface ISkeletonProps {
  count: number;
}

export const Skeleton = (props: ISkeletonProps): ReactElement => {
  const { count } = props;

  return (
    <>
      {range(0, count).map((i) => (
        <Box border="1px" borderColor="gray.50" margin={2} borderRadius="md" padding={2} key={i.toString()}>
          <Stack direction="column" animation="paused" width="full">
            <Box backgroundColor="gray.50" borderRadius="md" height="1em" width="75%" />
            <Box backgroundColor="gray.50" borderRadius="md" height="1em" width="100%" />
            <Box backgroundColor="gray.50" borderRadius="md" height="1em" width="50%" />
          </Stack>
        </Box>
      ))}
    </>
  );
};
