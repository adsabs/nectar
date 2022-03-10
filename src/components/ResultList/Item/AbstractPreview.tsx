import { IDocsEntity } from '@api';
import { IconButton } from '@chakra-ui/button';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, Text, VStack } from '@chakra-ui/layout';
import { Collapse } from '@chakra-ui/transition';
import { useGetAbstractPreview } from '@_api/search';
import { useState } from 'react';
import { toast } from 'react-toastify';

export interface IAbstractPreviewProps {
  bibcode: IDocsEntity['bibcode'];
}

const text = {
  error: 'Problem loading abstract preview' as const,
  noAbstract: 'No Abstract' as const,
  hideAbstract: 'Hide Abstract Preview' as const,
  showAbstract: 'Show Abstract Preview' as const,
  seeFullAbstract: 'See full abstract' as const,
};

export const AbstractPreview = ({ bibcode }: IAbstractPreviewProps): React.ReactElement => {
  const [show, setShow] = useState(false);
  const { data, isFetching, isSuccess } = useGetAbstractPreview(
    { bibcode },
    {
      enabled: show,
      keepPreviousData: true,
      onError: () => {
        // show toast notification on error, and close drawer
        toast(text.error, { type: 'error' });
        setShow(false);
      },
    },
  );

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      {isSuccess && (
        <Collapse in={show} animateOpacity>
          <Text fontSize="md" mt={1} dangerouslySetInnerHTML={{ __html: data.docs[0]?.abstract ?? text.noAbstract }} />
        </Collapse>
      )}
      <VStack>
        <IconButton
          aria-label={show ? 'hide abstract' : 'show abstract'}
          onClick={() => setShow(!show)}
          disabled={false}
          variant="unstyled"
          width="fit-content"
          display="flex"
          fontSize="md"
          isLoading={isFetching}
          icon={show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        />
      </VStack>
    </Flex>
  );
};
