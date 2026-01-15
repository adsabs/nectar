import { getAuthorAffiliationSearchParams } from '@/api/author-affiliation/model';
import { IAuthorAffiliationPayload } from '@/api/author-affiliation/types';
import {
  Alert,
  AlertTitle,
  Box,
  BoxProps,
  Checkbox,
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
} from '@chakra-ui/react';
import { ReactElement, Reducer, useCallback, useReducer } from 'react';
import { NONESYMBOL } from './models';
import { AuthorAffStoreProvider, useAuthorAffStore } from './store';
import { IADSApiSearchParams } from '@/api/search/types';
import { IGroupedAuthorAffilationData } from './types';
import { AuthorAffiliationsErrorMessage, errorMessages } from '@/components/AuthorAffiliations/ErrorMessage';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { useFetchAffData } from '@/components/AuthorAffiliations/hooks/UseFetchAffData';
import { AffiliationControls } from '@/components/AuthorAffiliations/AffiliationControls';
import { useSubCaption } from '@/components/AuthorAffiliations/hooks/UseSubCaption';

/** ---------- Types & constants ---------- */

export type AffTableState = {
  maxAuthors: number;
  numYears: number;
};

export type AffTableAction = { type: 'setMaxAuthors'; payload: number } | { type: 'setNumYears'; payload: number };

export type AuthorAffiliationsProps =
  | (BoxProps & { params: IAuthorAffiliationPayload; query?: IADSApiSearchParams; ssrError?: string })
  | { params?: IAuthorAffiliationPayload; query: IADSApiSearchParams };

const DEFAULT_PARAMS = getAuthorAffiliationSearchParams();

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

/** ---------- Table ---------- */

const AffiliationTable = (props: { query: IADSApiSearchParams; formState: AffTableState }) => {
  const { query, formState } = props;
  const { isLoading, error, isError } = useFetchAffData(query, formState);
  const items = useAuthorAffStore((s) => s.items);

  if (
    isError &&
    // TODO: (refactor) this will be unnecessary when the service returns empty array instead of error
    parseAPIError(error) !== errorMessages.noResults
  ) {
    return <AuthorAffiliationsErrorMessage error={error} />;
  }

  return (
    <TableContainer overflowX="auto">
      <Table size="sm" minW="600px">
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
          <Td data-testid="skeleton-row">
            <Skeleton h="3" w="20" />
          </Td>
          <Td data-testid="skeleton-row">
            <Skeleton h="3" w="20" />
          </Td>
          <Td data-testid="skeleton-row">
            <Skeleton h="3" w="40" />
          </Td>
          <Td data-testid="skeleton-row">
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
          aria-label={`select author ${ctx.authorName}`}
        >
          <Tooltip label={ctx.authorName} aria-label={ctx.authorName}>
            <Text isTruncated w={{ base: '24', md: '3xs' }}>
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
              aria-label={`select affiliation ${aff} for author ${ctx.authorName}`}
            >
              <Tooltip label={aff} aria-label={aff}>
                <Text isTruncated w={{ base: '28', sm: 'xs', md: 'sm' }}>
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
                <Text isTruncated w={{ base: '16', md: '24' }}>
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
        {Array.isArray(ctx.lastActiveDate) && ctx.lastActiveDate.length === 1 ? (
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
            data-testid="last-active-date-select"
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
