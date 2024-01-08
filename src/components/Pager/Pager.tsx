import { forwardRef, HTMLAttributes, ReactNode, useState } from 'react';
import {
  Box,
  ButtonProps,
  Flex,
  Heading,
  Icon,
  IconButton,
  keyframes,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  TabProps,
  Tabs,
  useMultiStyleConfig,
  useTab,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

type PageContext = {
  page: number;
  title: ReactNode;
  next: () => void;
  prev: () => void;
};

type Page = {
  uniqueId: string;
  title?: ReactNode;
  content: ReactNode | ((pageContext: PageContext) => ReactNode);
};

export interface IPagerProps extends HTMLAttributes<HTMLDivElement> {
  pages: Page[];
  arrowMargin?: string;
}

const changePage = (noOfPages: number, direction: 'next' | 'prev') => (page: number) => {
  if (page === 0 && direction === 'prev') {
    return noOfPages - 1;
  }
  if (page === noOfPages - 1 && direction === 'next') {
    return 0;
  }
  return direction === 'next' ? page + 1 : page - 1;
};

export const Pager = (props: IPagerProps) => {
  const { pages, arrowMargin = '200px', ...divProps } = props;
  const [selectedPage, setSelectedPage] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [shouldWiggle, setShouldWiggle] = useState(false);

  const next = () => setSelectedPage(changePage(pages.length, 'next'));
  const prev = () => setSelectedPage(changePage(pages.length, 'prev'));
  const handlePageChange = (page: number) => setSelectedPage(page);

  const title =
    typeof pages[selectedPage].title === 'string' ? (
      <Heading as="h3" size="md" mt={3} mb={5}>
        {pages[selectedPage].title}
      </Heading>
    ) : typeof pages[selectedPage].title === 'undefined' ? null : (
      pages[selectedPage].title
    );

  return (
    <div data-testid="pager" {...divProps}>
      <Tabs
        index={selectedPage}
        onChange={handlePageChange}
        isLazy
        align="center"
        variant="unstyled"
        onMouseDown={() => setInteracted(true)}
        onMouseEnter={() => setShouldWiggle(true)}
        onMouseLeave={() => setShouldWiggle(false)}
        onFocus={() => setShouldWiggle(true)}
        onBlur={() => setShouldWiggle(false)}
      >
        <Flex direction="row" alignItems="flex-start">
          <Box mt={arrowMargin}>
            <ChangePageButton direction="previous" onClick={prev} />
          </Box>
          <Flex direction="column" alignItems="center">
            {title}
            <TabPanels>
              {pages.map((page, index) => (
                <TabPanel key={page.uniqueId} alignContent="center" minW="2xl" w="2xl">
                  {typeof page.content === 'function'
                    ? page.content({ page: index, title: page.title, next, prev })
                    : page.content}
                </TabPanel>
              ))}
            </TabPanels>
          </Flex>
          <Box mt={arrowMargin}>
            <ChangePageButton
              direction="next"
              onClick={next}
              wiggle={!interacted && shouldWiggle && selectedPage === 0}
            />
          </Box>
        </Flex>
        <TabList>
          {pages.map((page) => (
            <DotTab key={page.uniqueId}>{page.title}</DotTab>
          ))}
        </TabList>
      </Tabs>
    </div>
  );
};

const wiggle = keyframes`
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }

  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
`;
const ChangePageButton = (props: ButtonProps & { direction: 'next' | 'previous'; wiggle?: boolean }) => {
  const { direction, ...buttonProps } = props;
  return (
    <IconButton
      {...buttonProps}
      aria-label={`goto ${direction} page`}
      title={`goto ${direction} page`}
      icon={<Icon as={direction === 'next' ? ChevronRightIcon : ChevronLeftIcon} fontSize="5xl" />}
      variant="ghost"
      colorScheme="black"
      _hover={{ animation: 'none' }}
      _focus={{ animation: 'none' }}
      animation={props.wiggle ? `${wiggle} 2s cubic-bezier(0.455, 0.030, 0.515, 0.955) infinite` : undefined}
      animationDelay={props.wiggle ? '2s' : undefined}
    />
  );
};

const DotTab = forwardRef<HTMLButtonElement, TabProps>((props, ref) => {
  const tabProps = useTab({ ...props, ref });
  const isSelected = !!tabProps['aria-selected'];

  const styles = useMultiStyleConfig('Tabs', tabProps);

  return (
    <Tab __css={styles.tab} {...tabProps}>
      {isSelected ? '●' : '○'}
    </Tab>
  );
});
