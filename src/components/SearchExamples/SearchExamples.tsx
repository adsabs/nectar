import { Box, Flex, Grid, GridItem, Heading, Text } from '@chakra-ui/layout';
import { useAppCtx } from '@store';
import { FC, HTMLAttributes } from 'react';
import { examples } from './examples';

export interface ISearchExamplesProps {
  onClick?(text: string): void;
  className?: HTMLAttributes<HTMLDivElement>['className'];
}

export const SearchExamples: FC<ISearchExamplesProps> = ({ onClick }) => {
  const { state: appState } = useAppCtx();

  const createHandler = (text: string) => {
    if (typeof onClick === 'function') {
      return () => onClick(text);
    }
    return undefined;
  };

  return (
    <Flex justifyContent="center" direction="column" alignItems="center">
      <Heading as="h3" size="md" mt={3} mb={5}>
        Search Examples
      </Heading>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5}>
        <GridItem>
          {examples[appState.theme].left.map(({ label, text }) => (
            <SearchExample label={label} example={text} key={label} onClick={createHandler(text)} />
          ))}
        </GridItem>
        <GridItem>
          {examples[appState.theme].right.map(({ label, text }) => (
            <SearchExample label={label} example={text} key={label} onClick={createHandler(text)} />
          ))}
        </GridItem>
      </Grid>
    </Flex>
  );
};

interface ISearchExampleProps {
  label: string;
  example: string;
  onClick: () => void;
}

const SearchExample = (props: ISearchExampleProps) => {
  const { label, example, onClick } = props;
  return (
    <Grid templateColumns="1fr 2fr" gap={3} my={1}>
      <Text align="right" fontWeight="semibold" py={2}>
        {label}
      </Text>
      <Box
        sx={{
          borderRadius: '0',
          border: 'var(--chakra-colors-gray-200) 1px dotted',
          _hover: { backgroundColor: 'gray.50' },
          fontWeight: 'normal',
          overflowWrap: 'break-all',
          fontSize: 'sm',
          padding: '2',
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        {example}
      </Box>
    </Grid>
  );
};
