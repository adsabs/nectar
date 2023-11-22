import { Box, Flex, Grid, GridItem, Heading, Text } from '@chakra-ui/react';
import { useStore } from '@store';
import { noop } from '@utils';
import { FC, HTMLAttributes, MouseEventHandler, useMemo } from 'react';
import { examples } from './examples';
import { useIsClient } from '@lib/useIsClient';
import { useIntermediateQuery } from '@lib/useIntermediateQuery';
import { useGTMDispatch } from '@elgorditosalsero/react-gtm-hook';

export interface ISearchExamplesProps extends HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void;
}

export const SearchExamples: FC<ISearchExamplesProps> = (props) => {
  const { onSelect = noop, ...divProps } = props;

  const sendDataToGTM = useGTMDispatch();
  const mode = useStore((state) => state.mode);
  const { appendToQuery } = useIntermediateQuery();

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    const text = e.currentTarget.dataset['text'];

    // Add our text to the end of the query
    appendToQuery(text);

    sendDataToGTM({
      event: 'search_example_click',
      search_example: text,
    });

    // fire select callback
    onSelect();
  };

  // memoize left/right examples
  const [leftExamples, rightExamples] = useMemo(
    () => [
      examples[mode].left.map(({ label, text }) => (
        <SearchExample label={label} example={text} key={label} data-text={text} onClick={handleClick} />
      )),
      examples[mode].right.map(({ label, text }) => (
        <SearchExample label={label} example={text} key={label} data-text={text} onClick={handleClick} />
      )),
    ],
    [mode],
  );

  return (
    <Flex justifyContent="center" direction="column" alignItems="center" {...divProps}>
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

export const SearchExample = (props: ISearchExampleProps) => {
  const { label, example, ...buttonProps } = props;
  const isClient = useIsClient();

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
          _hover: { backgroundColor: isClient ? 'gray.50' : 'transparent' },
          fontWeight: 'normal',
          overflowWrap: 'break-all',
          padding: '2',
          display: 'flex',
          justifyContent: 'center',
          cursor: isClient ? 'pointer' : 'default',
        }}
        className="search-example"
        {...buttonProps}
      >
        {example}
      </Box>
    </Grid>
  );
};
