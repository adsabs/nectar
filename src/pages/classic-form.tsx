import { Box } from '@chakra-ui/react';
import { ClassicForm, getSearchQuery, IClassicFormState } from '@components/ClassicForm';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';
import { composeNextGSSP } from '@ssrUtils';

const ClassicFormPage: NextPage<{ ssrError?: string }> = ({ ssrError }) => {
  return (
    <Box as="section" aria-labelledby="form-title" my={16}>
      <Head>
        <title>NASA Science Explorer - Classic Form Search</title>
      </Head>
      <ClassicForm ssrError={ssrError} />
    </Box>
  );
};

/**
 * Takes in raw string and replaces non-word characters with underscores
 * and lowercases entire string
 * @param {string} raw string to be normalized
 * @returns {string} normalized string
 */
// const normalizeString = (raw: string): string => raw.replace(/\W+/g, '_').toLowerCase().trim();

export default ClassicFormPage;

type ReqWithBody = GetServerSidePropsContext['req'] & { body: IClassicFormState };
export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  if (ctx.req.method == 'POST') {
    const body = (ctx.req as ReqWithBody).body;
    try {
      return Promise.resolve({
        props: {},
        redirect: {
          destination: `/search?${getSearchQuery(body)}`,
          permanent: false,
        },
      });
    } catch (e) {
      return Promise.resolve({
        props: {
          ssrError: { message: (e as Error)?.message },
        },
      });
    }
  }

  return Promise.resolve({ props: {} });
});
