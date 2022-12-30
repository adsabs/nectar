import { IADSApiSearchParams, IDocsEntity, useSearchInfinite } from '@api';
import { useAuthorAffiliationSearch } from '@api/author-affiliation/author-affiliation';
import { IAuthorAffiliationItem, IAuthorAffiliationPayload } from '@api/author-affiliation/types';
import {
  Box,
  BoxProps,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Skeleton,
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
import PT from 'prop-types';
import { assoc, isNil, pathOr, range } from 'ramda';
import { isNilOrEmpty, isNotNilOrEmpty } from 'ramda-adjunct';
import { ChangeEventHandler, Dispatch, ReactElement, SetStateAction, useCallback, useEffect, useState } from 'react';
import { ExportModal } from './ExportModal';
import { countOptions, defaultParams, NONESYMBOL } from './models';
import { AuthorAffStoreProvider, useAuthorAffStore } from './store';
import { IGroupedAuthorAffilationData } from './types';

export interface IAuthorAffiliationsProps extends BoxProps {
  params: IAuthorAffiliationPayload;
  query?: IADSApiSearchParams;
  records: number;
}

const propTypes = {
  children: PT.element,
};

export const AuthorAffiliations = (props: IAuthorAffiliationsProps): ReactElement => {
  const { params: initialParams, query, records = 0, ...boxProps } = props;
  const [params, setParams] = useState<IAuthorAffiliationPayload>(() => ({ ...defaultParams, ...initialParams }));
  const { data: queryData } = useSearchInfinite(query);

  const {
    data: affData,
    isLoading,
    isError,
    error,
  } = useAuthorAffiliationSearch(params, {
    enabled: params.bibcode?.length > 0,
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
      <AuthorAffStoreProvider items={affData}>
        <AffForm
          params={params}
          setParams={setParams}
          items={affData}
          isLoading={isLoading}
          isError={isError}
          error={error}
          records={records}
        />
      </AuthorAffStoreProvider>
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

  // push any new items into store to reset state
  useEffect(() => setItems(props.items), [props.items]);
  const items = useAuthorAffStore((state) => state.items);

  const handleYearChange: ChangeEventHandler<HTMLSelectElement> = (e) =>
    setParams(assoc('numyears', [parseInt(e.currentTarget.value, 10)]));
  const handleAuthorChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setParams(assoc('maxauthor', [parseInt(e.currentTarget.value, 10)]));
  };

  return (
    <Box>
      <Heading as="h2" size="md" mt="2">
        {getCaption(items?.length ?? 0, records)}
      </Heading>
      <Text colorScheme="grey">{getSubCaption(params)}</Text>

      <Stack spacing="2" mb="4" mt="2" alignItems={['center', 'flex-end']} flexDirection={['column-reverse', 'row']}>
        <Stack flex="1" spacing="4" direction="row" alignItems="center" mt={['2', 'auto']}>
          {/* Form toggle buttons  */}
          <Button size="xs" variant="ghost" onClick={toggleAll} isDisabled={isLoading}>
            Toggle All
          </Button>
          <Button size="xs" variant="ghost" onClick={reset} isDisabled={isLoading}>
            Reset
          </Button>

          <ExportModal isDisabled={isLoading} />
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
            <Select onChange={handleAuthorChange} isDisabled={isLoading} value={params.maxauthor[0]}>
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
            <Select onChange={handleYearChange} isDisabled={isLoading} value={params.numyears[0]}>
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
          <Tbody>
            {isLoading ? (
              <SkeletonTableRows />
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
  const rows = range(0, 4);
  return (
    <>
      {rows.map((i) => (
        <Tr key={`skeleton_row_${i}`} my="2">
          <Td colSpan={5}>
            <Skeleton>
              <SkeletonText h="8" />
            </Skeleton>
          </Td>
        </Tr>
      ))}
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
    <Tr
      onFocus={setIsFocused.on}
      onBlur={setIsFocused.off}
      backgroundColor={state.selected ? undefined : 'gray.100'}
      border={isFocused ? `2px solid blue` : `none`}
    >
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
                <Text
                  isTruncated
                  w={['xs', 'sm']}
                  color={state.selected && state.affSelected.includes(idx) ? 'black' : 'blackAlpha.700'}
                >
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
                <Text isTruncated width="24" color={state.selected ? 'black' : 'blackAlpha.400'}>
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

AuthorAffiliations.propTypes = propTypes;
