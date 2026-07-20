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
import { searchFacetDefaultParams } from './helpers';
import { ViewFacetFieldModal } from './ViewFacetFieldModal';

export const FacetFieldTable = ({
  label,
  query,
  facetField,
  makeSearchLink,
}: {
  label: string;
  query: IADSApiSearchParams;
  facetField: FacetField;
  makeSearchLink: (facetVal: string) => string;
}) => {
  const { data, isError, isLoading, error } = useGetSearchFacetJSON({
    ...query,
    filter: [],
    field: facetField,
    ['json.facet']: getSearchFacetParams({
      ...searchFacetDefaultParams,
      field: facetField,
      level: 'root',
      limit: 100,
    }),
  });

  const colors = useColorModeColors();

  const { isOpen, onOpen, onClose } = useDisclosure(); // view full list

  const handleViewMore = () => {
    onOpen();
  };

  const TableSkeleton = (
    <Stack gap={0}>
      <Skeleton height="15px" my="8px" />
      <Skeleton height="15px" my="8px" />
      <Skeleton height="15px" my="8px" />
      <Skeleton height="15px" my="8px" />
      <Skeleton height="15px" my="8px" />
      <Skeleton height="15px" my="8px" />
    </Stack>
  );

  if (data?.count === 0) {
    return <CustomInfoMessage status="info" alertTitle={`No ${label} found`} />;
  }

  return (
    <>
      {isLoading ? (
        TableSkeleton
      ) : isError ? (
        <CustomInfoMessage status="error" alertTitle={`Error fetching data`} description={parseAPIError(error)} />
      ) : (
        <>
          <Table variant="simple" size="sm">
            <Tbody>
              {data?.[facetField].buckets.slice(0, 5).map((f, index) => (
                <Tr key={f.val} cursor="pointer">
                  <Td width="20px">{index + 1}</Td>
                  <Td>
                    <SimpleLink href={makeSearchLink(f.val as string)} newTab>
                      {f.val as string}
                    </SimpleLink>
                  </Td>
                  <Td isNumeric>{kFormatNumber(f.count)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {data[facetField].numBuckets > 5 && (
            <Text
              fontSize="sm"
              color={colors.link}
              cursor="pointer"
              fontWeight="bold"
              onClick={() => handleViewMore()}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleViewMore();
                }
              }}
              my={4}
            >
              View more <ArrowForwardIcon boxSize={5} aria-hidden />
            </Text>
          )}
          <ViewFacetFieldModal
            label={label}
            data={data[facetField].buckets}
            makeSearchLink={makeSearchLink}
            isOpen={isOpen}
            onClose={onClose}
          />
        </>
      )}
    </>
  );
};
