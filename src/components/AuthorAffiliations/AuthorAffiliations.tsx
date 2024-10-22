import { useAuthorAffiliationSearch } from '@/api/author-affiliation/author-affiliation';
import { getAuthorAffiliationSearchParams } from '@/api/author-affiliation/model';
import { IAuthorAffiliationItem, IAuthorAffiliationPayload } from '@/api/author-affiliation/types';
import {
  Alert,
  AlertTitle,
  Box,
  BoxProps,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Select,
  SkeletonText,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBoolean,
  VisuallyHidden,
} from '@chakra-ui/react';
import { assoc, isNil, pathOr } from 'ramda';
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct';
import { ChangeEventHandler, Dispatch, ReactElement, SetStateAction, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthorAffiliationsErrorMessage } from './ErrorMessage';
import { ExportModal } from './ExportModal';
import { countOptions, NONESYMBOL } from './models';
import { AuthorAffStoreProvider, useAuthorAffStore } from './store';
import { IGroupedAuthorAffilationData } from './types';
import { isIADSSearchParams } from '@/utils/common/guards';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { useSearchInfinite } from '@/api/search/search';

export type AuthorAffiliationsProps =
  | (BoxProps & { params: IAuthorAffiliationPayload; query?: IADSApiSearchParams })
  | { params?: IAuthorAffiliationPayload; query: IADSApiSearchParams };

export const AuthorAffiliations = (props: AuthorAffiliationsProps): ReactElement => {
  const { params: initialParams, query, ...boxProps } = props;
  const [params, setParams] = useState<IAuthorAffiliationPayload>(() =>
    getAuthorAffiliationSearchParams(initialParams),
  );

  // get affiliations data, this depends on params.bibcode having items
  const {
    data: affData,
    isLoading,
    isError,
    error,
  } = useAuthorAffiliationSearch(params, {
    enabled: !isNilOrEmpty(params.bibcode),
    useErrorBoundary: true,
    keepPreviousData: true,
  });

  // query for bibcodes, this will only run if we weren't passed params (and we have a query)
  const { data: queryData } = useSearchInfinite(query, {
    enabled: isIADSSearchParams(query) && isNilOrEmpty(params.bibcode),
    useErrorBoundary: true,
  });

  // extract the bibcodes from the search response
  useEffect(() => {
    if (queryData && isNilOrEmpty(params.bibcode)) {
      setParams(
        assoc(
          'bibcode',
          pathOr<IDocsEntity[]>([], ['pages', '0', 'response', 'docs'], queryData).map((d) => d.bibcode),
        ),
      );
    }
  }, [queryData, params.bibcode]);

  return (
    <Box {...boxProps}>
      <ErrorBoundary FallbackComponent={AuthorAffiliationsErrorMessage}>
        <AuthorAffStoreProvider items={affData}>
          <AffForm
            params={params}
            setParams={setParams}
            items={affData}
            isLoading={isLoading}
            isError={isError}
            error={error}
            records={pathOr<number>(0, ['pages', '0', 'response', 'docs', 'length'], queryData)}
          />
        </AuthorAffStoreProvider>
      </ErrorBoundary>
    </Box>
  );
};

interface IAffFormProps {
  params: IAuthorAffiliationPayload;
  setParams: Dispatch<SetStateAction<IAuthorAffiliationPayload>>;
  items: IAuthorAffiliationItem[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  records: number;
}
const AffForm = (props: IAffFormProps) => {
  const setItems = useAuthorAffStore((state) => state.setItems);
  const reset = useAuthorAffStore((state) => state.reset);
  const toggleAll = useAuthorAffStore((state) => state.toggleAll);
  const { params, records, setParams, isLoading } = props;

  // push any new items into store to reset state,
  // this is necessary to sync incoming items with store
  useEffect(() => setItems(props.items), [props.items]);
  const items = useAuthorAffStore((state) => state.items);

  const handleYearChange: ChangeEventHandler<HTMLSelectElement> = (e) =>
    setParams(assoc('numyears', [parseInt(e.currentTarget.value, 10)]));
  const handleAuthorChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setParams(assoc('maxauthor', [parseInt(e.currentTarget.value, 10)]));
  };

  // should disable controls if loading or no items
  const isDisabled = isLoading || items.length === 0;

  return (
    <Box>
      <Heading as="h2" size="md" mt="2">
        {getCaption(items?.length ?? 0, records)}
      </Heading>
      <Text colorScheme="grey">{getSubCaption(params)}</Text>

      <Stack spacing="2" mb="4" mt="2" alignItems={['center', 'flex-end']} flexDirection={['column-reverse', 'row']}>
        <Stack flex="1" spacing="4" direction="row" alignItems="center" mt={['2', 'auto']}>
          {/* Form toggle buttons  */}
          <Button size="xs" variant="ghost" onClick={toggleAll} isDisabled={isDisabled}>
            Toggle All
          </Button>
          <Button size="xs" variant="ghost" onClick={reset} isDisabled={isDisabled}>
            Reset
          </Button>

          <ExportModal isDisabled={isDisabled} />
        </Stack>

        {/* main form area */}
        <VisuallyHidden as="h3" id="modify-form-area">
          Modify Form Parameters
        </VisuallyHidden>
        <Stack
          aria-labelledby="modify-form-area"
          display="flex"
          flexBasis={['auto', '30%']}
          flexDirection={['column', 'row']}
          width={['full', 'auto']}
          alignItems="flex-end"
          gap="2"
        >
          <FormControl>
            <FormLabel>Max Authors</FormLabel>
            <Select onChange={handleAuthorChange} isDisabled={isDisabled} value={params.maxauthor[0]}>
              {countOptions.map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
              <option value="0">all</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Years</FormLabel>
            <Select onChange={handleYearChange} isDisabled={isDisabled} value={params.numyears[0]}>
              {countOptions.map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
              <option value="0">all</option>
            </Select>
          </FormControl>
        </Stack>
      </Stack>
      <TableContainer>
        <Table>
          <Thead>
            <Tr>
              <Th>#</Th>
              <Th>Author</Th>
              <Th>Affiliation(s)</Th>
              <Th>Year(s)</Th>
              <Th>Last Active Date(s)</Th>
            </Tr>
          </Thead>
          <Tbody data-testid="author-aff-table-body">
            {isLoading ? (
              <SkeletonTableRows />
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  <Alert status="warning" justifyContent="center">
                    <AlertTitle>No affiliation data to display</AlertTitle>
                  </Alert>
                </Td>
              </Tr>
            ) : (
              items.map((ctx, idx) => <Row context={ctx} key={`${ctx.authorName}_${idx}`} idx={idx + 1} />)
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const SkeletonTableRows = () => {
  return (
    <>
      <Tr my="2">
        <Td colSpan={5}>
          <SkeletonText h="8" />
        </Td>
      </Tr>
      <Tr my="2">
        <Td colSpan={5}>
          <SkeletonText h="8" />
        </Td>
      </Tr>
      <Tr my="2">
        <Td colSpan={5}>
          <SkeletonText h="8" />
        </Td>
      </Tr>
      <Tr my="2">
        <Td colSpan={5}>
          <SkeletonText h="8" />
        </Td>
      </Tr>
    </>
  );
};

const Row = (props: { context: IGroupedAuthorAffilationData; idx: number }) => {
  const { context: ctx, idx } = props;

  // focused state to style the whole row
  const [isFocused, setIsFocused] = useBoolean(false);

  const state = useAuthorAffStore(useCallback((state) => state.getSelectionState(ctx.authorName), [ctx.authorName]));
  const selectDate = useAuthorAffStore((state) => state.selectDate);
  const toggle = useAuthorAffStore((state) => state.toggle);
  const toggleAff = useAuthorAffStore((state) => state.toggleAff);
  const getHandler = useCallback((idx: number) => () => toggleAff(ctx.authorName, idx), [ctx.authorName]);

  return (
    <Tr onFocus={setIsFocused.on} onBlur={setIsFocused.off} border={isFocused ? `2px solid blue` : `none`}>
      <Td>{idx}</Td>
      <Td>
        <Checkbox
          value={ctx.authorName}
          isChecked={state.selected}
          onChange={() => toggle(ctx.authorName)}
          onFocus={setIsFocused.on}
          onBlur={setIsFocused.off}
        >
          <Tooltip label={ctx.authorName} aria-label={ctx.authorName}>
            <Text isTruncated w="3xs">
              {ctx.authorName}
            </Text>
          </Tooltip>
        </Checkbox>
      </Td>
      <Td>
        <Stack dir="column">
          {ctx.affiliations.map((aff, idx) => (
            <Checkbox
              key={`aff_${aff}_${idx}`}
              isChecked={state.affSelected.includes(idx)}
              onChange={getHandler(idx)}
              isDisabled={!state.selected}
              onFocus={setIsFocused.on}
              onBlur={setIsFocused.off}
            >
              <Tooltip label={aff} aria-label={aff}>
                <Text isTruncated w={['xs', 'sm']}>
                  {aff === NONESYMBOL ? '(none)' : aff}
                </Text>
              </Tooltip>
            </Checkbox>
          ))}
        </Stack>
      </Td>
      <Td>
        <Stack as="ul" dir="column" spacing="2">
          {ctx.years.map((years, idx) => (
            <li key={`years_${years.join(',')}_${idx}`}>
              <Tooltip label={years.join(', ')} aria-label={years.join(', ')}>
                <Text isTruncated width="24">
                  {years.join(', ')}
                </Text>
              </Tooltip>
            </li>
          ))}
        </Stack>
      </Td>
      <Td>
        <>
          <VisuallyHidden as="label" htmlFor={`${ctx.authorName}-last_active_date_select`}>
            Select last active date
          </VisuallyHidden>
          {ctx.lastActiveDate.length === 1 ? (
            <Text>{ctx.lastActiveDate}</Text>
          ) : (
            <Select
              value={state.dateSelected}
              onChange={(e) => selectDate(ctx.authorName, e.currentTarget.value)}
              id={`${ctx.authorName}-last_active_date_select`}
              isDisabled={!state.selected}
              size="xs"
              onFocus={setIsFocused.on}
              onBlur={setIsFocused.off}
            >
              {ctx.lastActiveDate.map((date, idx) => (
                <option key={`lastactivedate_${date}_${idx}`} value={date}>
                  {date}
                </option>
              ))}
            </Select>
          )}
        </>
      </Td>
    </Tr>
  );
};

const getSubCaption = (params: IAuthorAffiliationPayload) => {
  const currentYear = new Date().getFullYear();
  const out = [];

  if (isNil(params)) {
    return null;
  }

  if (isNotNilOrEmpty(params.numyears)) {
    out.push(params.numyears[0] === 0 ? `All years` : `From ${currentYear - params.numyears[0]} to ${currentYear}`);
  }

  if (isNotNilOrEmpty(params.maxauthor)) {
    out.push(
      `${params.maxauthor[0] === 0 ? 'All' : params.maxauthor[0]} author${
        params.maxauthor[0] !== 1 ? 's' : ''
      } from each work`,
    );
  }

  return out.join(' | ');
};

const getCaption = (numAuthors: number, numRecords = 0) => {
  if (isNil(numAuthors) || numAuthors <= 0) {
    return 'Author affiliations form';
  }
  return `Showing affiliation data for ${numAuthors.toLocaleString()} authors (${numRecords} works)`;
};
