import { useGetSearchFacetJSON } from '@/api/search/search';
import { FacetField, IADSApiSearchParams } from '@/api/search/types';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { useDisclosure, Skeleton, Table, Tbody, Tr, Td, Text, Stack } from '@chakra-ui/react';
import { CustomInfoMessage } from '../Feedbacks';
import { getSearchFacetParams } from '../SearchFacet/useGetFacetData';
import { SimpleLink } from '../SimpleLink';
import { makeJournalSearchLink, searchFacetDefaultParams } from './helpers';
import { ViewJournalsModal } from './ViewJournalsModal';

export const JournalsTable = ({ query }: { query: IADSApiSearchParams }) => {
  // Journals data should have database facet applied
  const { data, isError, isLoading, error } = useGetSearchFacetJSON({
    ...query,
    filter: [],
    field: 'pub' as FacetField,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      field: 'pub' as FacetField,
      level: 'root',
      limit: 100,
    }),
  });

  const colors = useColorModeColors();

  const { isOpen, onOpen, onClose } = useDisclosure(); // view journals list

  const handleViewMoreJournals = () => {
    onOpen();
  };

  const JournalTableSkeleton = (
    <Stack>
      <Skeleton height="25px" />
      <Skeleton height="25px" />
      <Skeleton height="25px" />
      <Skeleton height="25px" />
      <Skeleton height="25px" />
    </Stack>
  );

  return (
    <>
      {isLoading ? (
        JournalTableSkeleton
      ) : isError ? (
        <CustomInfoMessage status="error" alertTitle="Error fetching top journals" description={parseAPIError(error)} />
      ) : (
        <>
          <Table variant="simple" size="sm">
            <Tbody>
              {data?.pub.buckets.slice(0, 5).map((pub, index) => (
                <Tr key={pub.val} cursor="pointer">
                  <Td width="20px">{index + 1}</Td>
                  <Td>
                    <SimpleLink href={makeJournalSearchLink(query, pub.val as string)} newTab>
                      {pub.val as string}
                    </SimpleLink>
                  </Td>
                  <Td isNumeric>{kFormatNumber(pub.count)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {data.pub.numBuckets > 5 && (
            <Text
              fontSize="sm"
              color={colors.link}
              cursor="pointer"
              fontWeight="bold"
              onClick={() => handleViewMoreJournals()}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewMoreJournals();
                }
              }}
              my={4}
            >
              View more <ArrowForwardIcon boxSize={5} aria-hidden />
            </Text>
          )}
          <ViewJournalsModal data={data.pub.buckets} query={query} isOpen={isOpen} onClose={onClose} />
        </>
      )}
    </>
  );
};
