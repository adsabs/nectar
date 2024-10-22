import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import {
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

import { MathJax } from 'better-react-mathjax';
import { ChangeEvent, useState } from 'react';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { LibraryIdentifier } from '@/api/biblib/types';
import { useAddAnnotation, useDeleteAnnotation, useUpdateAnnotation } from '@/api/biblib/libraries';
import { useGetAbstractPreview } from '@/api/search/search';

export const ItemAnnotation = ({
  library,
  bibcode,
  note,
  showNote,
  onUpdate,
  canEdit = false,
  open,
  onOpen,
  onClose,
}: {
  library: LibraryIdentifier;
  bibcode: string;
  showNote: boolean;
  note?: string;
  canEdit?: boolean;
  onUpdate: () => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) => {
  // const [show, setShow] = useState(open);

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      <Collapse in={open} animateOpacity>
        {showNote ? (
          <Tabs variant="enclosed" size="sm" mt={2} isLazy={true}>
            <TabList>
              <Tab>Annotation</Tab>
              <Tab data-testid="abstract-tab">Abstract</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {open && (
                  <Annotation library={library} bibcode={bibcode} note={note} onUpdate={onUpdate} canEdit={canEdit} />
                )}
              </TabPanel>
              <TabPanel>
                <Abstract bibcode={bibcode} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          <Abstract bibcode={bibcode} />
        )}
      </Collapse>
      <VStack>
        <IconButton
          aria-label={open ? 'hide abstract' : 'show abstract'}
          onClick={() => (open ? onClose() : onOpen())}
          disabled={false}
          variant="unstyled"
          width="fit-content"
          display="flex"
          fontSize="md"
          icon={open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        />
      </VStack>
    </Flex>
  );
};

const Annotation = ({
  library,
  bibcode,
  note = '',
  onUpdate,
  canEdit,
}: {
  library: LibraryIdentifier;
  bibcode: string;
  note: string;
  onUpdate: () => void;
  canEdit: boolean;
}) => {
  const { mutate: deleteNote, isLoading: isDeleting } = useDeleteAnnotation();

  const { mutate: addNote, isLoading: isAdding } = useAddAnnotation();

  const { mutate: updateNode, isLoading: isUpdating } = useUpdateAnnotation();

  const [noteValue, setNoteValue] = useState(note);

  const [isEditing, setIsEditing] = useState(false);

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
            setIsEditing(false);
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
            setIsEditing(false);
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
            setIsEditing(false);
            onUpdate();
          },
        },
      );
    }
  };

  const handleCancel = () => {
    setNoteValue(note);
    setIsEditing(false);
  };

  const { lightText } = useColorModeColors();

  return (
    <Flex direction="column">
      <Flex direction="column" data-testid="annotation">
        {isEditing ? (
          <Textarea
            value={noteValue}
            onChange={handleNoteChange}
            placeholder="Annotation can be seen by all collaborators. Collaborators with write permission can make changes to annotations."
          />
        ) : (
          <>
            {!!noteValue && noteValue.trim().length > 0 ? (
              <Text>{noteValue}</Text>
            ) : (
              <Text color={lightText} fontWeight="light" fontStyle="italic">
                No annotations.{' '}
                {canEdit ? (
                  <>Click the edit icon to add one.</>
                ) : (
                  <>Collaborators with write permission can add annotations.</>
                )}
              </Text>
            )}
          </>
        )}
        {canEdit && (
          <Flex direction="row" justifyContent="start" gap={1} mt={2}>
            {!isEditing ? (
              <IconButton
                aria-label="add/edit annotation"
                onClick={() => setIsEditing(true)}
                isLoading={isLoading}
                variant="outline"
                icon={<EditIcon />}
              />
            ) : (
              <>
                <IconButton
                  aria-label="submit"
                  type="submit"
                  onClick={handleSubmit}
                  isDisabled={noteValue === note}
                  isLoading={isLoading}
                  colorScheme="green"
                  variant="outline"
                  icon={<CheckIcon />}
                />
                <IconButton
                  aria-label="cancel"
                  onClick={handleCancel}
                  colorScheme="red"
                  variant="outline"
                  isDisabled={isLoading}
                  icon={<CloseIcon />}
                />
              </>
            )}
          </Flex>
        )}
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
          data-testid="anno-abstract"
        />
      )}
    </>
  );
};
