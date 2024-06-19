import { Flex, Grid, GridItem } from '@chakra-ui/react';
import { examples } from './examples';
import { SearchExample } from './SearchExamples';

// fallback component to be used as a placeholder
export const SearchExamplesPlaceholder = () => {
  return (
    <Flex justifyContent="center" direction="column" alignItems="center">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5}>
        <GridItem>
          {examples['GENERAL'].left.map(({ label, text }) => (
            <SearchExample label={label} example={text} key={label} data-text={text} />
          ))}
        </GridItem>
        <GridItem>
          {examples['GENERAL'].right.map(({ label, text }) => (
            <SearchExample label={label} example={text} key={label} data-text={text} />
          ))}
        </GridItem>
      </Grid>
    </Flex>
  );
};
