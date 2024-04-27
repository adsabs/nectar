import { Box } from '@chakra-ui/react';
import { ClassicForm, getSearchQuery, IClassicFormState } from '@/components/ClassicForm';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';
import { composeNextGSSP } from '@/ssr-utils';
import { parseAPIError } from '@/utils';
import { logger } from '@/logger';

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
    } catch (error) {
      logger.error({ msg: 'GSSP error on classic form page', error });
      return Promise.resolve({
        props: {
          pageError: parseAPIError(error),
        },
      });
    }
  }

  return Promise.resolve({ props: {} });
});
