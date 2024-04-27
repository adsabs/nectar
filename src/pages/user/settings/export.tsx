import {
  CustomFormat,
  fetchSearch,
  fetchUserSettings,
  getSearchParams,
  IADSApiSearchParams,
  IADSApiUserDataResponse,
  JournalFormatName,
  searchKeys,
  UserDataKeys,
  userKeys,
  useSearch,
} from '@/api';
import { Spinner, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { BibtexTabPanel, CustomFormatsTabPanel, exportFormats, GeneralTabPanel, SettingsLayout } from '@/components';
import { useSettings } from '@/lib/useSettings';
import { GetServerSideProps, NextPage } from 'next';
import { Reducer, Suspense, useEffect, useMemo, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dehydrate, QueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { omit, pathOr, values } from 'ramda';
import { composeNextGSSP } from '@/ssr-utils';
import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import { isNotEmpty } from 'ramda-adjunct';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';

// partial user data params
// used to update user data
type UserDataSetterState = Partial<IADSApiUserDataResponse>;

export type UserDataSetterEvent =
  | { type: 'SET_DEFAULT_EXPORT_FORMAT'; payload: string }
  | { type: 'ADD_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; name: string; code: string } }
  | { type: 'EDIT_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; id: string; name: string; code: string } }
  | { type: 'DELETE_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; id: string } }
  | { type: 'SORT_CUSTOM_FORMAT'; payload: CustomFormat[] }
  | { type: 'SET_ALL_BIBTEX_KEY_FORMAT'; payload: string }
  | { type: 'SET_ALL_BIBTEX_MAX_AUTHORS'; payload: string }
  | { type: 'SET_ALL_BIBTEX_SETTINGS'; payload: { keyFormat: string; maxAuthors: string; cutoff: string } }
  | { type: 'SET_BIBTEX_KEY_FORMAT'; payload: string }
  | { type: 'SET_BIBTEX_MAX_AUTHORS'; payload: string }
  | { type: 'SET_BIBTEX_AUTHORS_CUTOFF'; payload: string }
  | { type: 'SET_BIBTEX_ABS_KEY_FORMAT'; payload: string }
  | { type: 'SET_BIBTEX_ABS_MAX_AUTHORS'; payload: string }
  | { type: 'SET_BIBTEX_ABS_AUTHORS_CUTOFF'; payload: string }
  | { type: 'SET_JOURNAL_NAME_HANDLING'; payload: JournalFormatName }
  | { type: 'CLEAR' };

const reducer: Reducer<UserDataSetterState, UserDataSetterEvent> = (state, action) => {
  switch (action.type) {
    case 'SET_DEFAULT_EXPORT_FORMAT':
      return { [UserDataKeys.DEFAULT_EXPORT_FORMAT]: action.payload };
    case 'ADD_CUSTOM_FORMAT':
      return {
        [UserDataKeys.CUSTOM_FORMATS]: [
          ...action.payload.currentFormats,
          { id: `format-${uuidv4()}`, name: action.payload.name, code: action.payload.code },
        ],
      };
    case 'EDIT_CUSTOM_FORMAT':
      const i = action.payload.currentFormats.findIndex((f) => f.id === action.payload.id);
      return {
        [UserDataKeys.CUSTOM_FORMATS]: [
          ...action.payload.currentFormats.slice(0, i),
          { id: action.payload.id, name: action.payload.name, code: action.payload.code },
          ...action.payload.currentFormats.slice(i + 1),
        ],
      };
    case 'DELETE_CUSTOM_FORMAT':
      return {
        [UserDataKeys.CUSTOM_FORMATS]: action.payload.currentFormats.filter((f) => f.id !== action.payload.id),
      };
    case 'SORT_CUSTOM_FORMAT':
      return {
        [UserDataKeys.CUSTOM_FORMATS]: action.payload,
      };
    case 'SET_ALL_BIBTEX_KEY_FORMAT':
      return { [UserDataKeys.BIBTEX_FORMAT]: action.payload ?? '', [UserDataKeys.ABS_FORMAT]: action.payload ?? '' };
    case 'SET_ALL_BIBTEX_MAX_AUTHORS':
      return {
        [UserDataKeys.BIBTEX_MAX_AUTHORS]: action.payload,
        [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: action.payload,
        [UserDataKeys.ABS_MAX_AUTHORS]: action.payload,
        [UserDataKeys.ABS_AUTHOR_CUTOFF]: action.payload,
      };
    case 'SET_ALL_BIBTEX_SETTINGS':
      return {
        [UserDataKeys.BIBTEX_FORMAT]: action.payload.keyFormat,
        [UserDataKeys.BIBTEX_MAX_AUTHORS]: action.payload.maxAuthors,
        [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: action.payload.cutoff,
        [UserDataKeys.ABS_FORMAT]: action.payload.keyFormat,
        [UserDataKeys.ABS_MAX_AUTHORS]: action.payload.maxAuthors,
        [UserDataKeys.ABS_AUTHOR_CUTOFF]: action.payload.cutoff,
      };
    case 'SET_BIBTEX_KEY_FORMAT':
      return { [UserDataKeys.BIBTEX_FORMAT]: action.payload ?? '' };
    case 'SET_BIBTEX_MAX_AUTHORS':
      return { [UserDataKeys.BIBTEX_MAX_AUTHORS]: action.payload };
    case 'SET_BIBTEX_AUTHORS_CUTOFF':
      return { [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: action.payload };
    case 'SET_BIBTEX_ABS_KEY_FORMAT':
      return { [UserDataKeys.ABS_FORMAT]: action.payload ?? '' };
    case 'SET_BIBTEX_ABS_MAX_AUTHORS':
      return { [UserDataKeys.ABS_MAX_AUTHORS]: action.payload };
    case 'SET_BIBTEX_ABS_AUTHORS_CUTOFF':
      return { [UserDataKeys.ABS_AUTHOR_CUTOFF]: action.payload };
    case 'SET_JOURNAL_NAME_HANDLING':
      return { [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: action.payload };
    case 'CLEAR':
    default:
      return {};
  }
};

const exportFormatOptions = values(exportFormats);

export const Page: NextPage = () => {
  return (
    <SettingsLayout title="Export Settings" maxW={{ base: 'container.sm', lg: 'container.lg' }}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={getFallBackAlert({
              status: 'error',
              label: 'Unable to load user settings',
            })}
          >
            <Suspense fallback={<Spinner />}>
              <ExportSettings />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </SettingsLayout>
  );
};

const ExportSettings = () => {
  // params used to update user data
  const [params, dispatch] = useReducer(reducer, {});

  // when params change, query will be called to update the user settings
  const { updateSettings, settings: userSettings } = useSettings();

  useEffect(() => {
    if (isNotEmpty(params)) {
      updateSettings(params);
    }
  }, [params, updateSettings]);

  useEffect(() => dispatch({ type: 'CLEAR' }), []);

  // get selected values for the form
  const defaultExportFormatOption = useMemo(
    () => exportFormatOptions.find((option) => option.label === userSettings.defaultExportFormat),
    [userSettings],
  );

  // fetch the sample bibcode
  const sampleBibParams = getSearchParams({ q: 'bibstem:ApJ author_count:[10 TO 20]', rows: 1 });
  const { data } = useSearch(sampleBibParams, { suspense: true });
  const sampleBib = pathOr<string>(null, ['docs', '0', 'bibcode'], data);

  return (
    <Tabs variant="enclosed">
      <TabList>
        <Tab>Default Format</Tab>
        <Tab>Custom Formats</Tab>
        <Tab>BibTeX</Tab>
      </TabList>
      <TabPanels>
        <TabPanel px={{ base: 0, sm: '2' }}>
          <GeneralTabPanel sampleBib={sampleBib} selectedOption={defaultExportFormatOption} dispatch={dispatch} />
        </TabPanel>
        <TabPanel px={{ base: 0, sm: '2' }}>
          <CustomFormatsTabPanel sampleBib={sampleBib} dispatch={dispatch} />
        </TabPanel>
        <TabPanel px={{ base: 0, sm: '2' }}>
          <BibtexTabPanel sampleBib={sampleBib} dispatch={dispatch} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default Page;
export const getServerSideProps: GetServerSideProps = composeNextGSSP(async () => {
  try {
    // get a sample doc
    const params = getSearchParams({ q: 'bibstem:ApJ author_count:[10 TO 20]', rows: 1 });
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
      queryKey: searchKeys.primary(params),
      queryHash: JSON.stringify(searchKeys.primary(omit(['fl'], params) as IADSApiSearchParams)),
      queryFn: fetchSearch,
      meta: { params },
    });

    await queryClient.prefetchQuery({
      queryKey: userKeys.getUserSettings(),
      queryFn: fetchUserSettings,
    });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (error) {
    logger.error({ msg: 'GSSP error on export settings page', error });
    return {
      props: {
        pageError: parseAPIError(error),
      },
    };
  }
});
