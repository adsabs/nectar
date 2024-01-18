import { useGetAbstractPreview } from '@api';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Collapse,
  Flex,
  IconButton,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { MathJax } from 'better-react-mathjax';
import { useState } from 'react';

export const ItemAnnotation = ({ bibcode }: { bibcode: string }) => {
  const [show, setShow] = useState(false);

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      <Collapse in={show} animateOpacity>
        <Tabs variant="enclosed" size="sm" mt={2}>
          <TabList>
            <Tab>Annotation</Tab>
            <Tab>Abstract</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Annotation bibcode={bibcode} />
            </TabPanel>
            <TabPanel>
              <Abstract bibcode={bibcode} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Collapse>
      <VStack>
        <IconButton
          aria-label={show ? 'hide abstract' : 'show abstract'}
          onClick={() => setShow(!show)}
          disabled={false}
          variant="unstyled"
          width="fit-content"
          display="flex"
          fontSize="md"
          icon={show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        />
      </VStack>
    </Flex>
  );
};

const Annotation = ({ bibcode }: { bibcode: string }) => {
  return (
    <Flex direction="column">
      <Textarea />
      <Flex direction="row" justifyContent="start" gap={1} mt={2}>
        <Button type="submit" size="xs">
          Submit
        </Button>
        <Button type="reset" variant="outline" size="xs">
          Reset
        </Button>
      </Flex>
    </Flex>
  );
};

const Abstract = ({ bibcode }: { bibcode: string }) => {
  const { data, isFetching, error } = useGetAbstractPreview({ bibcode });

  return (
    <>
      {isFetching ? (
        <Spinner />
      ) : (
        <Text
          as={MathJax}
          fontSize="md"
          mt={1}
          dangerouslySetInnerHTML={{
            __html: error ? 'Error fetching abstract' : data.docs[0]?.abstract ?? 'No Abstract',
          }}
          wordBreak="break-word"
        />
      )}
    </>
  );
};
