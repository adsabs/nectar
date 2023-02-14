import { getVaultData } from '@auth-utils';
import {
  CustomFormat,
  DEFAULT_USER_DATA,
  ExportApiFormatKey,
  ExportApiJournalFormat,
  getSearchParams,
  IADSApiUserDataResponse,
  useGetExportCitation,
  UserDataKeys,
  useSearch,
} from '@api';
import { FormControl, FormLabel, Stack, useToast, Grid, Textarea } from '@chakra-ui/react';
import {
  absExportFormatDescription,
  bibtexExportFormatDescription,
  ExportFormat,
  JournalFormatSelect,
  journalNameHandlingDescription,
  KeyFormatInputApply,
  MaxAuthorForm,
  SettingsLayout,
} from '@components';
import { useSettings } from '@hooks/useSettings';
import { createStore } from '@store';
import { CustomFormatsTable } from '@components/Settings/Export/CustomFormatsTable';
import { exportFormatOptions, ExportFormatSelect } from '@components/Settings/Export/ExportFormatSelect';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { memo, Reducer, useEffect, useMemo, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

// partial user data params
// used to update user data
type UserDataSetterState = Partial<IADSApiUserDataResponse>;

// TODO: is it over engineering to use reducer here?
type UserDataSetterEvent =
  | { type: 'SET_DEFAULT_EXPORT_FORMAT'; payload: string }
  | { type: 'ADD_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; name: string; code: string } }
  | { type: 'EDIT_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; id: string; name: string; code: string } }
  | { type: 'DELETE_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; id: string } }
  | { type: 'SORT_CUSTOM_FORMAT'; payload: CustomFormat[] }
  | { type: 'SET_BIBTEX_KEY_FORMAT'; payload: string }
  | { type: 'SET_BIBTEX_MAX_AUTHORS'; payload: string }
  | { type: 'SET_BIBTEX_AUTHORS_CUTOFF'; payload: string }
  | { type: 'SET_BIBTEX_ABS_KEY_FORMAT'; payload: string }
  | { type: 'SET_BIBTEX_ABS_MAX_AUTHORS'; payload: string }
  | { type: 'SET_BIBTEX_ABS_AUTHORS_CUTOFF'; payload: string }
  | { type: 'SET_JOURNAL_NAME_HANDLING'; payload: string }
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
    case 'SET_BIBTEX_KEY_FORMAT':
      return { [UserDataKeys.BIBTEXT_FORMAT]: action.payload ?? '' };
    case 'SET_BIBTEX_MAX_AUTHORS':
      return { [UserDataKeys.BIBTEXT_MAX_AUTHORS]: action.payload };
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

// TODO: this needs to be better
const JournalFormatMap: Record<string, ExportApiJournalFormat> = {
  'Use AASTeX macros': ExportApiJournalFormat.AASTeXMacros,
  'Use Journal Abbreviations': ExportApiJournalFormat.Abbreviations,
  'Use Full Journal Name': ExportApiJournalFormat.FullName,
};

const ExportSettingsPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const toast = useToast();

  // params used to update user data
  const [params, dispatch] = useReducer(reducer, {});

  const { settings: userData } = useSettings({
    params,
    onSuccess: () => {
      toast({ title: 'updated!' });
    },
    onError: (error) => toast({ status: 'error', description: error }),
  });

  useEffect(() => dispatch({ type: 'CLEAR' }), []);

  // get selected values for the form
  const selectedValues = useMemo(() => {
    const data = userData ?? DEFAULT_USER_DATA;
    const defaultExportFormatOption = exportFormatOptions.find((option) => option.label === data.defaultExportFormat);
    const customFormats = data.customFormats;
    const journalFormat = JournalFormatMap[data.bibtexJournalFormat];
    const bibtexExportKeyFormat = data.bibtexKeyFormat;
    // not allowing max author to be 'all' now
    const bibtexMaxAuthor =
      data.bibtexMaxAuthors === 'All' ? parseInt(DEFAULT_USER_DATA.bibtexMaxAuthors) : parseInt(data.bibtexMaxAuthors);
    const bibtexAuthorCutoff = parseInt(data.bibtexAuthorCutoff);
    const bibtexAbsExportKeyFormat = data.bibtexABSKeyFormat;
    const bibtexAbsMaxAuthor =
      data.bibtexABSMaxAuthors === 'All'
        ? parseInt(DEFAULT_USER_DATA.bibtexABSMaxAuthors)
        : parseInt(data.bibtexABSMaxAuthors);
    const bibtexAbsAuthorCutoff = parseInt(data.bibtexABSAuthorCutoff);

    return {
      defaultExportFormatOption,
      customFormats,
      journalFormat,
      bibtexExportKeyFormat,
      bibtexMaxAuthor,
      bibtexAuthorCutoff,
      bibtexAbsExportKeyFormat,
      bibtexAbsMaxAuthor,
      bibtexAbsAuthorCutoff,
    };
  }, [userData]);

  // fetch a sample doc
  const { data: sampleDocSearch } = useSearch(getSearchParams({ q: 'bibstem:ApJ author_count:[10 TO 20]', rows: 1 }));
  const sampleDoc = useMemo(() => {
    if (sampleDocSearch) {
      return sampleDocSearch.docs[0];
    }
  }, [sampleDocSearch]);

  // fetch sample citation
  const { data: sampleCitation } = useGetExportCitation(
    {
      format: (selectedValues.defaultExportFormatOption?.value as ExportApiFormatKey) ?? ExportApiFormatKey.bibtex,
      customFormat: selectedValues.customFormats?.[0]?.code ?? '', // used if format is custom format
      bibcode: [sampleDoc?.bibcode],
      keyformat: [selectedValues.bibtexExportKeyFormat],
      journalformat: [selectedValues.journalFormat],
      authorcutoff: [selectedValues.bibtexAuthorCutoff],
      maxauthor: [selectedValues.bibtexMaxAuthor],
    },
    { enabled: !!sampleDoc && !!selectedValues },
  );

  /** apply changes */

  // default export format
  const handleApplyDefaultExportFormat = (format: ExportFormat) => {
    dispatch({ type: 'SET_DEFAULT_EXPORT_FORMAT', payload: format.label });
  };

  // custom formats handlers
  const handleEditCustomFormat = (id: string, name: string, code: string) => {
    dispatch({
      type: 'EDIT_CUSTOM_FORMAT',
      payload: { currentFormats: selectedValues.customFormats, id, name, code },
    });
  };

  // delete cutom format
  const handleDeleteCustomFormat = (id: string) => {
    dispatch({
      type: 'DELETE_CUSTOM_FORMAT',
      payload: { currentFormats: selectedValues.customFormats, id },
    });
  };

  // add custom format
  const handleAddCustomFormat = (name: string, code: string) => {
    dispatch({
      type: 'ADD_CUSTOM_FORMAT',
      payload: { currentFormats: selectedValues.customFormats, name, code },
    });
  };

  // sort custom format, from Id over to
  const handleShiftCustomFormat = (fromId: string, toId: string) => {
    const customFormats = JSON.parse(JSON.stringify(selectedValues.customFormats)) as CustomFormat[];
    const fromPos = customFormats.findIndex((f) => f.id === fromId);
    const fromFormat = customFormats[fromPos];
    const toPos = customFormats.findIndex((f) => f.id === toId);
    customFormats.splice(fromPos, 1);
    customFormats.splice(toPos, 0, fromFormat);

    dispatch({
      type: 'SORT_CUSTOM_FORMAT',
      payload: customFormats,
    });
  };

  // TeX Journal Name Handling
  const handleApplyJournalNameHandling = (format: ExportApiJournalFormat) => {
    const formatName = Object.entries(JournalFormatMap).find(([key, value]) => value === format)[0];
    dispatch({ type: 'SET_JOURNAL_NAME_HANDLING', payload: formatName });
  };

  // default export key format
  const handleApplyBibtexExportKeyFormat = (format: string) => {
    dispatch({ type: 'SET_BIBTEX_KEY_FORMAT', payload: format });
  };

  // Bibtex max authors
  const handleApplyBibtexMaxAuthors = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_MAX_AUTHORS', payload: value.toString() });
  };

  // Bibtex author cutoff
  const handleApplyBibtexAuthorCutoff = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_AUTHORS_CUTOFF', payload: value.toString() });
  };

  // default export key format
  const handleApplyBibtexAbsExportKeyFormat = (format: string) => {
    dispatch({ type: 'SET_BIBTEX_ABS_KEY_FORMAT', payload: format });
  };

  // Bibtex max authors
  const handleApplyBibtexAbsMaxAuthors = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_ABS_MAX_AUTHORS', payload: value.toString() });
  };

  // Bibtex author cutoff
  const handleApplyBibtexAbsAuthorCutoff = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_ABS_AUTHORS_CUTOFF', payload: value.toString() });
  };

  return (
    <SettingsLayout title="Export Settings" maxW={{ base: 'container.sm', lg: 'container.lg' }}>
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
        <Stack direction="column">
          <Stack direction="column" spacing={5} p={5} my={5} boxShadow="md">
            <ExportFormatSelect
              selectedOption={selectedValues.defaultExportFormatOption}
              onChange={handleApplyDefaultExportFormat}
            />
            <CustomFormatsTable
              customFormats={selectedValues.customFormats}
              onAdd={handleAddCustomFormat}
              onModify={handleEditCustomFormat}
              onDelete={handleDeleteCustomFormat}
              onShiftPosition={handleShiftCustomFormat}
            />
          </Stack>
          <Stack direction="column" spacing={5} p={5} my={5} boxShadow="md">
            <JournalFormatSelect
              journalformat={[selectedValues.journalFormat]}
              onChange={handleApplyJournalNameHandling}
              label="TeX Journal Name Handling"
              description={journalNameHandlingDescription}
            />
            <KeyFormatInputApply
              format={selectedValues.bibtexExportKeyFormat}
              description={bibtexExportFormatDescription}
              label="BibTeX Default Export Key Format"
              onApply={handleApplyBibtexExportKeyFormat}
            />
            <MaxAuthorForm
              label="BibTeX Default Export Max Author (Advanced)"
              maxAuthorMin={1}
              maxAuthorMax={500}
              maxAuthorValue={selectedValues.bibtexMaxAuthor}
              cutoffMin={1}
              cutoffMax={500}
              cutoffValue={selectedValues.bibtexAuthorCutoff}
              onChangeCutoff={handleApplyBibtexAuthorCutoff}
              onChangeMaxAuthor={handleApplyBibtexMaxAuthors}
            />
            <KeyFormatInputApply
              format={selectedValues.bibtexAbsExportKeyFormat}
              label="BibTeX ABS Default Export Key Format"
              description={absExportFormatDescription}
              onApply={handleApplyBibtexAbsExportKeyFormat}
            />
            <MaxAuthorForm
              label="BibTeX ABS Default Export Max Author (Advanced)"
              maxAuthorMin={1}
              maxAuthorMax={500}
              maxAuthorValue={selectedValues.bibtexAbsMaxAuthor}
              cutoffMin={1}
              cutoffMax={500}
              cutoffValue={selectedValues.bibtexAbsAuthorCutoff}
              onChangeCutoff={handleApplyBibtexAbsAuthorCutoff}
              onChangeMaxAuthor={handleApplyBibtexAbsMaxAuthors}
            />
          </Stack>
        </Stack>
        <SampleTextArea value={sampleCitation?.export ?? ''} />
      </Grid>
    </SettingsLayout>
  );
};

const SampleTextArea = memo(
  ({ value }: { value: string }) => {
    return (
      <FormControl display={{ base: 'none', lg: 'initial' }}>
        <FormLabel>Sample Default Export</FormLabel>
        <Textarea value={value} isReadOnly h="lg" borderRadius="md" />
      </FormControl>
    );
  },
  (prev, next) => prev.value === next.value || next.value === '',
);

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

  const userData = await getVaultData(ctx);
  const initialState = createStore().getState();

  return {
    props: {
      userData,
      dehydratedAppState: {
        settings: {
          ...initialState.settings,
          user: userData,
        },
      },
    },
  };
}, userGSSP);
