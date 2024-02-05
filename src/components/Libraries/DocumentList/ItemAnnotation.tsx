import {
  LibraryIdentifier,
  useAddAnnotation,
  useDeleteAnnotation,
  useGetAbstractPreview,
  useUpdateAnnotation,
} from '@api';
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
  useToast,
  VStack,
} from '@chakra-ui/react';
import { parseAPIError } from '@utils';
import { MathJax } from 'better-react-mathjax';
import { ChangeEvent, useState } from 'react';

export const ItemAnnotation = ({
  library,
  bibcode,
  note,
  onUpdate,
}: {
  library: LibraryIdentifier;
  bibcode: string;
  note: string;
  onUpdate: () => void;
}) => {
  const [show, setShow] = useState(false);

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      <Collapse in={show} animateOpacity>
        <Tabs variant="enclosed" size="sm" mt={2} isLazy={true}>
          <TabList>
            <Tab>Annotation</Tab>
            <Tab data-testid="abstract-tab">Abstract</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {show && <Annotation library={library} bibcode={bibcode} note={note} onUpdate={onUpdate} />}
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

const Annotation = ({
  library,
  bibcode,
  note,
  onUpdate,
}: {
  library: LibraryIdentifier;
  bibcode: string;
  note: string;
  onUpdate: () => void;
}) => {
  const { mutate: deleteNote, isLoading: isDeleting } = useDeleteAnnotation();

  const { mutate: addNote, isLoading: isAdding } = useAddAnnotation();

  const { mutate: updateNode, isLoading: isUpdating } = useUpdateAnnotation();

  const [noteValue, setNoteValue] = useState(note);

  const isLoading = isDeleting || isAdding || isUpdating;

  const toast = useToast({
    duration: 2000,
  });

  const handleNoteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteValue(e.target.value);
  };

  const handleSubmit = () => {
    if (note.length > 0 && noteValue.length === 0) {
      // delete note
      deleteNote(
        { library, bibcode },
        {
          onSettled(data, error) {
            if (error) {
              toast({
                status: 'error',
                title: parseAPIError(error),
              });
            } else {
              toast({
                status: 'success',
                title: 'Annotation deleted',
              });
            }
            onUpdate();
          },
        },
      );
    } else if (note.length === 0 && noteValue.length > 0) {
      // add note
      addNote(
        { library, bibcode, content: noteValue },
        {
          onSettled(data, error) {
            if (error) {
              toast({
                status: 'error',
                title: parseAPIError(error),
              });
            } else {
              toast({
                status: 'success',
                title: 'Annotation added',
              });
            }
            onUpdate();
          },
        },
      );
    } else if (note.length > 0 && noteValue.length > 0) {
      // update note
      updateNode(
        { library, bibcode, content: noteValue },
        {
          onSettled(data, error) {
            if (error) {
              toast({
                status: 'error',
                title: parseAPIError(error),
              });
            } else {
              toast({
                status: 'success',
                title: 'Annotation updated',
              });
            }
            onUpdate();
          },
        },
      );
    }
  };

  const handleReset = () => {
    setNoteValue(note);
  };

  return (
    <Flex direction="column">
      <Flex direction="column" data-testid="annotation">
        <Textarea value={noteValue} onChange={handleNoteChange} />
        <Flex direction="row" justifyContent="start" gap={1} mt={2}>
          <Button size="xs" onClick={handleSubmit} disabled={noteValue === note} isLoading={isLoading} type="submit">
            Submit
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={handleReset}
            disabled={noteValue === note || isLoading}
            type="reset"
          >
            Reset
          </Button>
        </Flex>
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
