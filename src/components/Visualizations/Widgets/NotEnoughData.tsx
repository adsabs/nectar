import { Box, Text } from '@chakra-ui/react';
import { SimpleLink } from '@components';

export const NotEnoughData = () => {
  return (
    <Box>
      <Text>
        The network grouping algorithm could not generate group data for your network. This might be because the list of
        papers was too small or sparse to produce multiple meaningful groups.
        <SimpleLink href="/help/actions/visualize" newTab>
          Learn more about how ADS networks are created and how they can be used.
        </SimpleLink>
      </Text>
    </Box>
  );
};
