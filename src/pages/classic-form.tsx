import { Box } from '@chakra-ui/react';
import { ClassicForm, getSearchQuery, IClassicFormState } from '@/components/ClassicForm';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';
import { composeNextGSSP } from '@/ssr-utils';
import { logger } from '@/logger';
import { BRAND_NAME_FULL } from '@/config';
import { useEffect } from 'react';
import { useStore } from '@/store';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { useRouter } from 'next/router';
import { AppMode } from '@/types';
import { syncUrlDisciplineParam } from '@/utils/appMode';

const ClassicFormPage: NextPage<{ ssrError?: string }> = ({ ssrError }) => {
  const router = useRouter();
  const clearSelectedDocs = useStore((state) => state.clearAllSelected);
  const { clearQuery } = useIntermediateQuery();
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const dismissModeNoticeSilently = useStore((state) => state.dismissModeNoticeSilently);
  const urlModePrevious = useStore((state) => state.urlModePrevious);
  const setUrlModePrevious = useStore((state) => state.setUrlModePrevious);
  const urlModeOverride = useStore((state) => state.urlModeOverride);
  const setUrlModeOverride = useStore((state) => state.setUrlModeOverride);

  // clear search on mount
  useEffect(() => {
    clearSelectedDocs();
    clearQuery();
    dismissModeNoticeSilently();
    if (urlModeOverride) {
      const fallbackMode = urlModePrevious ?? AppMode.GENERAL;
      if (mode !== fallbackMode) {
        setMode(fallbackMode);
      }
      setUrlModeOverride(null);
      void syncUrlDisciplineParam(router, fallbackMode);
    }
    if (urlModePrevious) {
      setMode(urlModePrevious);
    }
    setUrlModePrevious(null);
  }, [
    clearQuery,
    clearSelectedDocs,
    dismissModeNoticeSilently,
    mode,
    setMode,
    urlModePrevious,
    setUrlModePrevious,
    urlModeOverride,
    setUrlModeOverride,
    router,
  ]);

  return (
    <Box as="section" aria-labelledby="form-title" my={16}>
      <Head>
        <title>{`${BRAND_NAME_FULL} Classic Form`}</title>
      </Head>
      <ClassicForm ssrError={ssrError} />
    </Box>
  );
};

export default ClassicFormPage;

type ReqWithBody = GetServerSidePropsContext['req'] & {
  body: IClassicFormState;
};
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
