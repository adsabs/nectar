import { Flex, Grid, GridItem, Heading } from '@chakra-ui/layout';
import { examples } from './examples';
import { SearchExample } from './SearchExamples';

// fallback component to be used as a placeholder
export const SearchExamplesPlaceholder = () => {
  return (
    <Flex justifyContent="center" direction="column" alignItems="center">
      <Heading as="h3" size="md" mt={3} mb={5}>
        Search Examples
      </Heading>
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
