import { CustomFormat, DEFAULT_USER_DATA, ExportApiJournalFormat, IADSApiUserDataResponse, UserDataKeys } from '@api';
import { getVaultData } from '@auth-utils';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  FormControl,
  FormLabel,
  Stack,
  useToast,
} from '@chakra-ui/react';
import {
  absExportFormatDescription,
  bibtexExportFormatDescription,
  customFormatDescription,
  CustomFormatTable,
  DescriptionCollapse,
  ExportFormat,
  exportFormatDescription,
  exportFormats,
  journalFormats,
  JournalFormatSelect,
  journalNameHandlingDescription,
  KeyFormatInputApply,
  maxAuthorDescription,
  NumberSlider,
  Select,
  SettingsLayout,
} from '@components';
import { useSettings } from '@hooks/useSettings';
import { createStore, useStoreApi } from '@store';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { values } from 'ramda';
import { Reducer, useEffect, useMemo, useReducer } from 'react';
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

// generate options for select component
const useGetOptions = () => {
  return {
    formatOptions: values(exportFormats),
    journalFormatOptions: values(journalFormats),
  };
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

  const { formatOptions } = useGetOptions();

  useEffect(() => dispatch({ type: 'CLEAR' }), []);

  // get selected values for the form
  const selectedValues = useMemo(() => {
    const data = userData ?? DEFAULT_USER_DATA;
    const defaultExportFormatOption = formatOptions.find((option) => option.label === data.defaultExportFormat);
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
      journalFormat,
      bibtexExportKeyFormat,
      bibtexMaxAuthor,
      bibtexAuthorCutoff,
      bibtexAbsExportKeyFormat,
      bibtexAbsMaxAuthor,
      bibtexAbsAuthorCutoff,
    };
  }, [userData, formatOptions]);

  /** apply changes */

  // default export format
  const handleApplyDefaultExportFormat = (format: ExportFormat) => {
    dispatch({ type: 'SET_DEFAULT_EXPORT_FORMAT', payload: format.label });
  };

  // custom formats handlers
  const handleEditCustomFormat = (id: string, name: string, code: string) => {
    dispatch({
      type: 'EDIT_CUSTOM_FORMAT',
      payload: { currentFormats: userData.customFormats, id, name, code },
    });
  };

  // delete cutom format
  const handleDeleteCustomFormat = (id: string) => {
    dispatch({
      type: 'DELETE_CUSTOM_FORMAT',
      payload: { currentFormats: userData.customFormats, id },
    });
  };

  // add custom format
  const handleAddCustomFormat = (name: string, code: string) => {
    dispatch({
      type: 'ADD_CUSTOM_FORMAT',
      payload: { currentFormats: userData.customFormats, name, code },
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
    <SettingsLayout title="Export Settings">
      <Stack direction="column" spacing={5} p={5} my={5} boxShadow="md">
        <DescriptionCollapse body={exportFormatDescription} label="Default Export Format">
          {({ btn, content }) => (
            <FormControl>
              <Select<ExportFormat>
                name="format"
                label={
                  <Box mb="2">
                    <FormLabel htmlFor="default-export-format-selector" fontSize={['sm', 'md']}>
                      {'Default Export Format'} {btn}
                    </FormLabel>
                    {content}
                  </Box>
                }
                hideLabel={false}
                id="default-export-format-selector"
                options={formatOptions}
                value={selectedValues.defaultExportFormatOption}
                onChange={handleApplyDefaultExportFormat}
                stylesTheme="default"
              />
            </FormControl>
          )}
        </DescriptionCollapse>
        <DescriptionCollapse body={customFormatDescription} label="Custom Formats">
          {({ btn, content }) => (
            <FormControl>
              <Box mb="2">
                <FormLabel htmlFor="custom-formats" fontSize={['sm', 'md']}>
                  {'Custom Formats'} {btn}
                </FormLabel>
                {content}
              </Box>
              <CustomFormatTable
                customFormats={userData?.customFormats}
                onAdd={handleAddCustomFormat}
                onModify={handleEditCustomFormat}
                onDelete={handleDeleteCustomFormat}
              />
            </FormControl>
          )}
        </DescriptionCollapse>
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
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton pl={0} _hover={{ backgroundColor: 'transparent' }}>
              <Box fontWeight="bold">BibTeX Default Export Max Author (Advanced)</Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              {maxAuthorDescription}
              <Stack direction="column" p={5}>
                <NumberSlider
                  min={1}
                  max={500}
                  value={selectedValues.bibtexAuthorCutoff}
                  onChange={handleApplyBibtexAuthorCutoff}
                  label="Author Cutoff"
                />
                <NumberSlider
                  min={1}
                  max={500}
                  value={selectedValues.bibtexMaxAuthor}
                  onChange={handleApplyBibtexMaxAuthors}
                  label="Max Authors"
                />
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        <KeyFormatInputApply
          format={selectedValues.bibtexAbsExportKeyFormat}
          label="BibTeX ABS Default Export Key Format"
          description={absExportFormatDescription}
          onApply={handleApplyBibtexAbsExportKeyFormat}
        />
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton pl={0} _hover={{ backgroundColor: 'transparent' }}>
              <Box fontWeight="bold">BibTeX Default Export Max Author (Advanced)</Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              {maxAuthorDescription}
              <Stack direction="column" p={5}>
                <NumberSlider
                  min={1}
                  max={500}
                  value={selectedValues.bibtexAbsAuthorCutoff}
                  onChange={handleApplyBibtexAbsAuthorCutoff}
                  label="Author Cutoff"
                />
                <NumberSlider
                  min={1}
                  max={500}
                  value={selectedValues.bibtexAbsMaxAuthor}
                  onChange={handleApplyBibtexAbsMaxAuthors}
                  label="Max Authors"
                />
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Stack>
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