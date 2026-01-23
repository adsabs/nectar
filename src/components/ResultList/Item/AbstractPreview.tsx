import { Collapse, Flex, IconButton, Text, Tooltip, useToast, VStack } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { SafeAbstract } from '@/components/SafeAbstract';
import { ReactElement, useState } from 'react';
import { IDocsEntity } from '@/api/search/types';
import { useGetAbstractPreview } from '@/api/search/search';

export interface IAbstractPreviewProps {
  bibcode: IDocsEntity['bibcode'];
}

const text = {
  error: 'Problem loading abstract preview' as const,
  noAbstract: 'No Abstract' as const,
};

export const AbstractPreview = ({ bibcode }: IAbstractPreviewProps): ReactElement => {
  const [show, setShow] = useState(false);
  const toast = useToast();
  const { data, isFetching, isSuccess } = useGetAbstractPreview(
    { bibcode },
    {
      enabled: show,
      keepPreviousData: true,
      onError: () => {
        // show toast notification on error, and close drawer
        toast({ status: 'error', description: text.error });
        setShow(false);
      },
    },
  );

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      {isSuccess && (
        <Collapse in={show} animateOpacity>
          {data.docs[0]?.abstract ? (
            <SafeAbstract html={data.docs[0].abstract} fontSize="md" mt={1} wordBreak="break-word" />
          ) : (
            <Text fontSize="md" mt={1}>
              {text.noAbstract}
            </Text>
          )}
        </Collapse>
      )}
      <VStack>
        <Tooltip label={show ? 'Hide abstract' : 'Show abstract'}>
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
            id="tour-view-abstract"
          />
        </Tooltip>
      </VStack>
    </Flex>
  );
};
