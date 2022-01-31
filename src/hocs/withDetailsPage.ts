import { AppState } from '@store';
import api from '@_api/api';
import { fetchSearch, searchKeys } from '@_api/search';
import { getAbstractParams } from '@_api/search/models';
import axios from 'axios';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { dehydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';

export const withDetailsPage = async (
  ctx: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<Record<string, unknown>>> => {
  const query = normalizeURLParams(ctx.query);
  api.setToken(ctx.req.session.userData.access_token);

  // primary request for this page is search for the bibcode from url
  try {
    // we want to cache this result, for subsequent client-side requests
    const queryClient = new QueryClient();
    const params = getAbstractParams(query.id);
    const primaryResult = await queryClient.fetchQuery({
      queryKey: searchKeys.abstract(query.id),
      queryFn: fetchSearch,
      meta: { params },
    });

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        dehydratedAppState: {
          docs: {
            doc: primaryResult.response.docs[0].bibcode,
          },
        } as AppState,
        id: query.id,
      },
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return {
        props: {
          error: {
            status: e.response.status,
            message: e.message,
          },
        },
      };
    }
    return {
      props: {
        error: {
          status: 500,
          message: 'Unknown server error',
        },
      },
    };
  }
};
