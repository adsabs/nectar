import { fetchVaultSearch, vaultKeys } from '@api';
import { fetchReferenceText, referenceKeys } from '@api/reference/reference';
import { getVaultBigQueryParams } from '@api/vault/models';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { BibstemPicker } from '@components';
import { useIsClient } from '@lib/useIsClient';
import { composeNextGSSP } from '@ssr-utils';
import { stringifySearchParams } from '@utils';
import DOMPurify from 'isomorphic-dompurify';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { any, head, isEmpty, join, map, not, omit, pipe, reject, toPairs, values } from 'ramda';
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

enum PaperFormType {
  JOURNAL_QUERY = 'journal-query',
  REFERENCE_QUERY = 'reference-query',
  BIBCODE_QUERY = 'bibcode-query',
}

export interface PaperFormParams {
  // journal-query
  bibstem: string;
  year: string;
  volume: string;
  page: string;

  // reference-query
  reference: string;

  // bibcode-query
  bibcodes: string[];
}

export type RawPaperFormParams = {
  [Property in keyof PaperFormParams]: string;
};

type PaperFormState = {
  [PaperFormType.JOURNAL_QUERY]: {
    form: PaperFormType.JOURNAL_QUERY;
    bibstem?: string;
    year?: string;
    volume?: string;
    pageid?: string;
  };
  [PaperFormType.REFERENCE_QUERY]: {
    form: PaperFormType.REFERENCE_QUERY;
    reference?: string;
  };
  [PaperFormType.BIBCODE_QUERY]: {
    form: PaperFormType.BIBCODE_QUERY;
    bibcodes?: string;
  };
};

interface IPaperFormServerError {
  form: PaperFormType;
  message: string;
}

const PaperForm: NextPage<{ error?: IPaperFormServerError }> = ({ error: ssrError }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useErrorMessage(ssrError);
  const handleSubmit = useCallback(async (params: PaperFormState[PaperFormType]) => {
    try {
      await router.push(await getSearchQuery(params, queryClient));
    } catch (e) {
      setError({ form: params.form, message: (e as Error).message });
    }
  }, []);

  return (
    <VStack as="article" spacing={5} my={16}>
      <Head>
        <title>Paper Form - NASA Science Explorer</title>
      </Head>
      <JournalQueryForm onSubmit={handleSubmit} error={error?.form === PaperFormType.JOURNAL_QUERY ? error : null} />
      <ReferenceQueryForm
        onSubmit={handleSubmit}
        error={error?.form === PaperFormType.REFERENCE_QUERY ? error : null}
      />
      <BibcodeQueryForm onSubmit={handleSubmit} error={error?.form === PaperFormType.BIBCODE_QUERY ? error : null} />
    </VStack>
  );
};
export default PaperForm;

const validateNotEmpty = pipe(isEmpty, not);

interface SubFormProps {
  onSubmit: (params: PaperFormState[PaperFormType]) => Promise<void>;
  error: IPaperFormServerError;
}

const JournalQueryForm = ({ onSubmit, error }: SubFormProps) => {
  const isClient = useIsClient();
  const router = useRouter();
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
    control,
  } = useForm<PaperFormState['journal-query']>();

  const handleReset = () => reset();

  const formSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    void handleSubmit(onSubmit)(e);
  };

  return (
    <VStack
      aria-labelledby="journal-search-form"
      backgroundColor="gray.50"
      borderRadius={5}
      shadow="base"
      padding={5}
      width="full"
      alignItems="start"
    >
      <Heading as="h2" fontSize="large" fontWeight="bold" id="journal-search-form">
        Journal Search
      </Heading>
      <Text fontSize="sm">
        A bibstem is an abbreviation that the ADS uses to identify a journal. A full list is available{' '}
        <Link isExternal href="http://adsabs.harvard.edu/abs_doc/journal_abbr.html">
          here
        </Link>
        . The input field below will autocomplete on our current database of journal names, allowing you to type
        "Astrophysical Journal", for instance, to find the bibstem "ApJ".
      </Text>
      <Divider mb={5} />
      <form method="POST" action={router.route} onSubmit={formSubmit} data-testid={PaperFormType.JOURNAL_QUERY}>
        <input type="hidden" name="form" value={PaperFormType.JOURNAL_QUERY} {...register('form')} />
        {/* Bibstem picker */}
        <Grid templateColumns="repeat(5, 1fr)" gap={4}>
          <GridItem colSpan={6}>
            {isClient ? (
              <Controller
                name="bibstem"
                control={control}
                render={({ field }) => (
                  <BibstemPicker isMultiple={false} onChange={(value) => field.onChange(value)} {...field} />
                )}
              />
            ) : (
              <FormControl>
                <FormLabel htmlFor="bibstem">Publication</FormLabel>
                <Input id="bibstem" name="bibstem" placeholder="Publication" {...register('bibstem')} />
                <FormErrorMessage>{errors.bibstem && errors.bibstem.message}</FormErrorMessage>
              </FormControl>
            )}
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl>
              <FormLabel htmlFor="year">Year</FormLabel>
              <Input id="year" name="year" placeholder="Year" {...register('year', { maxLength: 4, pattern: /\d+/ })} />
              <FormErrorMessage>{errors.year && errors.year.message}</FormErrorMessage>
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl>
              <FormLabel htmlFor="volume">Volume</FormLabel>
              <Input id="volume" name="volume" placeholder="Volume" {...register('volume')} />
              <FormErrorMessage>{errors.volume && errors.volume.message}</FormErrorMessage>
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl>
              <FormLabel htmlFor="pageid">Page / Id</FormLabel>
              <Input id="pageid" name="pageid" placeholder="Page / Id" {...register('pageid')} />
              <FormErrorMessage>{errors.pageid && errors.pageid.message}</FormErrorMessage>
            </FormControl>
          </GridItem>
        </Grid>
        <Stack direction="row" mt={5}>
          <Button size="sm" isDisabled={isSubmitting} type="submit" isLoading={isSubmitting}>
            Search
          </Button>
          <Button type="reset" variant="outline" onClick={handleReset} isDisabled={isSubmitting}>
            Reset
          </Button>
        </Stack>
      </form>
      {error && (
        <Alert status="error" mt="4">
          <WarningTwoIcon mr="2" />
          {error.message}
        </Alert>
      )}
    </VStack>
  );
};

const ReferenceQueryForm = ({ onSubmit, error }: SubFormProps) => {
  const router = useRouter();
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<PaperFormState['reference-query']>();

  const handleReset = () => reset();
  const formSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    void handleSubmit(onSubmit)(e);
  };

  return (
    <Box
      aria-labelledby="reference-query-form"
      backgroundColor="gray.50"
      borderRadius={5}
      shadow="base"
      padding={5}
      width="full"
    >
      <Heading as="h2" fontSize="large" fontWeight="bold" id="reference-query-form">
        Reference Query
      </Heading>
      <Divider mt={2} mb={4} />
      <form method="POST" onSubmit={formSubmit} action={router.route} data-testid={PaperFormType.REFERENCE_QUERY}>
        <input type="hidden" name="form" value={PaperFormType.REFERENCE_QUERY} {...register('form')} />
        <FormControl isRequired>
          <FormLabel htmlFor="reference">Reference</FormLabel>
          <Input
            name="reference"
            id="reference"
            placeholder="Reference"
            {...register('reference', { required: true, validate: validateNotEmpty })}
          />
          <FormHelperText>Enter a full reference string (eg Smith et al 2000, A&amp;A 362, pp. 333-341</FormHelperText>
          <FormErrorMessage>{errors.reference && errors.reference.message}</FormErrorMessage>
        </FormControl>
        <Stack direction="row" mt={5}>
          <Button size="sm" isDisabled={isSubmitting} type="submit" isLoading={isSubmitting}>
            Search
          </Button>
          <Button type="reset" variant="outline" onClick={handleReset} isDisabled={isSubmitting}>
            Reset
          </Button>
        </Stack>
      </form>
      {error && (
        <Alert status="error" mt="4">
          <WarningTwoIcon mr="2" />
          {error.message}
        </Alert>
      )}
    </Box>
  );
};

const BibcodeQueryForm = ({ onSubmit, error }: SubFormProps) => {
  const router = useRouter();
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<PaperFormState['bibcode-query']>();

  const handleReset = () => reset();
  const formSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    void handleSubmit(onSubmit)(e);
  };

  return (
    <Box
      aria-labelledby="bibstem-query-form"
      backgroundColor="gray.50"
      borderRadius={5}
      shadow="base"
      padding={5}
      width="full"
    >
      <Heading as="h2" fontSize="large" fontWeight="bold" id="bibstem-query-form">
        Bibliographic Code Query
      </Heading>
      <Divider mt={2} mb={4} />
      <form method="POST" onSubmit={formSubmit} action={router.route} data-testid={PaperFormType.BIBCODE_QUERY}>
        <input type="hidden" name="form" value={PaperFormType.BIBCODE_QUERY} {...register('form')} />
        <FormControl isRequired>
          <FormLabel htmlFor="bibcodes">List of Bibcodes</FormLabel>
          <Textarea
            id="bibcodes"
            name="bibcodes"
            {...register('bibcodes', { required: true, validate: validateNotEmpty })}
          />
          <FormHelperText>Enter list of Bibcodes (e.g. 1989ApJ...342L..71R), one per line.</FormHelperText>
          <FormErrorMessage>{errors.bibcodes && errors.bibcodes.message}</FormErrorMessage>
        </FormControl>

        <Stack direction="row" mt={5}>
          <Button size="sm" isDisabled={isSubmitting} type="submit" isLoading={isSubmitting}>
            Search
          </Button>
          <Button type="reset" variant="outline" onClick={handleReset} isDisabled={isSubmitting}>
            Reset
          </Button>
        </Stack>
      </form>
      {error && (
        <Alert status="error" mt="4">
          <WarningTwoIcon mr="2" />
          {error.message}
        </Alert>
      )}
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  if (ctx.req.method == 'POST') {
    const queryClient = new QueryClient();

    type ReqWithBody = typeof ctx.req & {
      body: PaperFormState[PaperFormType];
    };
    const body = (ctx.req as ReqWithBody).body;

    try {
      const destination = await getSearchQuery(body, queryClient);

      return {
        props: {},
        redirect: {
          destination,
          permanent: false,
        },
      };
    } catch (e) {
      return {
        props: {
          error: { form: body.form, message: (e as Error)?.message },
        },
      };
    }
  }

  return { props: {} };
});

const escape = (val?: string): string => (typeof val === 'string' ? DOMPurify.sanitize(val) : '');
const listSanitizer = (v: string): string[] =>
  v.length > 0 ? (Array.from(v.matchAll(/[^\r\n]+/g), head) as string[]) : [];

const listCheck = pipe(escape, listSanitizer);
const createQuery = pipe<
  [PaperFormState[PaperFormType.JOURNAL_QUERY]],
  Omit<PaperFormState[PaperFormType.JOURNAL_QUERY], 'form'>,
  [string, string][],
  string[],
  string[],
  string
>(
  omit(['form']),
  toPairs,
  map(([k, v]) => {
    const clean = escape(v);
    return clean.length > 0 ? `${k}:${clean}` : '';
  }),
  reject(isEmpty),
  join(' '),
);

const stringifyQuery = (q: string) => {
  return stringifySearchParams({
    q,
    sort: ['date desc', 'bibcode desc'],
    p: 1,
  });
};

const journalQueryNotEmpty = pipe<
  [PaperFormState[PaperFormType.JOURNAL_QUERY]],
  Omit<PaperFormState[PaperFormType.JOURNAL_QUERY], 'form'>,
  string[],
  boolean
>(
  omit(['form']),
  values,
  any((v) => v.length > 0),
);

const getSearchQuery = async (formParams: PaperFormState[PaperFormType], queryClient: QueryClient) => {
  switch (formParams.form) {
    case PaperFormType.JOURNAL_QUERY: {
      if (journalQueryNotEmpty(formParams)) {
        return `/search?${stringifyQuery(createQuery(formParams))}`;
      }
      throw new Error('Journal query was empty');
    }
    case PaperFormType.REFERENCE_QUERY: {
      const cleanRef = escape(formParams.reference);
      const params = { text: cleanRef };
      try {
        const { resolved } = await queryClient.fetchQuery({
          queryKey: referenceKeys.text(cleanRef),
          queryFn: fetchReferenceText,
          meta: { params },
        });

        if (resolved.score !== '0.0' && typeof resolved.bibcode === 'string') {
          return `/search?${stringifyQuery(`bibcode:${resolved.bibcode}`)}`;
        }
      } catch (e) {
        throw new Error('Error fetching result from reference resolver');
      }
      throw new Error('No entries found for this reference string');
    }
    case PaperFormType.BIBCODE_QUERY: {
      try {
        const cleanBibs = listCheck(formParams.bibcodes);
        const params = getVaultBigQueryParams(cleanBibs);
        const { qid } = await queryClient.fetchQuery({
          queryKey: vaultKeys.bigquery(cleanBibs),
          queryFn: fetchVaultSearch,
          meta: { params },
        });
        return `/search?${stringifyQuery(`docs(${qid})`)}`;
      } catch (e) {
        throw new Error('Error retrieving result for this set of bibcodes, please try again');
      }
    }
  }
};
