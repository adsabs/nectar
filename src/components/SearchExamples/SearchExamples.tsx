import { Box, Flex, Grid, GridItem, Heading, Text } from '@chakra-ui/layout';
import { useAppCtx } from '@store';
import { FC, HTMLAttributes, MouseEventHandler, useMemo } from 'react';
import { examples } from './examples';

export interface ISearchExamplesProps {
  onClick?(text: string): void;
  className?: HTMLAttributes<HTMLDivElement>['className'];
}

export const SearchExamples: FC<ISearchExamplesProps> = ({ onClick }) => {
  const { state: appState } = useAppCtx();

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (typeof onClick === 'function') {
      onClick(e.currentTarget.dataset['text']);
    }
    return undefined;
  };

  const [leftExamples, rightExamples] = useMemo(
    () => [
      examples[appState.theme].left.map(({ label, text }) => (
        <SearchExample label={label} example={text} key={label} data-text={text} onClick={handleClick} />
      )),
      examples[appState.theme].right.map(({ label, text }) => (
        <SearchExample label={label} example={text} key={label} data-text={text} onClick={handleClick} />
      )),
    ],
    [appState.theme],
  );

  return (
    <Flex justifyContent="center" direction="column" alignItems="center">
      <Heading as="h3" size="md" mt={3} mb={5}>
        Search Examples
      </Heading>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5}>
        <GridItem>{leftExamples}</GridItem>
        <GridItem>{rightExamples}</GridItem>
      </Grid>
    </Flex>
  );
};

interface ISearchExampleProps extends HTMLAttributes<HTMLElement> {
  label: string;
  example: string;
}

const SearchExample = (props: ISearchExampleProps) => {
  const { label, example, ...buttonProps } = props;
  return (
    <Grid templateColumns="1fr 2fr" gap={3} my={1}>
      <Text align="right" fontWeight="semibold" py={2}>
        {label}
      </Text>
      <Box
        as="button"
        type="button"
        sx={{
          borderRadius: '0',
          border: 'var(--chakra-colors-gray-200) 1px dotted',
          _hover: { backgroundColor: 'gray.50' },
          fontWeight: 'normal',
          overflowWrap: 'break-all',
          padding: '2',
          display: 'flex',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        {...buttonProps}
      >
        {example}
      </Box>
    </Grid>
  );
};
