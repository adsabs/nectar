import { getAuthorAffiliationSearchParams } from '@/api/author-affiliation/model';
import { IAuthorAffiliationPayload } from '@/api/author-affiliation/types';
import {
  Alert,
  AlertTitle,
  Box,
  BoxProps,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Skeleton,
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
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { isNil, pathOr, pluck } from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import {
  ChangeEventHandler,
  Dispatch,
  ReactElement,
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { ExportModal } from './ExportModal';
import { countOptions, NONESYMBOL } from './models';
import { AuthorAffStoreProvider, useAuthorAffStore } from './store';
import { isIADSSearchParams } from '@/utils/common/guards';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { useSearch } from '@/api/search/search';
import { useAuthorAffiliationSearch } from '@/api/author-affiliation/author-affiliation';
import { IGroupedAuthorAffilationData } from './types';
import { AuthorAffiliationsErrorMessage, errorMessages } from '@/components/AuthorAffiliations/ErrorMessage';
import { parseAPIError } from '@/utils/common/parseAPIError';

/** ---------- Types & constants ---------- */

type AffTableState = {
  maxAuthors: number;
  numYears: number;
};

type AffTableAction = { type: 'setMaxAuthors'; payload: number } | { type: 'setNumYears'; payload: number };

export type AuthorAffiliationsProps =
  | (BoxProps & { params: IAuthorAffiliationPayload; query?: IADSApiSearchParams; ssrError?: string })
  | { params?: IAuthorAffiliationPayload; query: IADSApiSearchParams };

const DEFAULT_PARAMS = getAuthorAffiliationSearchParams();

/** ---------- Hooks ---------- */

const useBibcodesFromQuery = (query: IADSApiSearchParams) => {
  return useSearch(query, {
    enabled: isIADSSearchParams(query),
    useErrorBoundary: true,
    select: (data) => {
      if (isNil(data)) {
        return [];
      }
      const docs = pathOr<IDocsEntity[]>([], ['response', 'docs'], data);
      return isNotNilOrEmpty(docs) ? pluck('bibcode', docs) : [];
    },
  });
};

const useSubCaption = (state: AffTableState) => {
  return useMemo(() => {
    if (!state) {
      return null;
    }
    const { maxAuthors, numYears } = state;
    const currentYear = new Date().getFullYear();
    const parts: string[] = [];

    if (isNotNilOrEmpty(numYears)) {
      parts.push(numYears === 0 ? 'All years' : `From ${currentYear - numYears} to ${currentYear}`);
    }
    if (isNotNilOrEmpty(maxAuthors)) {
      parts.push(`${maxAuthors === 0 ? 'All' : maxAuthors} author${maxAuthors !== 1 ? 's' : ''} from each work`);
    }
    return parts.join(' | ');
  }, [state]);
};

/** ---------- Reducer ---------- */

const reducer: Reducer<AffTableState, AffTableAction> = (state, action) => {
  switch (action.type) {
    case 'setMaxAuthors':
      return { ...state, maxAuthors: action.payload };
    case 'setNumYears':
      return { ...state, numYears: action.payload };
    default:
      return state;
  }
};

/** ---------- Header ---------- */

const AffiliationHeader = ({ formState }: { formState: AffTableState }) => {
  const items = useAuthorAffStore((s) => s.items);
  const caption =
    !items || items.length === 0
      ? 'Author affiliations form'
      : `Showing affiliation data for ${items.length.toLocaleString()} authors`;
  const sub = useSubCaption(formState);

  return (
    <>
      <Heading as="h2" size="md" mt="2" id="author-affiliation-title">
        {caption}
      </Heading>
      <Text color="gray.500">{sub}</Text>
    </>
  );
};

/** ---------- Controls (left: actions, right: selects) ---------- */

const AffiliationControls = ({
  formState,
  dispatch,
}: {
  formState: AffTableState;
  dispatch: Dispatch<AffTableAction>;
}) => {
  const isDisabled = useAuthorAffStore((s) => s.isLoading || s.items.length === 0);
  const reset = useAuthorAffStore((s) => s.reset);
  const toggleAll = useAuthorAffStore((s) => s.toggleAll);

  const handleYearChange: ChangeEventHandler<HTMLSelectElement> = (e) =>
    dispatch({ type: 'setNumYears', payload: Number(e.currentTarget.value) });

  const handleAuthorChange: ChangeEventHandler<HTMLSelectElement> = (e) =>
    dispatch({ type: 'setMaxAuthors', payload: Number(e.currentTarget.value) });

  return (
    <section aria-labelledby="modify-form-area" id="author-affiliation-content">
      <VisuallyHidden as="h3" id="modify-form-area">
        Modify Form Parameters
      </VisuallyHidden>

      {/* Mobile: column; md+: row spaced */}
      <Flex
        mt="2"
        mb="4"
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={3}
      >
        {/* Left: action buttons */}
        <Stack direction="row" align="center">
          <Button size="xs" variant="ghost" onClick={toggleAll} isDisabled={isDisabled}>
            Toggle All
          </Button>
          <Button size="xs" variant="ghost" onClick={reset} isDisabled={isDisabled}>
            Reset
          </Button>
          <ExportModal isDisabled={isDisabled} />
        </Stack>

        {/* Right: selects; Wrap keeps them tidy at small widths */}
        <Wrap spacing="12px" justify={{ base: 'flex-start', md: 'flex-end' }}>
          <WrapItem>
            <FormControl minW="180px">
              <FormLabel>Max Authors</FormLabel>
              <Select onChange={handleAuthorChange} value={String(formState.maxAuthors)}>
                {countOptions.map((count) => (
                  <option value={count} key={count}>
                    {count}
                  </option>
                ))}
                <option value="0">All Authors</option>
              </Select>
            </FormControl>
          </WrapItem>
          <WrapItem>
            <FormControl minW="160px">
              <FormLabel>Years</FormLabel>
              <Select onChange={handleYearChange} value={String(formState.numYears)}>
                {countOptions.map((count) => (
                  <option value={count} key={count}>
                    {count}
                  </option>
                ))}
                <option value="0">All Years</option>
              </Select>
            </FormControl>
          </WrapItem>
        </Wrap>
      </Flex>
    </section>
  );
};

const useFetchAffData = (query: IADSApiSearchParams, formState: AffTableState) => {
  const setItems = useAuthorAffStore((s) => s.setItems);
  const setIsLoading = useAuthorAffStore((s) => s.setIsLoading);

  const { data: bibcode } = useBibcodesFromQuery(query);

  const {
    data: items,
    isLoading,
    error,
    isError,
  } = useAuthorAffiliationSearch(
    getAuthorAffiliationSearchParams({ maxauthor: [formState.maxAuthors], numyears: [formState.numYears], bibcode }),
    { enabled: isNotNilOrEmpty(bibcode) },
  );

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);
  useEffect(() => {
    if (isNotNilOrEmpty(items)) {
      setItems(items);
    }
  }, [items, setItems]);

  return { isLoading, error, isError };
};

/** ---------- Table ---------- */

const AffiliationTable = (props: { query: IADSApiSearchParams; formState: AffTableState }) => {
  const { query, formState } = props;
  const { isLoading, error, isError } = useFetchAffData(query, formState);
  const items = useAuthorAffStore((s) => s.items);

  if (isError && parseAPIError(error) !== errorMessages.noResults) {
    return <AuthorAffiliationsErrorMessage error={error} />;
  }

  return (
    <TableContainer>
      <Table size="sm">
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
                  <AlertTitle>No affiliation data to display, please refine your search</AlertTitle>
                </Alert>
              </Td>
            </Tr>
          ) : (
            items.map((ctx, idx) => <Row context={ctx} key={`${ctx.authorName}_${idx}`} idx={idx + 1} />)
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

/** ---------- Root ---------- */

export const AuthorAffiliations = (props: AuthorAffiliationsProps): ReactElement => {
  const { query, ...boxProps } = props as { query: IADSApiSearchParams } & BoxProps;

  const [formState, dispatch] = useReducer(reducer, {
    maxAuthors: DEFAULT_PARAMS.maxauthor[0],
    numYears: DEFAULT_PARAMS.numyears[0],
  });

  return (
    <Box {...boxProps}>
      <AuthorAffStoreProvider items={[]} isLoading={true}>
        <AffiliationHeader formState={formState} />
        <AffiliationControls formState={formState} dispatch={dispatch} />
        <AffiliationTable formState={formState} query={query} />
      </AuthorAffStoreProvider>
    </Box>
  );
};

/** ---------- Skeleton Rows ---------- */

const SkeletonTableRows = () => {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Tr key={i}>
          <Td>{i + 1}</Td>
          <Td>
            <Skeleton h="3" w="20" />
          </Td>
          <Td>
            <Skeleton h="3" w="20" />
          </Td>
          <Td>
            <Skeleton h="3" w="40" />
          </Td>
          <Td>
            <Skeleton h="3" w="20" />
          </Td>
        </Tr>
      ))}
    </>
  );
};

/** ---------- Data Row ---------- */

const Row = (props: { context: IGroupedAuthorAffilationData; idx: number }) => {
  const { context: ctx, idx } = props;

  const [isFocused, setIsFocused] = useBoolean(false);

  const state = useAuthorAffStore(useCallback((s) => s.getSelectionState(ctx.authorName), [ctx.authorName]));
  const selectDate = useAuthorAffStore((s) => s.selectDate);
  const toggle = useAuthorAffStore((s) => s.toggle);
  const toggleAff = useAuthorAffStore((s) => s.toggleAff);

  const getHandler = useCallback(
    (affIdx: number) => () => toggleAff(ctx.authorName, affIdx),
    [ctx.authorName, toggleAff],
  );

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
        <Stack direction="column">
          {ctx.affiliations.map((aff, i) => (
            <Checkbox
              key={`aff_${aff}_${i}`}
              isChecked={state.affSelected.includes(i)}
              onChange={getHandler(i)}
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
        <Stack as="ul" direction="column" spacing="2">
          {ctx.years.map((years, i) => (
            <li key={`years_${years.join(',')}_${i}`}>
              <Tooltip label={years.join(', ')} aria-label={years.join(', ')}>
                <Text isTruncated w="24">
                  {years.join(', ')}
                </Text>
              </Tooltip>
            </li>
          ))}
        </Stack>
      </Td>
      <Td>
        <VisuallyHidden as="label" htmlFor={`${ctx.authorName}-last_active_date_select`}>
          Select last active date
        </VisuallyHidden>
        {ctx.lastActiveDate.length === 1 ? (
          <Text>{ctx.lastActiveDate[0]}</Text>
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
            {ctx.lastActiveDate.map((date, i) => (
              <option key={`lastactivedate_${date}_${i}`} value={date}>
                {date}
              </option>
            ))}
          </Select>
        )}
      </Td>
    </Tr>
  );
};
