import { getVaultData } from '@auth-utils';
import {
  CustomFormat,
  fetchSearch,
  getSearchParams,
  IADSApiSearchParams,
  IADSApiUserDataResponse,
  JournalFormatName,
  searchKeys,
  UserDataKeys,
  useSearch,
} from '@api';
import { Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from '@chakra-ui/react';
import { BibtexTabPanel, CustomFormatsTabPanel, exportFormats, GeneralTabPanel, SettingsLayout } from '@components';
import { useSettings } from '@hooks/useSettings';
import { useStore } from '@store';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import { Reducer, useEffect, useMemo, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dehydrate, QueryClient } from 'react-query';
import { omit, pathOr, values } from 'ramda';
import { DEFAULT_USER_DATA } from '@components/Settings/model';
import { composeNextGSSP } from '@ssrUtils';

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

const ExportSettingsPage: NextPage = () => {
  const toast = useToast({ duration: 2000 });

  // params used to update user data
  const [params, dispatch] = useReducer(reducer, {});

  // when params change, query will be called to update the user settings
  useSettings({
    params,
    onSuccess: () => {
      toast({ title: 'updated!', status: 'success' });
    },
    onError: (error) => toast({ status: 'error', description: error }),
  });

  const userSettings = useStore((state) => state.settings.user) ?? DEFAULT_USER_DATA;

  useEffect(() => dispatch({ type: 'CLEAR' }), []);

  // get selected values for the form
  const defaultExportFormatOption = useMemo(
    () => exportFormatOptions.find((option) => option.label === userSettings.defaultExportFormat),
    [userSettings],
  );

  // fetch the sample bibcode
  const sampleBibParams = getSearchParams({ q: 'bibstem:ApJ author_count:[10 TO 20]', rows: 1 });
  const { data } = useSearch(sampleBibParams);
  const sampleBib = pathOr<string>(null, ['docs', '0', 'bibcode'], data);

  return (
    <SettingsLayout title="Export Settings" maxW={{ base: 'container.sm', lg: 'container.lg' }}>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>General</Tab>
          <Tab>Custom Formats</Tab>
          <Tab>BibTeX</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <GeneralTabPanel
              sampleBib={sampleBib}
              selectedOption={defaultExportFormatOption}
              dispatch={dispatch}
              // onChange={handleApplyDefaultExportFormat}
            />
          </TabPanel>
          <TabPanel>
            <CustomFormatsTabPanel sampleBib={sampleBib} dispatch={dispatch} />
          </TabPanel>
          <TabPanel>
            <BibtexTabPanel sampleBib={sampleBib} dispatch={dispatch} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SettingsLayout>
  );
};

export default ExportSettingsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
  if (!ctx.req.session.isAuthenticated) {
    return Promise.resolve({
      redirect: {
        destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
        permanent: false,
      },
      props: {},
    });
  }

  const userData = await getVaultData();

  // get a sample doc
  const params = getSearchParams({ q: 'bibstem:ApJ author_count:[10 TO 20]', rows: 1 });
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: searchKeys.primary(params),
    queryHash: JSON.stringify(searchKeys.primary(omit(['fl'], params) as IADSApiSearchParams)),
    queryFn: fetchSearch,
    meta: { params },
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      dehydratedAppState: {
        settings: {
          user: userData,
        },
      },
    },
  };
});
