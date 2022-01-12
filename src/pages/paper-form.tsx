import { Box, Text, VStack, Grid, GridItem, Stack, Divider } from '@chakra-ui/layout';
import { Button } from '@chakra-ui/button';
import { BibstemPickerSingle, TextInput } from '@components';
import { PaperFormController } from '@controllers/paperformController';
import { PaperFormType, RawPaperFormParams } from '@controllers/paperformController/types';
import { useAPI } from '@hooks';
import { ErrorMessage, Field, FieldProps, Form, Formik } from 'formik';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { curry } from 'ramda';
import { FormControl, FormLabel, FormHelperText, FormErrorMessage } from '@chakra-ui/form-control';
import { Textarea } from '@chakra-ui/textarea';
import { Input } from '@chakra-ui/input';
import { useState, useEffect } from 'react';

type PaperFormState = {
  [PaperFormType.JOURNAL_QUERY]: {
    bibstem?: string;
    year?: string;
    volume?: string;
    pageid?: string;
  };
  [PaperFormType.REFERENCE_QUERY]: {
    reference?: string;
  };
  [PaperFormType.BIBCODE_QUERY]: {
    bibcodes?: string;
  };
};

const PaperForm: NextPage = () => {
  const router = useRouter();
  const { api } = useAPI();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = curry(async (type: PaperFormType, params: RawPaperFormParams) => {
    try {
      const controller = new PaperFormController(type, params, api);
      const query = await controller.getQuery();

      // generate a search url from the query
      void router.push(`/search?${query}`);
    } catch (e) {
      console.error(e);
    }
  });

  return (
    <VStack as="article" spacing={5} my={16}>
      <JournalQueryForm onSubmit={handleSubmit(PaperFormType.JOURNAL_QUERY)} isMounted={isMounted} />
      <ReferenceQueryForm onSubmit={handleSubmit(PaperFormType.REFERENCE_QUERY)} />
      <BibcodeQueryForm onSubmit={handleSubmit(PaperFormType.BIBCODE_QUERY)} />
    </VStack>
  );
};
export default PaperForm;

type SubmitHandler = <T>(params: T) => Promise<void>;

const JournalQueryForm = ({ onSubmit, isMounted }: { onSubmit: SubmitHandler; isMounted: boolean }) => {
  return (
    <Formik<PaperFormState[PaperFormType.JOURNAL_QUERY]>
      initialValues={{ bibstem: '', year: '', volume: '', pageid: '' }}
      onSubmit={(values) => {
        void onSubmit(values);
      }}
    >
      {({ isSubmitting, handleReset, setFieldValue }) => {
        const handleBibstemUpdate = (bibstem: string) => setFieldValue('bibstem', bibstem, false);

        return (
          <VStack
            aria-labelledby="form-title"
            backgroundColor="gray.50"
            borderRadius={5}
            shadow="base"
            padding={5}
            width="full"
            alignItems="start"
          >
            <Text as="h2" fontSize="large" fontWeight="bold" id="journal-search-form">
              Journal Search
            </Text>
            <Text fontSize="sm">
              A bibstem is an abbreviation that the ADS uses to identify a journal. A full list is available here. The
              input field below will autocomplete on our current database of journal names, allowing you to type
              "Astrophysical Journal", for instance, to find the bibstem "ApJ".
            </Text>
            <Divider mb={5} />
            <Form method="POST" action={`/api/paperform/${PaperFormType.JOURNAL_QUERY}`} className="w-full">
              {/* Bibstem picker */}
              <Grid gridColumn={6} gap={4}>
                <GridItem colSpan={6}>
                  {isMounted ? (
                    <BibstemPickerSingle name="bibstem" onItemUpdate={handleBibstemUpdate} />
                  ) : (
                    <Input name="bibstem" label="Publication" />
                  )}
                </GridItem>
                <GridItem colSpan={2}>
                  <Field name="year" as={TextInput} label="Year" />
                  <ErrorMessage name="year" component="div" />
                </GridItem>
                <GridItem colSpan={2}>
                  <Field name="volume" as={TextInput} label="Volume" />
                  <ErrorMessage name="volume" component="div" />
                </GridItem>
                <GridItem colSpan={2}>
                  <Field name="page" as={TextInput} label="Page / ID" />
                  <ErrorMessage name="page" component="div" />
                </GridItem>
              </Grid>
              <Stack direction="row" mt={5}>
                <Button size="sm" isDisabled={isSubmitting} type="submit" isLoading={isSubmitting}>
                  Search
                </Button>
                <Button variant="outline" onClick={handleReset} isDisabled={isSubmitting}>
                  Reset
                </Button>
              </Stack>
            </Form>
          </VStack>
        );
      }}
    </Formik>
  );
};

const ReferenceQueryForm = ({ onSubmit }: { onSubmit: SubmitHandler }) => {
  return (
    <Formik<PaperFormState[PaperFormType.REFERENCE_QUERY]>
      initialValues={{ reference: '' }}
      onSubmit={(values, { setSubmitting }) => {
        void onSubmit(values);
      }}
    >
      {({ isSubmitting, handleReset }) => (
        <Box
          aria-labelledby="form-title"
          backgroundColor="gray.50"
          borderRadius={5}
          shadow="base"
          padding={5}
          width="full"
        >
          <Text as="h2" fontSize="large" fontWeight="bold" id="journal-search-form">
            Reference Query
          </Text>
          <Divider mb={5} />
          <Form method="POST" action={`/api/paperform/${PaperFormType.REFERENCE_QUERY}`}>
            <Field
              name="reference"
              as={TextInput}
              label="Reference"
              helptext={`Enter a full reference string (eg Smith et al 2000, A&A 362, pp. 333-341)`}
            />
            <ErrorMessage name="reference" component="div" />
            <Stack direction="row" mt={5}>
              <Button size="sm" isDisabled={isSubmitting} type="submit" isLoading={isSubmitting}>
                Search
              </Button>
              <Button variant="outline" onClick={handleReset} isDisabled={isSubmitting}>
                Reset
              </Button>
            </Stack>
          </Form>
        </Box>
      )}
    </Formik>
  );
};

const BibcodeQueryForm = ({ onSubmit }: { onSubmit: SubmitHandler }) => {
  return (
    <Formik<PaperFormState[PaperFormType.BIBCODE_QUERY]>
      initialValues={{ bibcodes: '' }}
      onSubmit={(values, { setSubmitting }) => {
        void onSubmit(values);
      }}
    >
      {({ isSubmitting, handleReset }) => (
        <Box
          aria-labelledby="form-title"
          backgroundColor="gray.50"
          borderRadius={5}
          shadow="base"
          padding={5}
          width="full"
        >
          <Text as="h2" fontSize="large" fontWeight="bold" id="journal-search-form">
            Bibliographic Code Query
          </Text>
          <Divider mb={5} />
          <Form method="POST" action={`/api/paperform/${PaperFormType.BIBCODE_QUERY}`}>
            <Field name="bibcodes">
              {({ field, form }: FieldProps) => (
                <FormControl>
                  <FormLabel htmlFor="bibcodes">List of Bibcodes</FormLabel>
                  <Textarea id="bibcodes" {...field} />
                  <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  <FormHelperText>Enter list of Bibcodes (e.g. 1989ApJ...342L..71R), one per line.</FormHelperText>
                </FormControl>
              )}
            </Field>
            <Stack direction="row" mt={5}>
              <Button size="sm" isDisabled={isSubmitting} type="submit" isLoading={isSubmitting}>
                Search
              </Button>
              <Button variant="outline" onClick={handleReset} isDisabled={isSubmitting}>
                Reset
              </Button>
            </Stack>
          </Form>
        </Box>
      )}
    </Formik>
  );
};
